// Modified by mattermatter.dev @ Pirate Software, 2025

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ContextType,
} from "react";
import { z } from "zod";

import allFerrets, {
  ferretSchema,
} from "@pirate-software/fs-data/build/ferrets/core";
import {
  getFerretMugshot,
  ferretImageSchema,
} from "@pirate-software/fs-data/build/ferrets/images";

import {
  typeSafeObjectEntries,
  typeSafeObjectFromEntries,
} from "../utils/helpers";
import { getToday } from "../utils/dateManager";

import fallbackMugshotImage from "../assets/mugshot-missing.png";
const fallbackMugshot = {
  src: fallbackMugshotImage,
  alt: "Mugshot not available",
};

// These schema should match the type exposed by the API

const apiFerretSchema = ferretSchema.extend({
  mugshot: ferretImageSchema.extend({
    src: z.url(),
  }),
});

type Ferret = z.infer<typeof apiFerretSchema>;

// Use transform here so we parse each ferret individually
const apiSchema = z.object({
  v1: z
    .record(
      z.string(),
      // Use nullable here as the fallback for when we fail to parse a ferret
      apiFerretSchema.nullable().catch((ctx) => {
        console.error(
          "Failed to parse ferret",
          ctx.value,
          z.prettifyError(ctx.error),
        );
        return null;
      }),
    )
    .transform((val) =>
      // Filter out any null values that failed to parse
      typeSafeObjectFromEntries(
        Object.entries(val).filter(
          (entry): entry is [string, Ferret] => !!entry[1],
        ),
      ),
    )
    // Ensure we didn't fail to parse all ferrets
    .refine((val) => Object.keys(val).length > 0, {
      message: "No ferrets found",
    }),
});

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL?.replace(/\/+$/, "");
if (!apiBaseUrl)
  throw new Error("REACT_APP_API_BASE_URL environment variable is not set");

const fetchFerrets = async (): Promise<Record<string, Ferret>> => {
  const response = await fetch(`${apiBaseUrl}/api/fsext/ferrets.json`);
  if (!response.ok)
    throw new Error(
      `Failed to fetch ferrets: ${response.status} ${response.statusText} ${await response.text()}`,
    );

  const data = await response.json();
  return apiSchema.parse(data).v1;
};

const fallbackFerrets: Record<string, Ferret> = typeSafeObjectFromEntries(
  typeSafeObjectEntries(allFerrets).map<[string, Ferret]>(([key, val]) => {
    const mugshot = getFerretMugshot(key) ?? fallbackMugshot;

    return [
      key,
      {
        ...val,
        mugshot,
      },
    ];
  }),
);

// Use a context to fetch the ferrets from the API
const Context = createContext<Record<string, Ferret> | null>(null);
export const FerretsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [ferrets, setFerrets] = useState<ContextType<typeof Context>>(null);

  // On mount, attempt to fetch the ferrets from the API
  // If we can't fetch the ferrets, use the data from the data package
  useEffect(() => {
    setFerrets(fallbackFerrets); //TEMP REMOVE
    return; //TEMP REMOVE
    fetchFerrets()
      .catch((err) => {
        console.error(err);
        return fallbackFerrets;
      })
      .then(setFerrets);
  }, []);

  // Every 2 hours, attempt to fetch the ferrets from the API
  // If we can't fetch the ferrets, we'll just use the existing data
  useEffect(() => {
    const interval = setInterval(
      () => {
        fetchFerrets()
          .then(setFerrets)
          .catch((err) => console.error(err));
      },
      2 * 60 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, []);

  return <Context value={ferrets}>{children}</Context>;
};

export const useFerrets = (): Record<string, Ferret> | null => {
  const ferrets = useContext(Context);

  // Setup a timer to store the current month and day
  const [date, setDate] = useState<string>("");
  useEffect(() => {
    const updateDate = () => setDate(getToday().toFormat("MM-dd"));
    updateDate();
    const interval = setInterval(updateDate, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Return the ferrets, with Winston added to the start if it's April 1st
  return useMemo(
    () =>
      ferrets
        ? {
            ...ferrets,
          }
        : null,
    [ferrets, date],
  );
};

export const useFerret = (key: string) => {
  const ferrets = useFerrets();
  return ferrets?.[key];
};
