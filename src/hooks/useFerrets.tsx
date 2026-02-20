// Modified by mattermatter.dev @ Pirate Software, 2025

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ContextType,
} from "react";

import fallbackDataRaw from "../assets/fallbackData.json";
import {
  ferretsApiSchema,
  SCHEMA_VERSION_ID,
  type FerretsApiData,
} from "@pirate-software/fs-data/build/api";

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL?.replace(/\/+$/, "");
if (!apiBaseUrl)
  throw new Error("REACT_APP_API_BASE_URL environment variable is not set");

const fetchApi = async (): Promise<FerretsApiData> => {
  const response = await fetch(`${apiBaseUrl}/ferrets.json`);
  if (!response.ok)
    throw new Error(
      `Failed to fetch ferrets: ${response.status} ${response.statusText} ${await response.text()}`,
    );

  const data = await response.json();
  if (!data[SCHEMA_VERSION_ID])
    throw new Error(
      `Desired schema version not found in API response. Looking for ${SCHEMA_VERSION_ID}. Found [${Object.keys(data).join(", ")}]`,
    );
  return ferretsApiSchema.parse(data[SCHEMA_VERSION_ID]);
};

// fallbackDataRaw is the full fallbackData.json object, which should match the API structure
// fallbackDataRaw may have a _comment or be empty if not yet fetched
const fallbackData: FerretsApiData | null = (() => {
  if (!fallbackDataRaw || typeof fallbackDataRaw !== "object") return null;
  // If the fallbackDataRaw is just a comment, return empty
  if (
    "_comment" in fallbackDataRaw &&
    Object.keys(fallbackDataRaw).length === 1
  )
    return null;
  // Try to find the schema version key
  const data = (fallbackDataRaw as any)[SCHEMA_VERSION_ID] || fallbackDataRaw;
  try {
    return ferretsApiSchema.parse(data);
  } catch (e) {
    console.error("Failed to parse fallback ferrets data", e);
    return null;
  }
})();

// Use a context to fetch the ferrets from the API
const Context = createContext<FerretsApiData | null>(null);
export const FerretsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [data, setData] = useState<ContextType<typeof Context>>(null);

  // On mount, attempt to fetch the ferrets from the API
  // If we can't fetch the ferrets, use the data from the data package
  useEffect(() => {
    // setData(fallbackFerrets); //TEMP FOR DEV
    // return; //TEMP FOR DEV
    fetchApi()
      .catch((err) => {
        console.error(err);
        return fallbackData;
      })
      .then(setData);
  }, []);

  // Every 2 hours, attempt to fetch the ferrets from the API
  // If we can't fetch the ferrets, we'll just use the existing data
  useEffect(() => {
    const interval = setInterval(
      () => {
        fetchApi()
          .then(setData)
          .catch((err) => console.error(err));
      },
      2 * 60 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, []);

  return <Context value={data}>{children}</Context>;
};

export const useData = (): FerretsApiData | null => {
  return useContext(Context);
};

export const usePlaygroups = () => {
  const data = useData();
  return data?.playgroups ?? {};
};

export const usePlaygroup = (key: string) => {
  const data = useData();
  return data?.playgroups[key];
};

export const useFerrets = () => {
  const data = useData();
  return data?.ferrets ?? {};
};

export const useFerret = (key: string) => {
  const data = useData();
  return data?.ferrets[key];
};

export const isAliveFerret = (f: { playgroup: string }) => {
  return f.playgroup !== "valhalla";
};
