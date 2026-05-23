import {
  type ReportReasonId,
  type ReportStatus,
  type TargetType,
} from "@/constants/reportReasons";
import { type ProfileListItem } from "@/types/user";

export type Report = {
  id: string;
  reporterId: string;
  targetType: TargetType;
  targetId: string;
  reason: ReportReasonId;
  description: string | null;
  status: ReportStatus;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReportWithReporter = Report & {
  reporter: ProfileListItem;
};

export type AdminActionLog = {
  id: string;
  adminId: string;
  action: string;
  targetType: TargetType | "user";
  targetId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type AdminActionLogWithAdmin = AdminActionLog & {
  admin: ProfileListItem;
};
