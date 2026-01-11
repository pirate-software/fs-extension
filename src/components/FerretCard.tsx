// Modified by mattermatter.dev @ Pirate Software, 2025

import {
  useCallback,
  useEffect,
  useRef,
  type Ref,
  type ReactNode,
} from "react";
import type { CreateTypes } from "canvas-confetti";
import Confetti from "react-canvas-confetti";

import {
  calculateAge,
  formatDate,
  formatBirthday,
  isBirthday,
} from "../utils/dateManager";
import { isAliveFerret, useFerret, useFerrets } from "../hooks/useFerrets";
import { classes } from "../utils/classes";

import IconBack from "./icons/IconBack";
import IconExternal from "./icons/IconExternal";

import Ring from "./Ring";

import moderatorBadge from "../assets/mod.svg";
import partyHat from "../assets/party.svg";
import playgroups from "@pirate-software/fs-data/build/playgroups";
import IconInfo from "./icons/IconInfo";
import Tooltip from "./Tooltip";

const headingClass = "text-base text-titlecol dark:text-titlecol-dark";
const rowClass = "flex flex-wrap gap-x-6 gap-y-1 [&>*]:mr-auto";

export interface FerretCardProps {
  ferret: string;
  onClose?: () => void;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export default function FerretCard(props: FerretCardProps) {
  const { ferret: ferretKey, onClose, className, ref, ...extras } = props;
  const ferret = useFerret(ferretKey);
  const allFerrets = useFerrets();

  const mod =
    window?.Twitch?.ext?.viewer?.role === "broadcaster" ||
    window?.Twitch?.ext?.viewer?.role === "moderator";

  const birthday = ferret
    ? isBirthday(ferret.birth || null, ferret.birthday || null)
    : false;
  const age = ferret?.birth ? calculateAge(ferret.birth) : "Unknown";
  const birth =
    ferret?.birth?.split("-").length === 3
      ? formatDate(ferret.birth)
      : ferret?.birthday
        ? formatBirthday(ferret.birthday)
        : "Unknown";

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
  const confettiInit = useCallback(
    ({ confetti }: { confetti: CreateTypes }) => {
      const node = internalRef.current;
      if (
        !node ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;

      timeout.current = setTimeout(() => {
        const rect = node.getBoundingClientRect();
        const origin = {
          x: (rect.x + rect.width / 2) / window.innerWidth,
          y: (rect.y + rect.height / 2) / window.innerHeight,
        };

        confetti({
          spread: 26,
          startVelocity: 55,
          origin,
          particleCount: Math.floor(200 * 0.25),
        });
        confetti({
          spread: 60,
          origin,
          particleCount: Math.floor(200 * 0.2),
        });
        confetti({
          spread: 100,
          decay: 0.91,
          scalar: 0.8,
          origin,
          particleCount: Math.floor(200 * 0.35),
        });
        confetti({
          spread: 120,
          startVelocity: 25,
          decay: 0.92,
          scalar: 1.2,
          origin,
          particleCount: Math.floor(200 * 0.1),
        });
        confetti({
          spread: 120,
          startVelocity: 45,
          origin,
          particleCount: Math.floor(200 * 0.1),
        });
      }, 500);
    },
    [origin],
  );
  useEffect(() => () => clearTimeout(timeout.current ?? undefined), []);

  if (!ferret) return null;

  const wikiUrl = `https://ferrets.piratesoftware.wiki/wiki/${ferret.wikipage}`;
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
      {birthday && <Confetti onInit={confettiInit} />}
      <div
        className={classes(
          "relative flex max-h-full min-h-[min(28rem,100%)] w-80 max-w-full flex-col justify-start rounded-lg bg-framecol align-top text-xs shadow-xl dark:bg-framecol-dark",
          className,
        )}
        ref={callbackRef}
        data-ferret-card="true"
        {...extras}
      >
        {birthday && (
          <img
            src={partyHat}
            alt=""
            className="absolute top-0 left-1/2 z-10 h-auto w-16 -translate-x-1/2 -translate-y-[85%]"
          />
        )}
        <img
          className="max-h-48 w-full rounded-t-lg object-cover transition-[max-height] duration-700 ease-in-out hover:max-h-96 active:max-h-96"
          src={ferret.mugshot.src}
          alt={ferret.mugshot.alt}
          style={{
            objectPosition: ferret.mugshot.position,
          }}
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
            {ferret.name}
            {birthday ? " 🎉" : ""}
            {!isAliveFerret(ferret) ? " 🌈" : ""}
          </h2>
        </div>
        <div className="mb-2 scrollbar-thin flex flex-auto flex-col gap-1 overflow-y-auto p-2 scrollbar-thumb-chocolate-alt scrollbar-track-tan-alt dark:scrollbar-thumb-chocolate dark:scrollbar-track-chocolate-alt">
          {mod && (
            <div className="flex items-center gap-2">
              <img
                className="h-6 w-6 object-cover"
                src={moderatorBadge}
                alt="Moderator badge"
              />
              <p>
                Show this card to everyone by using{" "}
                <code>!{ferret.commands[0]}</code> in chat.
              </p>
            </div>
          )}

          {ferret.aliases && ferret.aliases.length > 0 && (
            <div>
              <h3 className={headingClass}>AKA</h3>
              <p>
                <i>{ferret.aliases.join(", ")}</i>
              </p>
            </div>
          )}

          <div className={rowClass}>
            <div>
              <h3 className={headingClass}>Sex</h3>
              <p>{ferret.sex || "Unknown"}</p>
            </div>
            {isAliveFerret(ferret) ? (
              <div>
                <h3 className={headingClass}>Age</h3>
                <p>
                  {age[0] === "~" && (
                    <span className="text-base leading-none" title="Approx.">
                      ~
                    </span>
                  )}
                  {age.slice(age[0] === "~" ? 1 : 0)}
                </p>
              </div>
            ) : (
              <div>
                <h3 className={headingClass}>Valhalla Date</h3>
                <p>
                  {ferret.valhalla ? formatDate(ferret.valhalla) : "Unknown"}
                </p>
              </div>
            )}
            <div>
              <h3 className={headingClass}>Birthday</h3>
              <p>
                {birth[0] === "~" && (
                  <span className="text-base leading-none" title="Approx.">
                    ~
                  </span>
                )}
                {birth.slice(birth[0] === "~" ? 1 : 0)}
              </p>
            </div>
          </div>

          <div>
            <h3 className={headingClass}>Summary</h3>
            <p>{parseFerretLinks(ferret.summary)}</p>
          </div>

          {ferret.lore && (
            <div>
              <h3 className={headingClass}>Lore</h3>
              <p>
                {ferret.lore.length > 500 ? (
                  <>
                    {parseFerretLinks(ferret.lore.slice(0, 500).trimEnd())}...{" "}
                    <a
                      href={`${wikiUrl}#Lore`}
                      rel="noreferrer"
                      target="_blank"
                      className={`${linkClass} underline`}
                    >
                      read more
                    </a>
                  </>
                ) : (
                  parseFerretLinks(ferret.lore)
                )}
              </p>
            </div>
          )}

          <div className={rowClass}>
            <div>
              <h3 className={headingClass}>Playgroup</h3>
              <Tooltip text={playgroups[ferret.playgroup].description}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    window.dispatchEvent(
                      new CustomEvent("fsext:selectPlaygroup", {
                        detail: ferret.playgroup,
                      }),
                    );
                  }}
                  className={`inline-flex items-center gap-1 text-left no-underline ${linkClass} hover:underline`}
                  aria-label={`Filter by ${playgroups[ferret.playgroup].name}`}
                >
                  {playgroups[ferret.playgroup].name}
                  <IconInfo
                    size={15}
                    className="rounded-full outline-highlight transition-[outline] hover:outline-3"
                  />
                </a>
                &nbsp;
              </Tooltip>
            </div>
            <div>
              <h3 className={headingClass}>Arrived</h3>
              <p>
                {ferret.arrival ? formatDate(ferret.arrival, false) : "Unknown"}
              </p>
            </div>
          </div>

          <div className="mt-3 italic">
            <p>
              Learn more about {ferret.name} on the{" "}
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
