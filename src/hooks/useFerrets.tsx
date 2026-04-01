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
  apiMetaSchema,
  ferretsApiSchema,
  SCHEMA_VERSION_ID,
  type ApiMeta,
  type FerretsApiData,
} from "@pirate-software/fs-data/build/api";

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL?.replace(/\/+$/, "");
if (!apiBaseUrl)
  throw new Error("REACT_APP_API_BASE_URL environment variable is not set");

const fetchMeta = async (): Promise<ApiMeta> => {
  const metaResponse = await fetch(`${apiBaseUrl}/ferrets.meta.json`);
  if (!metaResponse.ok)
    throw new Error(
      `Failed to fetch ferrets metadata: ${metaResponse.status} ${metaResponse.statusText} ${await metaResponse.text()}`,
    );
  const meta = apiMetaSchema.parse(await metaResponse.json());
  return meta;
};

const fetchFerretsApi = async (): Promise<FerretsApiData> => {
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

const getFallbackImagePath = (assetPath: string) => {
  if (!assetPath.startsWith("static")) return assetPath;

  // Build a page-relative absolute URL so extension pages resolve consistently.
  if (typeof window !== "undefined") {
    return new URL(assetPath, window.location.href).toString();
  }

  return `./${assetPath}`;
};

const fixFallbackImages = (data: FerretsApiData): FerretsApiData => {
  return {
    ...data,
    ferrets: Object.fromEntries(
      Object.entries(data.ferrets).map(([key, ferret]) => [
        key,
        {
          ...ferret,
          mugshot: getFallbackImagePath(ferret.mugshot),
          images: ferret.images.map((image) => ({
            ...image,
            src: getFallbackImagePath(image.src),
          })),
        },
      ]),
    ),
    playgroups: Object.fromEntries(
      Object.entries(data.playgroups).map(([key, playgroup]) => [
        key,
        {
          ...playgroup,
          image: getFallbackImagePath(playgroup.image),
        },
      ]),
    ),
  };
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
    return fixFallbackImages(ferretsApiSchema.parse(data));
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
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // On mount, attempt to fetch the ferrets from the API
  // If we can't fetch the ferrets, use the data from the data package
  useEffect(() => {
    setData(fallbackData); //TEMP
    // fetchMeta()
    //   .then((meta) => setLastUpdated(meta.lastUpdated))
    //   .catch((err) => console.error("Failed to fetch ferrets metadata", err));
    // fetchFerretsApi() // catch is before then so that if fetch failes, promise chain continues to use fallback data
    //   .catch((err) => {
    //     console.error(err);
    //     return fallbackData;
    //   })
    //   .then(setData);
  }, []);

  // Every 2 hours, attempt to fetch the ferrets from the API
  // If we can't fetch the ferrets, we'll just use the existing data
  useEffect(() => {
    const interval = setInterval(
      () => {
        fetchMeta()
          .then((meta) => {
            if (meta.lastUpdated !== lastUpdated) {
              fetchFerretsApi()
                .then(setData)
                .catch((err) =>
                  console.error("Failed to fetch ferrets API data", err),
                );
            } else {
              setLastUpdated(meta.lastUpdated);
            }
          })
          .catch((err) =>
            console.error("Failed to fetch ferrets metadata", err),
          );
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

export const isAliveFerret = (f: { valhalla: string | null }) => {
  return f.valhalla === null;
};
