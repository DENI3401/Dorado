// Publiczne API modułu cyklicznych przychodów — importuj stąd: import { ... } from "@/features/recurring-income";
export * from "./types";
export { useRecurringIncomeStore } from "./store";
export { planRecurringIncome, isSalaryRecorded, type SalaryPlan } from "./plan";
export { syncRecurringIncome } from "./sync";
