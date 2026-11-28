// Publiczne API modułu danych demo (F15) — importuj stąd: import { ... } from "@/features/demo";
export { DEMO_ID_PREFIX, demoFileSchema, type DemoFile } from "./schema";
export { resolveRelativeDate, type DaysAgo, type MonthDay, type RelativeDate } from "./dates";
export {
  buildDemoData,
  countDemoData,
  hasDemoData,
  isDemoId,
  isDemoTransaction,
  removeDemoData,
  type DemoCollections,
  type DemoCounts,
  type RemoveDemoResult,
} from "./build";
export { getDemoFile } from "./demoFile";
export { simulateFirstLaunch, type DemoLaunchState } from "./simulate";
export { DEMO_STORAGE_KEY, readDemoState, writeDemoState, type DemoState } from "./storage";
export {
  areDataStoresEmpty,
  clearDemoData,
  seedDemoDataOnFirstRun,
  undoClearDemoData,
  type ClearDemoResult,
  type SeedResult,
} from "./seed";
export { useDemoData } from "./hooks/useDemoData";
export * from "./messages";
