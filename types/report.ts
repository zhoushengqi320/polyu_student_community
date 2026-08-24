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
  metadata: Record<string, unknown> | null;
  status: ReportStatus;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReportWithReporter = Report & {
  reporter: ProfileListItem;
  /** targetType=post 时对应 posts.module，用于正确跳转与删除 */
  postModule?: string | null;
  /** targetType=food_recommendation 时对应所属地点，用于跳转 */
  foodPlaceId?: string | null;
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
