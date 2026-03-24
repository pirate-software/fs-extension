import { existsSync, writeFileSync } from "fs";
import { join } from "path";
import { get } from "https";
import { fileURLToPath } from "url";
import { dirname } from "path";

import dotenv from "dotenv";
import {
  ferretsApiSchema,
  SCHEMA_VERSION_ID,
} from "@pirate-software/fs-data/build/api.js";

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

async function processFetchResponse(data: any) {
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

async function fetchData(url: string): Promise<any> {
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

  return new Promise((_, reject) => {
    get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        return processFetchResponse(data);
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

async function main() {
  try {
    console.log(`Fetching data from ${API_URL}`);
    const data = await fetchData(API_URL);

    if (data) {
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
}

main();
