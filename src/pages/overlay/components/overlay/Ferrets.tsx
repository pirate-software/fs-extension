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

import { useFerrets as useFerrets } from "../../../../hooks/useFerrets";
import { classes } from "../../../../utils/classes";
import { typeSafeObjectEntries } from "../../../../utils/helpers";
import { sortPartialDates } from "../../../../utils/dateManager";

import type { OverlayOptionProps } from "./Overlay";

import IconChevron from "../../../../components/icons/IconChevron";

const arrowClass =
  "absolute border-0 cursor-pointer text-fs-tan-900 w-full h-[var(--list-fade-padding)] z-20 transition-opacity group pt-[var(--twitch-vertical-padding)] pb-4 box-content";
const arrowSvgClass =
  "mx-auto drop-shadow-lg overflow-visible transition-transform group-hover:scale-125 group-focus:scale-125";
const arrowPathClass =
  "[&_path]:stroke-fs-pink [&_path]:stroke-[0.25rem] [&_path]:[paint-order:stroke] [&_path]:transition-[stroke] [&_path]:group-hover:stroke-highlight [&_path]:group-hover:stroke-[0.375rem] [&_path]:group-focus:stroke-highlight [&_path]:group-focus:stroke-[0.375rem]";
const hiddenClass = "opacity-0 pointer-events-none";

type FerretsProps = OverlayOptionProps;

export default function Ferrets(props: FerretsProps) {
  const {
    context: { activeFerret: activeFerret, setActiveFerret: setActiveFerret },
    className,
  } = props;

  const [selectedPlaygroup, setSelectedPlaygroup] = useState<string>("all");
  const rawFerrets = useFerrets();
  const ferrets = useMemo(
    () =>
      typeSafeObjectEntries(rawFerrets ?? {})
        .filter(
          ([, ferret]) =>
            selectedPlaygroup === "all" ||
            ferret.playgroup === selectedPlaygroup,
        )
        .sort(([, a], [, b]) => sortPartialDates(a.arrival, b.arrival)),
    [rawFerrets, selectedPlaygroup],
  );

  const upArrowRef = useRef<HTMLButtonElement>(null);
  const ferretList = useRef<HTMLDivElement>(null);
  const downArrowRef = useRef<HTMLButtonElement>(null);

  // Scroll the ferrets list to the selected ferret
  useEffect(() => {
    if (!ferretList.current || !activeFerret.key || !activeFerret.isCommand)
      return;

    const offset = 200;
    const anchorElement = ferretList.current.querySelector(
      `#${activeFerret.key}`,
    );
    if (anchorElement instanceof HTMLButtonElement)
      ferretList.current.scrollTo({
        top: Math.max(0, anchorElement.offsetTop - offset),
        behavior: "smooth",
      });
  }, [activeFerret]);

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
    const firstRect = list.firstElementChild?.getBoundingClientRect();
    const lastRect = list.lastElementChild?.getBoundingClientRect();
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
          onScroll={handleArrowVisibility}
        >
          <div className="w-full">
            <select
              className="mx-auto block w-full rounded-lg bg-fs-tan px-2 py-1 text-sm text-fs-black shadow-lg"
              value={selectedPlaygroup}
              onChange={(e) => setSelectedPlaygroup(e.target.value)}
            >
              <option value="all">All Playgroups</option>
              {Object.entries(playgroups)
                .filter(([, group]) => group.name !== playgroups.valhalla.name)
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

      {ferrets.sort().map(([key]) => (
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
