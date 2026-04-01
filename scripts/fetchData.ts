import { existsSync, writeFileSync, mkdirSync, createWriteStream } from "fs";
import { join } from "path";
import { get } from "https";
import { fileURLToPath } from "url";
import { dirname } from "path";

import dotenv from "dotenv";
import {
  ferretsApiSchema,
  SCHEMA_VERSION_ID,
} from "@pirate-software/fs-data/build/api.js";
import type { FerretsApiData } from "@pirate-software/fs-data/build/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const devMode = process.env.NODE_ENV === "development";
const envFile = devMode ? ".env.development" : ".env";
dotenv.config({ path: join(__dirname, "..", envFile) });

let API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";
if (!API_BASE_URL) {
  console.error("REACT_APP_API_BASE_URL environment variable is not set");
  process.exit(1);
}
if (API_BASE_URL.endsWith("/")) {
  API_BASE_URL = API_BASE_URL.slice(0, -1);
}
const API_URL = `${API_BASE_URL}/ferrets.json`;

const OUTPUT_PATH = join(__dirname, "../src/assets/fallbackData.json");
const IMAGES_SRC_DIR = "static/media/ferrets";
const IMAGES_PATH = join(__dirname, "../src/assets/img");

async function processFetchResponse(data: any): Promise<FerretsApiData> {
  return new Promise((resolve, reject) => {
    try {
      const jsonData = JSON.parse(data);
      if (!jsonData[SCHEMA_VERSION_ID]) {
        throw new Error(
          `Desired schema version not found in API response. Looking for ${SCHEMA_VERSION_ID}. Found [${Object.keys(jsonData).join(", ")}]`,
        );
      }
      resolve(ferretsApiSchema.parse(jsonData[SCHEMA_VERSION_ID]));
    } catch (e) {
      reject(e);
    }
  });
}

async function fetchData(url: string): Promise<FerretsApiData | null> {
  if (devMode && url.startsWith("http://")) {
    // Allow http for dev mode
    let data = "";
    let response;
    try {
      response = await fetch(url);
    } catch (e) {
      console.error(`Failed to fetch data: ${e}`);
      return null;
    }
    if (!response.ok) {
      console.error(
        `Failed to fetch data: ${response.status} ${response.statusText} ${await response.text()}`,
      );
      return null;
    }
    data = await response.text();
    return processFetchResponse(data);
  }

  return new Promise((resolve, reject) => {
    get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve(processFetchResponse(data));
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

function downloadImage(url: string, dest: string) {
  return new Promise((resolve) => {
    if (!url) return resolve(false);
    const file = createWriteStream(dest);
    console.log("Downloading image:", url, "->", dest);
    get(url, (response) => {
      if (response.statusCode !== 200) {
        file.close();
        resolve(false);
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve(true);
      });
    }).on("error", () => {
      file.close();
      resolve(false);
    });
  });
}

async function syncImages(data: FerretsApiData) {
  const mugshotDir = join(IMAGES_PATH, "mugshots");
  const playgroupDir = join(IMAGES_PATH, "playgroups");
  mkdirSync(mugshotDir, { recursive: true });
  mkdirSync(playgroupDir, { recursive: true });

  const ferrets = data.ferrets || {};
  await Promise.all(
    Object.entries(ferrets).map(async ([, ferret]) => {
      if (ferret.mugshot && ferret.mugshot.startsWith("http")) {
        const filename = ferret.mugshot.split("/").pop()!;
        const absPath = join(mugshotDir, filename);
        const localPath = join(IMAGES_SRC_DIR, "mugshots", filename);
        await downloadImage(ferret.mugshot, absPath);
        ferret.mugshot = localPath.replace(/\\/g, "/");
      }
    }),
  );

  const playgroups = data.playgroups || {};
  await Promise.all(
    Object.entries(playgroups).map(async ([, group]) => {
      if (group.image && group.image.startsWith("http")) {
        const filename = group.image.split("/").pop()!;
        const absPath = join(playgroupDir, filename);
        const localPath = join(IMAGES_SRC_DIR, "playgroups", filename);
        await downloadImage(group.image, absPath);
        group.image = localPath.replace(/\\/g, "/");
      }
    }),
  );
}

async function main() {
  try {
    console.log(`Fetching data from ${API_URL}`);
    const data = await fetchData(API_URL);

    if (data) {
      await syncImages(data);
      console.log("Images saved");

      // verify schema
      ferretsApiSchema.parse(data);

      writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
      console.log(`Data saved to ${OUTPUT_PATH}`);
    } else if (devMode && existsSync(OUTPUT_PATH)) {
      console.warn("No data fetched - using existing fallback data.");
    } else {
      console.error("No data fetched and no existing fallback data found.");
      process.exit(1);
    }
  } catch (err) {
    console.error("Failed to fetch or save data:", err);
    process.exit(1);
  }

  console.log("Done.");
}

main();
