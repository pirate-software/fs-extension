import { typeSafeObjectEntries } from "../../../../utils/helpers";
import { classes } from "../../../../utils/classes";

import useSettings from "../../hooks/useSettings";

import Card from "../../../../components/Card";
import Toggle from "../Toggle";

import type { OverlayOptionProps } from "./Overlay";

export default function Settings(props: OverlayOptionProps) {
  const { className } = props;
  const settings = useSettings();

  return (
    <div className={classes("absolute top-0 left-0 mx-4 my-6", className)}>
      <Card title="Extension Settings">
        <ul className="flex flex-col gap-4">
          {typeSafeObjectEntries(settings).map(([key, setting]) => {
            if (!setting.configurable) return null;

            return (
              <li key={key} className="flex items-center">
                {setting.type === "boolean" && (
                  <Toggle
                    label={setting.title}
                    value={setting.value as boolean}
                    onChange={setting.change as (value: boolean) => void}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </Card>
      <Card title="Credits" className={classes("top-3", className)}>
        Based on the work of the alveus.gg team
        <br />
        Modified for Ferret Software by Matt
        <br />
        Social media logo icons from fontawesome.com
        <br />
        Party hat icon from flaticon.com
        <br />
        Other icons from heroicons.com
        <br />
        Other images subject to copyright
      </Card>
    </div>
  );
}
