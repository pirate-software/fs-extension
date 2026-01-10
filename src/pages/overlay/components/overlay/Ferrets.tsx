// Modified by mattermatter.dev @ Pirate Software, 2025

import {
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
import playgroups from "@pirate-software/fs-data/build/playgroups";
import { Transition } from "@headlessui/react";

import FerretCard from "../../../../components/FerretCard";
import FerretButton from "../../../../components/FerrretButton";
import Ring from "../../../../components/Ring";

import { useFerrets as useFerrets } from "../../../../hooks/useFerrets";
import { classes } from "../../../../utils/classes";
import { typeSafeObjectEntries } from "../../../../utils/helpers";

import type { OverlayOptionProps } from "./Overlay";

import IconChevron from "../../../../components/icons/IconChevron";
import type { Ferret } from "@pirate-software/fs-data/build/ferrets/core";

const arrowClass =
  "absolute border-0 cursor-pointer text-chocolate-deep w-full h-[var(--list-fade-padding)] z-20 transition-opacity group pt-[var(--twitch-vertical-padding)] box-content";
const arrowSvgClass =
  "mx-auto drop-shadow-lg overflow-visible transition-transform group-hover:scale-125 group-focus:scale-125";
const arrowPathClass =
  "[&_path]:stroke-tan [&_path]:stroke-[0.25rem] [&_path]:[paint-order:stroke] [&_path]:transition-[stroke] [&_path]:group-hover:stroke-highlight [&_path]:group-hover:stroke-[0.375rem] [&_path]:group-focus:stroke-highlight [&_path]:group-focus:stroke-[0.375rem]";
const hiddenClass = "opacity-0 pointer-events-none";

export interface FerretsProps extends OverlayOptionProps {
  filterFerrets?: (ferret: Ferret) => boolean;
  showPlaygroupSelector: boolean;
}

export default function Ferrets(props: FerretsProps) {
  const {
    context: { activeFerret: activeFerret, setActiveFerret: setActiveFerret },
    className,
    filterFerrets,
    showPlaygroupSelector,
  } = props;

  const [selectedPlaygroup, setSelectedPlaygroup] = useState<string>("all");
  const rawFerrets = useFerrets();
  const ferrets = useMemo(
    () =>
      typeSafeObjectEntries(rawFerrets ?? {})
        .filter(
          ([, ferret]) =>
            (selectedPlaygroup === "all" ||
              ferret.playgroup === selectedPlaygroup) &&
            (filterFerrets ? filterFerrets(ferret) : true),
        )
        .sort(([, a], [, b]) => a.name.localeCompare(b.name)),
    [rawFerrets, selectedPlaygroup, filterFerrets],
  );

  const upArrowRef = useRef<HTMLButtonElement>(null);
  const ferretList = useRef<HTMLDivElement>(null);
  const downArrowRef = useRef<HTMLButtonElement>(null);
  const playgroupSelector = useRef<HTMLDivElement>(null);

  // Scroll the ferrets list to the selected ferret
  useEffect(() => {
    if (!ferretList.current || !activeFerret.key) return;

    const offset = 200; // offset to put card at top
    const anchorElement = ferretList.current.querySelector(
      `#${activeFerret.key}`,
    );
    if (anchorElement instanceof HTMLElement) {
      ferretList.current.scrollTo({
        top: Math.max(0, anchorElement.offsetTop - offset),
        behavior: "smooth",
      });
    }
  }, [activeFerret.key]);

  // Allow the list to be scrolled via the buttons
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

  // Ensure the buttons are only shown if the list is scrollable
  const handleArrowVisibility = useCallback(() => {
    const list = ferretList.current;
    if (!list) return;

    const listRect = list.getBoundingClientRect();
    const children = Array.from(list.children).filter(
      (el) => el !== playgroupSelector.current,
    );
    if (!children || children.length === 0) return;
    const firstRect = children[0]?.getBoundingClientRect();
    const lastRect = children[children.length - 1]?.getBoundingClientRect();
    if (!firstRect || !lastRect) return;

    // If more than 50% of the first element is hidden, show the up arrow
    for (const className of hiddenClass.split(" "))
      upArrowRef.current?.classList.toggle(
        className,
        firstRect.top >= listRect.top + firstRect.height / 2,
      );

    // If more than 50% of the last element is hidden, show the down arrow
    for (const className of hiddenClass.split(" "))
      downArrowRef.current?.classList.toggle(
        className,
        lastRect.bottom <= listRect.bottom - lastRect.height / 2,
      );
  }, []);

  // Check the arrow visibility on mount, as browsers restore odd scroll positions
  // Also, check it whenever the ferret list changes as the list may change size
  useEffect(() => {
    handleArrowVisibility();

    // If the window is resized, check the arrow visibility again
    window.addEventListener("resize", handleArrowVisibility);
    return () => window.removeEventListener("resize", handleArrowVisibility);
  }, [handleArrowVisibility, ferrets]);

  // When changing playgroup, trigger event (used by FerretCard)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) setSelectedPlaygroup(detail);
    };

    window.addEventListener("fsext:selectPlaygroup", handler as EventListener);
    return () =>
      window.removeEventListener(
        "fsext:selectPlaygroup",
        handler as EventListener,
      );
  }, []);

  // Switch ferret (used by FerretCard)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) {
        setActiveFerret({ key: detail });
        // If the new ferret isn't in the current playgroup, switch to "all"
        const ferretToSelect = rawFerrets?.[detail];
        if (
          ferretToSelect &&
          selectedPlaygroup !== "all" &&
          ferretToSelect.playgroup !== selectedPlaygroup
        ) {
          setSelectedPlaygroup("all");
        }
      }
    };

    window.addEventListener("fsext:selectFerret", handler as EventListener);
    return () =>
      window.removeEventListener(
        "fsext:selectFerret",
        handler as EventListener,
      );
  }, [setActiveFerret, selectedPlaygroup, rawFerrets]);

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
    if (activeFerret.key) {
      const found = ferrets.find(([key]) => key === activeFerret.key);
      if (
        found &&
        (selectedPlaygroup === "all" ||
          found[1]?.playgroup === selectedPlaygroup)
      ) {
        scrollToAnchor(activeFerret.key);
      } else {
        scrollToAnchor();
      }
    } else {
      scrollToAnchor();
    }

    // Trigger arrow buttons update
    const t = window.setTimeout(() => handleArrowVisibility(), 200);
    return () => window.clearTimeout(t);
  }, [selectedPlaygroup, ferrets, handleArrowVisibility]);

  return (
    <div
      className={classes(
        "absolute top-0 left-0 z-0 grid h-full grid-cols-auto-2 grid-rows-1",
        className,
      )}
    >
      <div className="relative z-10 flex flex-col items-center">
        <div
          ref={ferretList}
          className="list-fade -my-[var(--twitch-vertical-padding)] scrollbar-none flex w-40 flex-col items-center gap-4 overflow-scroll px-4 py-[calc(var(--twitch-vertical-padding)+var(--list-fade-padding))]"
          onScroll={(e) => {
            handleArrowVisibility();
            // Update shadow based on scroll position
            const select = e.currentTarget.querySelector("select");
            select?.setAttribute(
              "data-at-top",
              e.currentTarget.scrollTop === 0 ? "true" : "false",
            );
          }}
        >
          {showPlaygroupSelector && (
            <div ref={playgroupSelector} className="sticky top-0 z-30 w-full">
              {/* Extra div needed to add padding for dropdown arrow. Makes the dropdown box position funky though */}
              <div
                className="transition-ring relative w-full rounded-lg bg-framecol px-2 py-1 pr-1 dark:bg-framecol-dark"
                data-at-top="true"
              >
                <Ring thickBottom={false} className="rounded-lg" />
                <select
                  className="text-text mx-auto block w-full border-0 bg-framecol text-sm outline-0 dark:bg-framecol-dark"
                  value={selectedPlaygroup}
                  onChange={(e) => setSelectedPlaygroup(e.target.value)}
                >
                  <option value="all">All Playgroups</option>
                  {(Object.entries(playgroups) as [string, { name: string }][]) //TODO: this is quite messy. the function is to ensure playgroups are ordered as all, genpop, solo, then rest alphabetical a-z.
                    .filter(([playgroupKey]) =>
                      Object.values(rawFerrets ?? {}).some(
                        (ferret) => ferret.playgroup === playgroupKey,
                      ),
                    )
                    .sort(([, a], [, b]) => {
                      const prioGroups = new Set<string>([
                        playgroups.genpop.name,
                        playgroups.solo.name,
                      ]); // genpop and solo first in list
                      return prioGroups.has(String(a.name)) ===
                        prioGroups.has(String(b.name))
                        ? a.name.localeCompare(b.name)
                        : prioGroups.has(String(a.name))
                          ? -1
                          : 1;
                    })
                    .map(([key, group]) => (
                      <option key={key} value={key}>
                        {group.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}
          {ferrets.map(([key]) => (
            <FerretButton
              key={key}
              ferret={key}
              onClick={() => {
                setActiveFerret((prev) => (prev.key === key ? {} : { key }));
              }}
              className="w-full"
              active={activeFerret.key === key}
            />
          ))}
        </div>

        <button
          ref={upArrowRef}
          className={classes(
            arrowClass,
            "-top-[var(--twitch-vertical-padding)]",
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
          ref={downArrowRef}
          className={classes(
            arrowClass,
            "-bottom-[var(--twitch-vertical-padding)] rotate-180",
          )}
          onClick={(e) => ferretListScroll(e, -250)}
          title="Scroll down"
          type="button"
          data-transparent-clicks
        >
          <IconChevron className={classes(arrowSvgClass, arrowPathClass)} />
        </button>
      </div>

      {ferrets.map(([key]) => (
        <Transition show={activeFerret.key === key} key={key}>
          <FerretCard
            key={key}
            ferret={key}
            onClose={() => setActiveFerret({})}
            className="z-0 col-start-2 row-start-1 origin-[center_left] self-center transition-[opacity,transform,translate] will-change-[opacity,transform,translate] data-[closed]:-translate-x-10 data-[closed]:opacity-0 data-[closed]:motion-reduce:translate-x-0"
          />
        </Transition>
      ))}
    </div>
  );
}
