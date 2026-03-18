// Modified by mattermatter.dev @ Pirate Software, 2025

import {
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type MouseEvent,
} from "react";
import { Transition } from "@headlessui/react";

import FerretCard from "../../../../components/FerretCard";
import FerretButton from "../../../../components/FerretButton";

import { useFerrets, usePlaygroups } from "../../../../hooks/useFerrets";
import { classes } from "../../../../utils/classes";
import { typeSafeObjectEntries } from "../../../../utils/helpers";

import type { OverlayOptionProps } from "./Overlay";

import IconChevron from "../../../../components/icons/IconChevron";
import type { Ferret } from "@pirate-software/fs-data/build/ferrets/ferrets";
import type { Playgroup } from "@pirate-software/fs-data/build/ferrets/playgroups";
import PlaygroupButton from "../../../../components/PlaygroupButton";
import PlaygroupCard from "../../../../components/PlaygroupCard";

const arrowClass =
  "absolute border-0 cursor-pointer text-chocolate-deep w-full h-[var(--list-fade-padding)] z-20 transition-opacity group pt-[var(--twitch-vertical-padding)] box-content";
const arrowSvgClass =
  "mx-auto drop-shadow-lg overflow-visible transition-transform group-hover:scale-125 group-focus:scale-125";
const arrowPathClass =
  "[&_path]:stroke-tan [&_path]:stroke-[0.25rem] [&_path]:[paint-order:stroke] [&_path]:transition-[stroke] [&_path]:group-hover:stroke-highlight [&_path]:group-hover:stroke-[0.375rem] [&_path]:group-focus:stroke-highlight [&_path]:group-focus:stroke-[0.375rem]";
const hiddenClass = "opacity-0 pointer-events-none";

export interface FerretsProps extends OverlayOptionProps {
  showPlaygroupSelector: boolean;
  ferretFilter: (ferret: Ferret) => boolean;
}

export default function Ferrets(props: FerretsProps) {
  const {
    context: { activeCard, setActiveCard },
    className,
    ferretFilter,
  } = props;

  const rawFerrets = useFerrets(); // all ferrets, unfiltered
  const rawPlaygroups = usePlaygroups();

  const filteredFerrets = useMemo((): Record<string, Ferret> => {
    return Object.fromEntries(
      typeSafeObjectEntries(rawFerrets).filter(([, ferret]) =>
        ferretFilter(ferret),
      ),
    );
  }, [rawFerrets, ferretFilter]);

  const filteredPlaygroups = useMemo((): Record<string, Playgroup> => {
    return Object.fromEntries(
      typeSafeObjectEntries(rawPlaygroups).filter(([, group]) =>
        Object.values(filteredFerrets).some(
          (ferret) => ferret.playgroup === group.name,
        ),
      ),
    );
  }, [rawFerrets, rawPlaygroups]);

  const availablePlaygroups = useMemo(
    () =>
      typeSafeObjectEntries(filteredPlaygroups)
        .filter(
          ([key]) =>
            activeCard.playgroup === "all" || key === activeCard.playgroup,
        )
        .sort(([, a], [, b]) => {
          // sort by number of ferrets
          const aCount = Object.values(rawFerrets ?? {}).filter(
            (ferret) => ferret.playgroup === a.name,
          ).length;
          const bCount = Object.values(rawFerrets ?? {}).filter(
            (ferret) => ferret.playgroup === b.name,
          ).length;
          return bCount - aCount;
        }),
    [filteredPlaygroups],
  );

  const selectedFerrets = useMemo(
    // only ferrets in the selected playgroup
    () =>
      typeSafeObjectEntries(filteredFerrets)
        .filter(
          ([, ferret]) =>
            activeCard.playgroup === "all" ||
            ferret.playgroup === activeCard.playgroup,
        )
        .sort(([, a], [, b]) => a.name.localeCompare(b.name)),
    [filteredFerrets, activeCard],
  );

  const ferretUpArrowRef = useRef<HTMLButtonElement>(null);
  const ferretList = useRef<HTMLDivElement>(null);
  const ferretDownArrowRef = useRef<HTMLButtonElement>(null);

  const playgroupUpArrowRef = useRef<HTMLButtonElement>(null);
  const playgroupList = useRef<HTMLDivElement>(null);
  const playgroupDownArrowRef = useRef<HTMLButtonElement>(null);

  // Scroll the ferrets list to the selected ferret
  useEffect(() => {
    if (!ferretList.current || !activeCard.ferret) return;

    const offset = 200; // offset to put card at top
    const anchorElement = ferretList.current.querySelector(
      `#${activeCard.ferret}`,
    );
    if (anchorElement instanceof HTMLElement) {
      ferretList.current.scrollTo({
        top: Math.max(0, anchorElement.offsetTop - offset),
        behavior: "smooth",
      });
    }
  }, [activeCard.ferret]);

  // Scroll the playgroups list to the selected playgroup
  useEffect(() => {
    if (!playgroupList.current || !activeCard.playgroup) return;

    //TODO: fix
    // const offset = 200; // offset to put card at top
    // const anchorElement = playgroupList.current.querySelector(
    //   `#${activeCard.playgroup}`,
    // );
    // if (anchorElement instanceof HTMLElement) {
    //   playgroupList.current.scrollTo({
    //     top: Math.max(0, anchorElement.offsetTop - offset),
    //     behavior: "smooth",
    //   });
    // }
  }, [activeCard.playgroup]);

  // Allow the ferret list to be scrolled via the buttons
  const ferretListScroll = useCallback(
    (event: MouseEvent, direction: number) => {
      if (ferretList.current) {
        event.stopPropagation();

        ferretList.current.scroll({
          top: ferretList.current.scrollTop - direction,
          left: 0,
          behavior: "smooth",
        });
      }
    },
    [],
  );

  // Allow the playgroup list to be scrolled via the buttons
  const playgroupListScroll = useCallback(
    (event: MouseEvent, direction: number) => {
      if (playgroupList.current) {
        event.stopPropagation();

        playgroupList.current.scroll({
          top: playgroupList.current.scrollTop - direction,
          left: 0,
          behavior: "smooth",
        });
      }
    },
    [],
  );

  // Ensure the buttons are only shown if the list is scrollable
  const handleFerretArrowVisibility = useCallback(() => {
    const list = ferretList.current;
    if (!list) return;

    const listRect = list.getBoundingClientRect();
    const children = list.children;
    if (!children || children.length === 0) return;
    const firstRect = children[0]?.getBoundingClientRect();
    const lastRect = children[children.length - 1]?.getBoundingClientRect();
    if (!firstRect || !lastRect) return;

    // If more than 50% of the first element is hidden, show the up arrow
    for (const className of hiddenClass.split(" "))
      ferretUpArrowRef.current?.classList.toggle(
        className,
        firstRect.top >= listRect.top + firstRect.height / 2,
      );

    // If more than 50% of the last element is hidden, show the down arrow
    for (const className of hiddenClass.split(" "))
      ferretDownArrowRef.current?.classList.toggle(
        className,
        lastRect.bottom <= listRect.bottom - lastRect.height / 2,
      );
  }, []);

  const handlePlaygroupArrowVisibility = useCallback(() => {
    const list = playgroupList.current;
    if (!list) return;

    const listRect = list.getBoundingClientRect();
    const children = list.children;
    if (!children || children.length === 0) return;
    const firstRect = children[0]?.getBoundingClientRect();
    const lastRect = children[children.length - 1]?.getBoundingClientRect();
    if (!firstRect || !lastRect) return;

    // If more than 50% of the first element is hidden, show the up arrow
    for (const className of hiddenClass.split(" "))
      playgroupUpArrowRef.current?.classList.toggle(
        className,
        firstRect.top >= listRect.top + firstRect.height / 2,
      );

    // If more than 50% of the last element is hidden, show the down arrow
    for (const className of hiddenClass.split(" "))
      playgroupDownArrowRef.current?.classList.toggle(
        className,
        lastRect.bottom <= listRect.bottom - lastRect.height / 2,
      );
  }, []);

  // Check the arrow visibility on mount, as browsers restore odd scroll positions
  // Also, check it whenever the ferret list changes as the list may change size
  useEffect(() => {
    handleFerretArrowVisibility();

    // If the window is resized, check the arrow visibility again
    window.addEventListener("resize", handleFerretArrowVisibility);
    return () =>
      window.removeEventListener("resize", handleFerretArrowVisibility);
  }, [handleFerretArrowVisibility, selectedFerrets]);

  useEffect(() => {
    handlePlaygroupArrowVisibility();

    // If the window is resized, check the arrow visibility again
    window.addEventListener("resize", handlePlaygroupArrowVisibility);
    return () =>
      window.removeEventListener("resize", handlePlaygroupArrowVisibility);
  }, [handlePlaygroupArrowVisibility, selectedFerrets]);

  // When changing playgroup, trigger event (used by FerretCard)
  useEffect(() => {
    const handler = (e: Event) => {
      console.log(
        "detail",
        (e as CustomEvent<string>).detail,
        "activeCard",
        activeCard,
      );
      const detail = (e as CustomEvent<string>).detail;
      if (activeCard.playgroup === detail) return;
      else {
        const currentFerret = rawFerrets?.[activeCard.ferret ?? ""];
        if (currentFerret?.playgroup === detail) {
          setActiveCard({ ferret: activeCard.ferret, playgroup: detail });
        } else {
          setActiveCard({ playgroup: detail });
        }
      }
    };

    window.addEventListener("fsext:selectPlaygroup", handler as EventListener);
    return () =>
      window.removeEventListener(
        "fsext:selectPlaygroup",
        handler as EventListener,
      );
  }, [activeCard, setActiveCard, rawFerrets]);

  // Switch ferret (used by FerretCard)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) {
        const ferret = rawFerrets?.[detail];
        if (!ferret) return;
        // If the new ferret isn't in the current playgroup, switch to "all"
        const ferretToSelect = rawFerrets?.[detail];
        if (!ferretToSelect) {
          console.error(`Ferret ${detail} not found`);
          return;
        }
        if (
          activeCard.playgroup !== "all" &&
          ferretToSelect.playgroup !== activeCard.playgroup
        ) {
          setActiveCard({ ferret: detail, playgroup: "all" });
        } else if (ferretToSelect.playgroup === activeCard.playgroup) {
          setActiveCard({ ferret: detail, playgroup: activeCard.playgroup });
        }
      }
    };

    window.addEventListener("fsext:selectFerret", handler as EventListener);
    return () =>
      window.removeEventListener(
        "fsext:selectFerret",
        handler as EventListener,
      );
  }, [setActiveCard, rawFerrets]);

  //TEMP
  useEffect(() => {
    console.log("Current selection changed", activeCard);
  }, [activeCard]);

  // When ferret/playgroup changes, scroll to selected ferret
  useEffect(() => {
    const list = ferretList.current;
    if (!list) return;

    const offset = 200;

    const scrollToAnchor = (anchorId?: string) => {
      if (anchorId) {
        const anchorElement = list.querySelector(`#${anchorId}`);
        if (anchorElement instanceof HTMLElement) {
          list.scrollTo({
            top: Math.max(0, anchorElement.offsetTop - offset),
            behavior: "auto",
          });
          return;
        }
      } else {
        // Scroll to top
        list.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    };

    // If ferret in selected playgroup, scroll to it
    if (activeCard.ferret) {
      const found = selectedFerrets.find(([key]) => key === activeCard.ferret);
      if (
        found &&
        (activeCard.playgroup === "all" ||
          found[1]?.playgroup === activeCard.playgroup)
      ) {
        scrollToAnchor(activeCard.ferret);
      } else {
        scrollToAnchor();
      }
    } else {
      scrollToAnchor();
    }

    // Trigger arrow buttons update
    const t = window.setTimeout(() => {
      handleFerretArrowVisibility();
      handlePlaygroupArrowVisibility();
    }, 200);
    return () => window.clearTimeout(t);
  }, [
    activeCard.playgroup,
    selectedFerrets,
    handleFerretArrowVisibility,
    handlePlaygroupArrowVisibility,
  ]);

  return (
    <div
      className={classes(
        "absolute top-0 left-0 z-0 grid h-full grid-cols-auto-4 grid-rows-1",
        className,
      )}
    >
      {/* Playgroups */}
      <div className="relative z-10 flex flex-col items-center">
        <div
          ref={playgroupList}
          className="list-fade -my-(--twitch-vertical-padding) scrollbar-none flex w-40 flex-col items-center gap-4 overflow-scroll px-4 py-[calc(var(--twitch-vertical-padding)+var(--list-fade-padding))]"
          onScroll={(e) => {
            handlePlaygroupArrowVisibility();
            // Update shadow based on scroll position
            const select = e.currentTarget.querySelector("select");
            select?.setAttribute(
              "data-at-top",
              e.currentTarget.scrollTop === 0 ? "true" : "false",
            );
          }}
        >
          {Object.entries(filteredPlaygroups).map(([key]) => (
            <PlaygroupButton
              key={key}
              name={key}
              onClick={() => {
                setActiveCard((prev) =>
                  prev.playgroup === key ? {} : { playgroup: key },
                );
              }}
            />
          ))}
        </div>

        <button
          ref={playgroupUpArrowRef}
          className={classes(
            arrowClass,
            "-top-(--twitch-vertical-padding)",
            hiddenClass,
          )}
          onClick={(e) => playgroupListScroll(e, 250)}
          title="Scroll up"
          type="button"
          data-transparent-clicks
        >
          <IconChevron className={classes(arrowSvgClass, arrowPathClass)} />
        </button>

        <button
          ref={playgroupDownArrowRef}
          className={classes(
            arrowClass,
            "-bottom-(--twitch-vertical-padding) rotate-180",
          )}
          onClick={(e) => playgroupListScroll(e, -250)}
          title="Scroll down"
          type="button"
          data-transparent-clicks
        >
          <IconChevron className={classes(arrowSvgClass, arrowPathClass)} />
        </button>
      </div>

      {availablePlaygroups.map(([key]) => (
        <Transition show={activeCard.playgroup === key} key={key}>
          <PlaygroupCard
            key={key}
            playgroup={key}
            onClose={() => setActiveCard({})}
            className="z-0 col-start-2 row-start-1 origin-[center_left] self-center transition-[opacity,transform,translate] will-change-[opacity,transform,translate] data-closed:-translate-x-10 data-closed:opacity-0 data-closed:motion-reduce:translate-x-0"
          />
        </Transition>
      ))}

      {/* Ferrets */}
      <Transition show={activeCard.playgroup !== undefined}>
        <div className="relative z-10 flex origin-[center_left] flex-col items-center transition-[opacity,transform,translate] will-change-[opacity,transform,translate] data-closed:-translate-x-10 data-closed:opacity-0 data-closed:motion-reduce:translate-x-0">
          <div
            ref={ferretList}
            className="list-fade -my-(--twitch-vertical-padding) scrollbar-none flex w-40 flex-col items-center gap-4 overflow-scroll px-4 py-[calc(var(--twitch-vertical-padding)+var(--list-fade-padding))]"
            onScroll={(e) => {
              handleFerretArrowVisibility();
              // Update shadow based on scroll position
              const select = e.currentTarget.querySelector("select");
              select?.setAttribute(
                "data-at-top",
                e.currentTarget.scrollTop === 0 ? "true" : "false",
              );
            }}
          >
            {selectedFerrets.map(([key]) => (
              <FerretButton
                key={key}
                ferret={key}
                onClick={() => {
                  setActiveCard((prev) =>
                    prev.ferret === key
                      ? { playgroup: prev.playgroup }
                      : { ferret: key, playgroup: activeCard.playgroup },
                  );
                }}
                className="w-full"
                active={activeCard.ferret === key}
              />
            ))}
          </div>
          <button
            ref={ferretUpArrowRef}
            className={classes(
              arrowClass,
              "-top-(--twitch-vertical-padding)",
              hiddenClass,
            )}
            onClick={(e) => ferretListScroll(e, 250)}
            title="Scroll up"
            type="button"
            data-transparent-clicks
          >
            <IconChevron className={classes(arrowSvgClass, arrowPathClass)} />
          </button>

          <button
            ref={ferretDownArrowRef}
            className={classes(
              arrowClass,
              "-bottom-(--twitch-vertical-padding) rotate-180",
            )}
            onClick={(e) => ferretListScroll(e, -250)}
            title="Scroll down"
            type="button"
            data-transparent-clicks
          >
            <IconChevron className={classes(arrowSvgClass, arrowPathClass)} />
          </button>
        </div>
      </Transition>

      {selectedFerrets.map(([key]) => (
        <Transition show={activeCard.ferret === key} key={key}>
          <FerretCard
            key={key}
            ferret={key}
            onClose={() => setActiveCard({ playgroup: activeCard.playgroup })}
            className="z-0 col-start-4 row-start-1 origin-[center_left] self-center transition-[opacity,transform,translate] will-change-[opacity,transform,translate] data-closed:-translate-x-10 data-closed:opacity-0 data-closed:motion-reduce:translate-x-0"
          />
        </Transition>
      ))}
    </div>
  );
}
