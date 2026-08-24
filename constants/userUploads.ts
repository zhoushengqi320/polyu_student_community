export const USER_UPLOAD_LIMITS = {
  maxFilesPerSubmit: 3,
  maxBytes: 5 * 1024 * 1024,
  pendingTtlHours: 24,
} as const;

export const USER_UPLOAD_ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type UserUploadModule = "feedback" | "forum" | "food" | "market";

export type UserUploadStatus = "pending" | "attached" | "deleted";
