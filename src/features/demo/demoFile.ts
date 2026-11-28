import rawDemoFile from "@/data/mock.json";
import { demoFileSchema, type DemoFile } from "./schema";

let cached: DemoFile | null = null;

/** Plik src/data/mock.json po sprawdzeniu struktury (rzuca ZodError, gdy plik jest zepsuty). */
export function getDemoFile(): DemoFile {
  cached ??= demoFileSchema.parse(rawDemoFile);
  return cached;
}
