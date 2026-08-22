"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import {
  cancelUserUploadAction,
  uploadUserImageAction,
} from "@/lib/content/userUploadActions";
import {
  USER_UPLOAD_LIMITS,
  USER_UPLOAD_ALLOWED_MIME,
  type UserUploadModule,
} from "@/constants/userUploads";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

export type FormImageUploadItem = {
  id: string;
  publicUrl: string;
  fileName: string;
};

type FormImageAttachmentsProps = {
  module: UserUploadModule;
  uploads: FormImageUploadItem[];
  onChange: (uploads: FormImageUploadItem[]) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
  className?: string;
};

export function FormImageAttachments({
  module,
  uploads,
  onChange,
  disabled = false,
  label = "截图（可选）",
  hint = `可上传最多 ${USER_UPLOAD_LIMITS.maxFilesPerSubmit} 张截图，单张不超过 5MB。选择后立即上传，提交反馈时自动附在正文末尾。`,
  className,
}: FormImageAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

  function uploadFiles(selected: FileList | null) {
    if (!selected || selected.length === 0) return;

    const remaining = USER_UPLOAD_LIMITS.maxFilesPerSubmit - uploads.length;
    if (remaining <= 0) {
      setError(`最多上传 ${USER_UPLOAD_LIMITS.maxFilesPerSubmit} 张截图`);
      return;
    }

    const files = Array.from(selected).slice(0, remaining);

    startUpload(async () => {
      let nextError: string | null = null;
      const nextUploads = [...uploads];

      for (const file of files) {
        if (nextUploads.length >= USER_UPLOAD_LIMITS.maxFilesPerSubmit) {
          break;
        }

        if (
          !USER_UPLOAD_ALLOWED_MIME.includes(
            file.type as (typeof USER_UPLOAD_ALLOWED_MIME)[number],
          )
        ) {
          nextError = "仅支持 JPG / PNG / WebP / GIF";
          continue;
        }

        if (file.size > USER_UPLOAD_LIMITS.maxBytes) {
          nextError = "单张图片需在 5MB 以内";
          continue;
        }

        const formData = new FormData();
        formData.set("file", file);
        formData.set("module", module);
        formData.set("alt", "截图");

        const result = await uploadUserImageAction({}, formData);
        if (result.error || !result.upload) {
          nextError = result.error ?? "上传失败";
          continue;
        }

        nextUploads.push({
          id: result.upload.id,
          publicUrl: result.upload.publicUrl,
          fileName: file.name,
        });
      }

      onChange(nextUploads);
      setError(nextError);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    });
  }

  async function removeUpload(uploadId: string) {
    setRemovingId(uploadId);
    setError(null);
    const formData = new FormData();
    formData.set("uploadId", uploadId);
    await cancelUserUploadAction({}, formData);
    onChange(uploads.filter((item) => item.id !== uploadId));
    setRemovingId(null);
  }

  const busy = disabled || isUploading || removingId != null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>{label}</Label>
        {uploads.length < USER_UPLOAD_LIMITS.maxFilesPerSubmit ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            className="gap-1.5"
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <ImagePlus className="h-4 w-4" aria-hidden />
            )}
            {isUploading ? "上传中…" : "添加截图"}
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        disabled={busy}
        onChange={(event) => uploadFiles(event.target.files)}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {uploads.map((item) => (
        <input key={item.id} type="hidden" name="uploadIds" value={item.id} />
      ))}
      {uploads.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {uploads.map((item) => (
            <div
              key={item.id}
              className="relative h-24 w-24 overflow-hidden rounded-lg border bg-muted"
            >
              <Image
                src={item.publicUrl}
                alt={item.fileName}
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => removeUpload(item.id)}
                className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow hover:bg-background"
                aria-label={`移除 ${item.fileName}`}
              >
                {removingId === item.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <X className="h-3.5 w-3.5" aria-hidden />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed px-4 py-6 text-center text-xs text-muted-foreground">
          可附上页面截图，便于我们定位问题
        </div>
      )}
    </div>
  );
}
