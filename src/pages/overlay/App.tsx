// Modified by mattermatter.dev @ Pirate Software, 2026

import { useEffect, useCallback } from "react";

import { classes } from "../../utils/classes";
import { FerretsProvider } from "../../hooks/useFerrets";

import useHiddenCursor from "./hooks/useHiddenCursor";
import useSettings from "./hooks/useSettings";
import useSleeping from "./hooks/useSleeping";

import Overlay from "./components/overlay/Overlay";

// Hide the overlay after X ms of inactivity
const defaultTimeout = 5_000; // when not hovering a card
const cardHoverTimeout = 15_000; // when hovering a card

export default function App() {
  // Show/hide the overlay based on mouse movement
  const settings = useSettings();
  const {
    sleeping,
    wake,
    sleep,
    on: addSleepListener,
    off: removeSleepListener,
  } = useSleeping();

  // When the user interacts, show the overlay
  const mouseInteracted = useCallback(
    (event: React.MouseEvent) => {
      const isCardHovered = !!(
        event.target instanceof Element &&
        event.target.closest('[data-ferret-card="true"]')
      );
      const timeout = isCardHovered ? cardHoverTimeout : defaultTimeout;
      // only wake from sleep when mouse is in left 15% of screen
      if (sleeping && !(event.clientX < window.innerWidth * 0.15)) return;
      wake(timeout);
    },
    [wake, sleeping],
  );

  const otherInteracted = useCallback(
    (event: React.WheelEvent | React.TouchEvent | React.KeyboardEvent) => {
      const isCardHovered = !!(
        event.target instanceof Element &&
        event.target.closest('[data-ferret-card="true"]')
      );
      const timeout = isCardHovered ? cardHoverTimeout : defaultTimeout;
      wake(timeout);
    },
    [wake],
  );

  // Hide the cursor when the user is idle
  const [, showCursor] = useHiddenCursor();

  // When the overlay is awoken, show the cursor
  useEffect(() => {
    addSleepListener("wake", showCursor);
    return () => removeSleepListener("wake", showCursor);
  }, [addSleepListener, removeSleepListener, showCursor]);

  return (
    <FerretsProvider>
      <div
        className={classes(
          "relative mx-4 h-full w-full transition-opacity",
          sleeping &&
            !(
              process.env.NODE_ENV === "development" &&
              settings.disableOverlayHiding.value
            )
            ? "opacity-0 **:pointer-events-none"
            : "opacity-100",
        )}
        onMouseEnter={(e) => mouseInteracted(e)}
        onMouseMove={(e) => mouseInteracted(e)}
        onWheel={(e) => otherInteracted(e)}
        onTouchMove={(e) => otherInteracted(e)}
        onKeyDown={(e) => otherInteracted(e)}
        onMouseLeave={sleep}
      >
        <Overlay />
      </div>
    </FerretsProvider>
  );
}
