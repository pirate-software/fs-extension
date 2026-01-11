// Modified by mattermatter.dev @ Pirate Software, 2025

import {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
  type SetStateAction,
  type Dispatch,
  type JSX,
} from "react";

import Welcome from "../../../../components/Welcome";
import IconWelcome from "../../../../components/icons/IconWelcome";
import IconFerrets from "../../../../components/icons/IconFerrets";
import IconSettings from "../../../../components/icons/IconSettings";

import { isAliveFerret, useFerrets } from "../../../../hooks/useFerrets";
import { classes } from "../../../../utils/classes";
import { visibleUnderCursor } from "../../../../utils/dom";

import useChatCommand from "../../../../hooks/useChatCommand";

import useSettings from "../../hooks/useSettings";
import useSleeping from "../../hooks/useSleeping";

import FerretsOverlay from "./Ferrets";
import SettingsOverlay from "./Settings";

import Buttons, { type ButtonsOption } from "../Buttons";
import IconRainbow from "../../../../components/icons/IconRainbow";
import playgroups from "@pirate-software/fs-data/build/playgroups";

// Show command-triggered popups for 10s
const commandTimeout = 10_000;

type OverlayOption = ButtonsOption & {
  component: (props: OverlayOptionProps) => JSX.Element;
  condition?: (props: { ferrets: ReturnType<typeof useFerrets> }) => boolean; // condition for the option to be shown
};

const overlayOptions = [
  {
    key: "welcome",
    type: "primary",
    icon: IconWelcome,
    title: "Welcome",
    component: (props) => (
      <Welcome
        {...props}
        className={classes("absolute top-0 left-0 mx-4 my-6", props.className)}
      />
    ),
  },
  {
    key: "ferrets",
    type: "primary",
    icon: IconFerrets,
    title: "Playgroups",
    component: (props) => (
      <FerretsOverlay
        {...props}
        showPlaygroupSelector={true}
        availablePlaygroups={Object.keys(playgroups).filter(
          (pg) => pg !== "valhalla",
        )}
      />
    ),
    condition: ({ ferrets }) =>
      Object.values(ferrets ?? {}).some(isAliveFerret),
  },
  {
    key: "valhalla",
    type: "primary",
    icon: IconRainbow,
    title: "Valhalla",
    component: (props) => (
      <FerretsOverlay
        {...props}
        showPlaygroupSelector={false}
        availablePlaygroups={["valhalla"]}
      />
    ),
    condition: ({ ferrets }) =>
      Object.values(ferrets ?? {}).some((f) => !isAliveFerret(f)),
  },
  {
    key: "settings",
    type: "secondary",
    icon: IconSettings,
    title: "Extension Settings",
    component: SettingsOverlay,
  },
] as const satisfies OverlayOption[];

export const isValidOverlayKey = (key: string) =>
  key === "" || overlayOptions.some((option) => option.key === key);

export type OverlayKey = (typeof overlayOptions)[number]["key"] | "";

type ActiveFerretState = {
  key?: string;
  isCommand?: boolean;
};

export interface OverlayOptionProps {
  context: {
    activeFerret: ActiveFerretState;
    setActiveFerret: Dispatch<SetStateAction<ActiveFerretState>>;
  };
  className?: string;
}

const hiddenClass =
  "invisible opacity-0 -translate-x-10 motion-reduce:translate-x-0";

export default function Overlay() {
  const settings = useSettings();
  const {
    sleeping,
    wake,
    on: addSleepListener,
    off: removeSleepListener,
  } = useSleeping();

  const ferrets = useFerrets();
  const options = useMemo(
    () =>
      overlayOptions.filter(
        (option) =>
          !("condition" in option) || option.condition({ ferrets: ferrets }),
      ),
    [ferrets],
  );

  const [activeFerret, setActiveFerret] = useState<ActiveFerretState>({});
  const [visibleOption, setVisibleOption] = useState<OverlayKey>(
    settings.openedMenu.value,
  );
  const timeoutRef = useRef<NodeJS.Timeout>(null);
  const awakingRef = useRef(false);

  // update setting when opened menu changes
  useEffect(() => {
    settings.openedMenu.change(visibleOption);
  }, [visibleOption]);

  // open saved (or default) menu when mounted
  useEffect(() => {
    setVisibleOption(settings.openedMenu.value);
  }, [settings.openedMenu.value]);

  // When a chat command is run, wake the overlay
  useChatCommand(
    useCallback(
      (command: string) => {
        if (!settings.disableChatPopup.value) {
          const ferret = ferrets?.[command];
          if (ferret) setActiveFerret({ key: command, isCommand: true });
          else if (command !== "welcome") return;

          // Show the card
          setVisibleOption(ferret ? "ferrets" : "welcome");

          // Dismiss the overlay after a delay
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            setVisibleOption("");
            setActiveFerret({});
          }, commandTimeout);

          // Track that we're waking up, so that we don't immediately clear the timeout, and wake the overlay
          awakingRef.current = true;
          wake(commandTimeout);
        }
      },
      [settings.disableChatPopup.value, ferrets, wake],
    ),
  );

  // Ensure we clean up the timer when we unmount
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  // If the user interacts with the overlay, clear the auto-dismiss timer
  // Except if we just triggered this wake, in which case we want to ignore it
  useEffect(() => {
    const callback = () => {
      if (awakingRef.current) awakingRef.current = false;
      else if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    addSleepListener("wake", callback);
    return () => removeSleepListener("wake", callback);
  }, [addSleepListener, removeSleepListener]);

  // Handle body clicks, dismissing the overlay if the user clicks outside of it
  const bodyClick = useCallback((e: MouseEvent) => {
    if (!visibleUnderCursor(e)) {
      setVisibleOption("");
    }
  }, []);

  // If the user clicks anywhere in the body, except the overlay itself, close the panels
  // Bind it during the capture phase so that we can process it before any other click handlers
  useEffect(() => {
    document.body.addEventListener("click", bodyClick, true);
    return () => document.body.removeEventListener("click", bodyClick, true);
  }, [bodyClick]);

  // Handle body double clicks, ignoring them inside of overlay elements
  const bodyDblClick = useCallback((e: MouseEvent) => {
    if (visibleUnderCursor(e)) {
      e.stopPropagation();
    }
  }, []);

  // If the user double clicks anywhere in the overlay itself, stop propagating the event
  // This stops double clicks from toggling fullscreen video which is the default behavior
  useEffect(() => {
    document.body.addEventListener("dblclick", bodyDblClick, true);
    return () =>
      document.body.removeEventListener("dblclick", bodyDblClick, true);
  }, [bodyDblClick]);

  // Generate the context for the overlay options
  const context = useMemo<OverlayOptionProps["context"]>(
    () => ({
      activeFerret: activeFerret,
      setActiveFerret: setActiveFerret,
    }),
    [activeFerret],
  );

  // Set visible option to relevant tab when activeFerret changes
  useEffect(() => {
    if (!activeFerret) return;
    const ferret = ferrets?.[activeFerret.key ?? ""];
    if (!ferret) return;
    setVisibleOption(ferret.playgroup === "valhalla" ? "valhalla" : "ferrets"); //TODO: the list of playgroups per option isn't exposed since it's part of the result of the compoment function, would probably need more refactoring to support multiple playgroup-specific tabs, but since that's not likely to be needed, this bodge will do.
  }, [activeFerret]);

  return (
    <div
      className={classes(
        "flex h-full w-full transition-[opacity,visibility,transform,translate] will-change-[opacity,transform,translate]",
        sleeping &&
          !(
            process.env.NODE_ENV === "development" &&
            settings.disableOverlayHiding.value
          ) &&
          hiddenClass,
      )}
    >
      <Buttons
        options={options}
        onClick={setVisibleOption}
        active={visibleOption}
      />
      <div className="relative h-full w-full">
        {options.map((option) => (
          <option.component
            key={option.key}
            context={context}
            className={classes(
              "transition-[opacity,visibility,transform,translate] will-change-[opacity,transform,translate]",
              visibleOption !== option.key && hiddenClass,
            )}
          />
        ))}
      </div>
    </div>
  );
}
