import { type MouseEventHandler } from "react";

import { useFerret } from "../hooks/useFerrets";
import { classes } from "../utils/classes";
import Ring from "./Ring";
import playgroups from "@pirate-software/fs-data/build/playgroups";

interface FerretButtonProps {
  ferret: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  active?: boolean;
  className?: string;
}

export default function FerretButton(props: FerretButtonProps) {
  const { ferret: ferretKey, onClick, active, className } = props;
  const ferret = useFerret(ferretKey);

  if (!ferret) return null;

  return (
    <button
      className={classes(
        "group/button relative flex shrink-0 flex-col items-center justify-start rounded-lg bg-alveus-green text-center shadow-lg transition-[filter] hover:brightness-125",
        className,
      )}
      id={ferretKey}
      onClick={onClick}
      type="button"
    >
      <img
        className="aspect-[2.2] w-full shrink-0 rounded-t-lg object-cover"
        src={ferret.mugshot.src}
        alt={ferret.mugshot.alt}
        style={{ objectPosition: ferret.mugshot.position }}
        loading="lazy"
      />

      <div className="my-auto px-1 pt-2 pb-2">
        <h2 className="text-sm text-balance">{ferret.name}</h2>
        <h3 className="text-xs text-balance text-alveus-green-200">
          {playgroups[ferret.playgroup].name}
        </h3>
      </div>

      <Ring active={active} />
    </button>
  );
}
