import { REPORT_STATUS, TARGET_TYPES } from "@/constants/reportReasons";

export const ADMIN_TABS = [
  { id: "overview", label: "概览" },
  { id: "reports", label: "举报中心" },
  { id: "forum-posts", label: "帖子管理" },
  { id: "forum-comments", label: "评论管理" },
  { id: "courses", label: "课程目录" },
  { id: "course-reviews", label: "课程评价" },
  { id: "guides", label: "内容管理" },
  { id: "users", label: "用户管理" },
  { id: "actions", label: "操作记录" },
] as const;

export type AdminTabId = (typeof ADMIN_TABS)[number]["id"];

export const REPORT_STATUS_LABELS: Record<
  (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS],
  string
> = {
  pending: "待处理",
  reviewing: "审核中",
  reviewed: "已审核",
  resolved: "已处理",
  dismissed: "已驳回",
};

export const TARGET_TYPE_LABELS: Record<
  (typeof TARGET_TYPES)[keyof typeof TARGET_TYPES],
  string
> = {
  post: "帖子",
  comment: "评论",
  course: "课程",
  course_review: "课程评价",
  food_place: "吃喝玩乐地点",
  food_recommendation: "吃喝玩乐推荐",
  buddy_post: "找搭子帖",
  profile: "用户资料",
};

export const ADMIN_ACTION_LABELS: Record<string, string> = {
  ban_user: "封禁用户",
  unban_user: "解封用户",
  verify_polyu_user: "理大认证",
  hide_content: "隐藏内容",
  delete_forum_post: "删除帖子",
  delete_forum_comment: "删除评论",
  delete_course_review: "删除课程评价",
  hide_food_place: "隐藏吃喝玩乐地点",
  delete_food_recommendation: "删除吃喝玩乐推荐",
  create_course: "创建课程",
  update_course: "更新课程",
  create_guide: "创建攻略",
  update_guide: "编辑攻略",
  publish_guide: "发布攻略",
  hide_guide: "隐藏攻略",
  delete_guide: "删除攻略",
  create_content_article: "创建指南文章",
  update_content_article: "编辑指南文章",
  publish_content_article: "发布指南文章",
  hide_content_article: "隐藏指南文章",
  delete_content_article: "删除指南文章",
  update_report_status: "更新举报状态",
  update_report_status_resolved: "标记举报已处理",
  update_report_status_dismissed: "驳回举报",
  update_report_status_reviewed: "标记举报已审核",
  resolve_report: "处理举报",
  dismiss_report: "驳回举报",
};

export function getAdminActionLabel(action: string): string {
  return ADMIN_ACTION_LABELS[action] ?? action;
}

export function isReportOpenStatus(status: string): boolean {
  return (
    status === REPORT_STATUS.pending ||
    status === REPORT_STATUS.reviewing ||
    status === REPORT_STATUS.reviewed
  );
}
