import { useCallback } from "react";
import useSettings from "../hooks/useSettings";
import IconSun from "../../../components/icons/IconSun";
import IconMoon from "../../../components/icons/IconMoon";
import IconSunAuto from "../../../components/icons/IconSunAuto";

export default function ThemeSwitcher() {
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
      className="text-text dark:text-text-dark flex items-center justify-center gap-2 rounded bg-tan-alt/75 px-3 py-2 transition-colors hover:bg-chocolate/20 dark:bg-chocolate-alt dark:hover:bg-white/10"
      title={`Theme: ${getLabel()}`}
      aria-label={`Toggle theme (currently ${getLabel()})`}
    >
      {getIcon()}
      <span className="text-sm font-medium">{getLabel()}</span>
    </button>
  );
}
