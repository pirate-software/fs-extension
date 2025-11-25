import { useCallback } from "react";
import useSettings from "../hooks/useSettings";
import IconSun from "../../../components/icons/IconSun";
import IconMoon from "../../../components/icons/IconMoon";
import IconSunAuto from "../../../components/icons/IconSunAuto";

export default function ThemeToggle() {
  const settings = useSettings();
  const currentTheme = settings.theme.value;

  const handleClick = useCallback(() => {
    const themes: ("light" | "dark" | "auto")[] = ["auto", "light", "dark"];
    let currentIndex = themes.indexOf(
      currentTheme as "light" | "dark" | "auto",
    );
    if (currentIndex === -1) currentIndex = 0;
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex]!;

    settings.theme.change(nextTheme);
  }, [currentTheme, settings.theme]);

  const getIcon = () => {
    switch (currentTheme) {
      case "light":
        return <IconSun size={20} />;
      case "dark":
        return <IconMoon size={20} />;
      case "auto":
        return <IconSunAuto size={20} />;
    }
  };

  const getLabel = () => {
    switch (currentTheme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "auto":
        return "Auto";
    }
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
