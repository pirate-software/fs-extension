// Modified by mattermatter.dev @ Pirate Software, 2025

import { classes } from "../utils/classes";

interface RingProps {
  active?: boolean;
  thickBottom?: boolean;
  className?: string;
}

export default function Ring({
  active = false,
  thickBottom = true,
  className,
}: RingProps) {
  return (
    <div
      className={classes(
        "pointer-events-none absolute inset-0 border-2 border-outlinecol ring-1 ring-outlinecol transition-colors",
        active && "bg-black/25",
        // active
        //   ? "border-outlinecol"
        //   : "border-chocolate group-hover/button:border-outlinecol group-focus/button:border-outlinecol dark:border-chocolate-alt",
        !/\brounded-/.test(className || "") && "rounded-lg",
        thickBottom && "border-b-4",
        className,
      )}
    />
  );
}
