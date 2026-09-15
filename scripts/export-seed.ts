import { mkdirSync, writeFileSync } from "node:fs";
import { SEED } from "../src/api/mock/seed.ts";

mkdirSync("backend", { recursive: true });
const { exportHeaders: _, ...rest } = SEED;
writeFileSync("backend/seed.json", JSON.stringify(rest, null, 2), "utf8");
console.log("wrote backend/seed.json");
