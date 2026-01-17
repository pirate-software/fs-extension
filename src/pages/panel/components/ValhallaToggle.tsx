// Modified by mattermatter.dev @ Pirate Software, 2025

import { useCallback } from "react";
import useSettings from "../hooks/useSettings";
import IconRainbow from "../../../components/icons/IconRainbow";
import IconNotes from "../../../components/icons/IconNotes";

export default function ThemeToggle() {
  const settings = useSettings();
  const currentValhallaMode = settings.valhallaMode.value;

  const handleClick = useCallback(() => {
    settings.valhallaMode.change(!settings.valhallaMode.value);
  }, [currentValhallaMode, settings.valhallaMode]);

  const getIcon = () => {
    return currentValhallaMode ? (
      <IconRainbow size={20} />
    ) : (
      <IconNotes size={20} />
    );
  };

  const getLabel = () => {
    return currentValhallaMode ? "Valhalla Mode On" : "Valhalla Mode Off";
  };

  return (
    <button
      onClick={handleClick}
      className="group -mr-2 rounded-full p-2 outline-highlight transition-[outline] hover:outline-2"
      title={`Theme: ${getLabel()}`}
      aria-label={`Toggle theme (currently ${getLabel()})`}
    >
      {getIcon()}
    </button>
  );
}
