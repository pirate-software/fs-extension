import { useCallback, useEffect, useRef, type Ref } from "react";
import type { CreateTypes } from "canvas-confetti";
import Confetti from "react-canvas-confetti";

import {
  // calculateAge,
  formatDate,
  formatBirthday,
  isBirthday,
} from "../utils/dateManager";
import { useFerret } from "../hooks/useFerrets";
import { classes } from "../utils/classes";

import IconBack from "./icons/IconBack";
import IconExternal from "./icons/IconExternal";

import Ring from "./Ring";

import moderatorBadge from "../assets/mod.svg";
import partyHat from "../assets/party.svg";
import playgroups from "@pirate-software/fs-data/build/playgroups";
import IconInfo from "./icons/IconInfo";
import Tooltip from "./Tooltip";

const headingClass = "text-base text-fs-tan-600";
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

  const mod =
    window?.Twitch?.ext?.viewer?.role === "broadcaster" ||
    window?.Twitch?.ext?.viewer?.role === "moderator";

  const birthday = ferret
    ? isBirthday(ferret.birth || null, ferret.birthday || null)
    : false;
  // const age = ferret?.birth ? calculateAge(ferret.birth) : "Unknown";
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

  return (
    <>
      {birthday && <Confetti onInit={confettiInit} />}
      <div
        className={classes(
          "relative flex max-h-full min-h-[min(28rem,100%)] w-80 max-w-full flex-col justify-start rounded-lg bg-fs-tan align-top text-xs shadow-xl",
          className,
        )}
        ref={callbackRef}
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
          className="max-h-32 w-full rounded-t-lg object-cover transition-[max-height] duration-700 ease-in-out hover:max-h-96 active:max-h-96"
          src={ferret.mugshot.src}
          alt={ferret.mugshot.alt}
          style={{
            objectPosition: ferret.mugshot.position,
          }}
          loading="lazy"
        />

        <div className="relative flex w-full items-center justify-center bg-fs-tan-300 px-8 py-1">
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

          <h2 className="text-base text-balance text-fs-black">
            {ferret.name}
          </h2>
        </div>
        <div className="mb-2 scrollbar-thin flex flex-auto flex-col gap-1 overflow-y-auto p-2 scrollbar-thumb-fs-tan scrollbar-track-fs-tan-900">
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
            {/* <div> //TODO: births aren't in data currently since they're not stored nicely on the wiki
              <h3 className={headingClass}>Age</h3>
              <p>
                {age[0] === "~" && (
                  <span className="text-base leading-none" title="Approx.">
                    ~
                  </span>
                )}
                {age.slice(age[0] === "~" ? 1 : 0)}
              </p>
            </div> */}
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
            <p>{ferret.summary}</p>
          </div>

          {ferret.lore && (
            <div>
              <h3 className={headingClass}>Lore</h3>
              <p>{ferret.lore}</p>
            </div>
          )}

          <div className={rowClass}>
            <div>
              <h3 className={headingClass}>Playgroup</h3>
              <Tooltip text={playgroups[ferret.playgroup].description}>
                <div className="inline-flex">
                  {playgroups[ferret.playgroup].name}&nbsp;
                  <IconInfo
                    size={15}
                    className="rounded-full outline-highlight transition-[outline] hover:outline-3"
                  />
                </div>
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
                href={`https://ferrets.piratesoftware.wiki/wiki/${ferret.wikipage}`}
                rel="noreferrer"
                target="_blank"
                className="text-nowrap text-fs-tan-700 transition-colors hover:text-highlight focus:text-highlight"
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
