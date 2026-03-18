// Modified by mattermatter.dev @ Pirate Software, 2025

import { type MouseEventHandler } from "react";

import { usePlaygroup } from "../hooks/useFerrets";
import { classes } from "../utils/classes";
import Ring from "./Ring";

interface PlaygroupButtonProps {
  name: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  active?: boolean;
  className?: string;
}

export default function PlaygroupButton(props: PlaygroupButtonProps) {
  const { name: playgroupKey, onClick, active, className } = props;
  const playgroupRaw = usePlaygroup(playgroupKey);

  if (!playgroupRaw) return null;

  const playgroup = playgroupRaw!;

  return (
    <button
      className={classes(
        "group/button relative flex shrink-0 flex-col items-center justify-start rounded-lg bg-framecol text-center shadow-lg transition-[filter] hover:brightness-85 dark:bg-framecol-dark",
        className,
      )}
      id={playgroupKey}
      onClick={onClick}
      type="button"
    >
      <img
        className="aspect-[2.2] w-full shrink-0 rounded-t-lg object-cover"
        src={playgroup.image}
        alt={`Image of the playgroup ${playgroup.name}`}
        loading="lazy"
      />

      <div className="my-auto px-1 pt-2 pb-2">
        <h2 className="text-sm text-balance">{playgroup.name}</h2>
        <h3 className="text-xs text-balance text-subtitlecol dark:text-subtitlecol-dark">
          Playgroup
        </h3>
      </div>

      <Ring active={active} />
    </button>
  );
}
