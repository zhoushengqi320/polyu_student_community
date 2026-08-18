import {
  type UserUploadModule,
  type UserUploadStatus,
} from "@/constants/userUploads";

export type UserUploadRecord = {
  id: string;
  userId: string;
  storageBucket: string;
  storagePath: string;
  publicUrl: string;
  mimeType: string;
  byteSize: number;
  module: UserUploadModule;
  status: UserUploadStatus;
  targetType: string | null;
  targetId: string | null;
  altText: string | null;
  createdAt: string;
  attachedAt: string | null;
  expiresAt: string;
};
