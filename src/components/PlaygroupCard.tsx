// Modified by mattermatter.dev @ Pirate Software, 2026

import {
  useCallback,
  useEffect,
  useRef,
  type Ref,
  type ReactNode,
} from "react";

import { useFerrets, usePlaygroup } from "../hooks/useFerrets";
import { classes } from "../utils/classes";

import IconBack from "./icons/IconBack";
import IconExternal from "./icons/IconExternal";

import Ring from "./Ring";

const headingClass = "text-base text-titlecol dark:text-titlecol-dark";
const rowClass = "flex flex-wrap gap-x-6 gap-y-1 [&>*]:mr-auto";

export interface PlaygroupCardProps {
  playgroup: string;
  onClose?: () => void;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export default function PlaygroupCard(props: PlaygroupCardProps) {
  const { playgroup: playgroupKey, onClose, className, ref, ...extras } = props;
  const playgroup = usePlaygroup(playgroupKey);
  const allFerrets = useFerrets();

  const internalRef = useRef<HTMLDivElement>(null);
  const callbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (ref) {
        if (typeof ref === "function") ref(node);
        else ref.current = node;
      }
      internalRef.current = node;
    },
    [ref],
  );

  const timeout = useRef<NodeJS.Timeout>(null);

  useEffect(() => () => clearTimeout(timeout.current ?? undefined), []);

  if (!playgroup) return null;

  const wikiUrl = `https://ferrets.pirate.wiki/${playgroup.wikipage}`;
  const linkClass =
    "text-textcol dark:text-textcol-dark transition-colors hover:text-highlight dark:hover:text-highlight-dark focus:text-highlight";

  // Parse text with [[Ferret Name]] or [[Ferret Name|Display Text]] patterns and convert to clickable links
  const parseFerretLinks = (text: string | undefined): ReactNode => {
    if (!text || !allFerrets) return text;

    const parts: ReactNode[] = [];
    const regex = /\[\[([^\]]+)\]\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const ferretName = match[1];
      // Find the ferret key by matching the name
      const ferretKey = Object.keys(allFerrets).find(
        (key) => allFerrets[key]?.name === ferretName,
      );

      if (ferretKey) {
        parts.push(
          <a
            key={match.index}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(
                new CustomEvent("fsext:selectFerret", {
                  detail: ferretKey,
                }),
              );
            }}
            className={`${linkClass} underline`}
          >
            {ferretName}
          </a>,
        );
      } else {
        // If ferret not found, just show the text without brackets
        parts.push(ferretName);
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <>
      <div
        className={classes(
          "relative flex max-h-full min-h-[min(28rem,100%)] w-80 max-w-full flex-col justify-start rounded-lg bg-framecol align-top text-xs shadow-xl dark:bg-framecol-dark",
          className,
        )}
        ref={callbackRef}
        data-ferret-card="true"
        {...extras}
      >
        <img
          className="max-h-48 w-full rounded-t-lg object-cover transition-[max-height] duration-700 ease-in-out hover:max-h-96 active:max-h-96"
          src={playgroup.image}
          alt={`Image of the ${playgroup.name} playgroup`}
          loading="lazy"
        />

        <div className="relative flex w-full items-center justify-center bg-tan-alt px-8 py-1 dark:bg-chocolate-alt">
          {onClose && (
            <button
              className="absolute left-0 p-1 transition-colors hover:text-highlight active:text-highlight sm:hidden"
              onClick={onClose}
              type="button"
              aria-label="Close"
            >
              <IconBack size={20} alt="Back arrow" />
            </button>
          )}

          <h2 className="text-text text-base text-balance">
            {playgroup.name}
            {/* { ? " 🌈" : ""} //TODO: valhalla playgroups */}
          </h2>
        </div>
        <div className="mb-2 scrollbar-thin flex flex-auto flex-col gap-1 overflow-y-auto p-2 scrollbar-thumb-chocolate-alt scrollbar-track-tan-alt dark:scrollbar-thumb-chocolate dark:scrollbar-track-chocolate-alt">
          <div>
            <h3 className={headingClass}>Tooltip</h3>
            <p>{parseFerretLinks(playgroup.tooltip)}</p>
          </div>

          <div className={rowClass}>
            <div>
              <h3 className={headingClass}>Description</h3>
              <p>{parseFerretLinks(playgroup.description)}</p>
            </div>
          </div>

          <div className="mt-3 italic">
            <p>
              Learn more about {playgroup.name} on the{" "}
              <a
                href={wikiUrl}
                rel="noreferrer"
                target="_blank"
                className={`text-nowrap ${linkClass}`}
              >
                <span className="underline">Ferret Software Wiki</span>{" "}
                <IconExternal className="mb-0.5 inline-block" size={12} />
              </a>
            </p>
          </div>
        </div>

        <Ring />
      </div>
    </>
  );
}
