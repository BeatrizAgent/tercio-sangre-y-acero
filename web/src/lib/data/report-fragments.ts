// Report fragment library: opening lines, success/failure variants, lore
// snippets. Backed by the unified catalog.

import {
  reportFragmentDefinitions as catalogFragments,
  getReportFragmentsByType,
} from "./catalog";
import type { ReportFragment } from "../types";

export const reportFragmentDefinitions: readonly ReportFragment[] = catalogFragments;

export { getReportFragmentsByType };
