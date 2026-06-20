// Report fragment library: opening lines, success/failure variants, lore
// snippets. Picked at mission resolution time by tag intersection.

import { reportFragments } from "../../../data/seed-report-fragments";
import type { ReportFragment } from "../types";

export const reportFragmentDefinitions = reportFragments as readonly ReportFragment[];
