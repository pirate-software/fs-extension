// Modified by mattermatter.dev @ Pirate Software, 2025

import { type MouseEventHandler } from "react";

import { useFerret, usePlaygroup } from "../hooks/useFerrets";
import { classes } from "../utils/classes";
import Ring from "./Ring";

interface FerretButtonProps {
  ferret: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  active?: boolean;
  className?: string;
}

export default function FerretButton(props: FerretButtonProps) {
  const { ferret: ferretKey, onClick, active, className } = props;
  const ferretRaw = useFerret(ferretKey);

  if (!ferretRaw) return null;

  const ferret = ferretRaw!;

  return (
    <button
      className={classes(
        "group/button relative flex shrink-0 flex-col items-center justify-start rounded-lg bg-framecol text-center shadow-lg transition-[filter] hover:brightness-85 dark:bg-framecol-dark",
        className,
      )}
      id={ferretKey}
      onClick={onClick}
      type="button"
    >
      <img
        className="aspect-[2.2] w-full shrink-0 rounded-t-lg object-cover"
        src={ferret.mugshot}
        alt={`Mugshot of ${ferret.name}`}
        loading="lazy"
      />

      <div className="my-auto px-1 pt-2 pb-2">
        <h2 className="text-sm text-balance">{ferret.name}</h2>
        <h3 className="text-xs text-balance text-subtitlecol dark:text-subtitlecol-dark">
          {usePlaygroup(ferret.playgroup)?.name}
        </h3>
      </div>

      <Ring active={active} />
    </button>
  );
}
