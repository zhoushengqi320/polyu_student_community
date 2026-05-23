import { z } from "zod";
import { REPORT_REASONS, TARGET_TYPES } from "@/constants/reportReasons";

const reportReasonIds = REPORT_REASONS.map((item) => item.id) as [
  string,
  ...string[],
];

const targetTypeIds = Object.values(TARGET_TYPES) as [string, ...string[]];

export const reportSchema = z.object({
  targetType: z.enum(targetTypeIds),
  targetId: z.string().uuid(),
  reason: z.enum(reportReasonIds),
  description: z.string().max(500).optional().nullable(),
});

export type ReportFormValues = z.infer<typeof reportSchema>;
