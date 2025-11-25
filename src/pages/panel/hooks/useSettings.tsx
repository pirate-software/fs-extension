import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  typeSafeObjectEntries,
  typeSafeObjectFromEntries,
} from "../../../utils/helpers";

const settings = {
  theme: {
    title: "Theme",
    type: "string",
    process: (value: any): "light" | "dark" | "auto" => {
      if (value === "light" || value === "dark" || value === "auto")
        return value;
      return "auto";
    },
    configurable: true,
  },
};

type SettingsKey = keyof typeof settings;

type StoredSettings = {
  [key in SettingsKey]: ReturnType<(typeof settings)[key]["process"]>;
};

export type Settings = {
  [key in SettingsKey]: (typeof settings)[key] & {
    value: StoredSettings[key];
    change: (value: StoredSettings[key]) => void;
  };
};

const Context = createContext<Settings | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [stored, setStored] = useState<StoredSettings>(() => {
    // Load settings from local storage on mount, merging with defaults
    const storage = JSON.parse(localStorage.getItem("settings") || "{}");
    return typeSafeObjectEntries(settings).reduce(
      (acc, [key, value]) => ({ ...acc, [key]: value.process(storage[key]) }),
      {} as StoredSettings,
    );
  });

  // Save settings to local storage when they change
  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify(stored));
  }, [stored]);

  // Set theme
  useEffect(() => {
    const theme = stored.theme;

    const isDark =
      theme === "dark" ||
      (theme === "auto" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.classList.toggle("dark", isDark);
  }, [stored.theme]);

  // Change the value of a setting
  const change = useCallback(
    <Key extends SettingsKey>(key: Key, value: StoredSettings[Key]) => {
      setStored((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  // Expose a full object for the settings
  const obj = useMemo<Settings>(
    () =>
      typeSafeObjectFromEntries(
        typeSafeObjectEntries(settings).map(([key, value]) => [
          key,
          {
            ...value,
            value: stored[key],
            change: (value: any) => change(key, value),
          },
        ]),
      ) as Settings,
    [stored, change],
  );

  return <Context value={obj}>{children}</Context>;
};

const useSettings = (): Settings => {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
};

export default useSettings;
