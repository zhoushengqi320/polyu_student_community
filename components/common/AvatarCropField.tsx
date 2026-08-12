"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/common/UserAvatar";
import {
  blobToAvatarFile,
  getCroppedAvatarBlob,
} from "@/lib/utils/cropImage";
import { AVATAR_MAX_BYTES } from "@/constants/auth";
import { cn } from "@/lib/utils/cn";

type AvatarCropFieldProps = {
  /** 表单字段名，默认 avatar（配合服务端 File 上传） */
  name?: string;
  label?: string;
  initialPreviewUrl?: string | null;
  className?: string;
};

export function AvatarCropField({
  name = "avatar",
  label = "头像",
  initialPreviewUrl,
  className,
}: AvatarCropFieldProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialPreviewUrl ?? null,
  );
  const [hasCroppedFile, setHasCroppedFile] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    return () => {
      if (cropSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(cropSrc);
      }
    };
  }, [cropSrc]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  function resetCropState() {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }

  function handlePickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError(null);

    if (!file) {
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("仅支持 JPG / PNG / WebP");
      return;
    }

    if (file.size > AVATAR_MAX_BYTES * 4) {
      setError("图片过大，请选择较小的图片后再裁剪");
      return;
    }

    if (cropSrc?.startsWith("blob:")) {
      URL.revokeObjectURL(cropSrc);
    }

    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    resetCropState();
    setOpen(true);
  }

  function handleDialogChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      if (cropSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(cropSrc);
      }
      setCropSrc(null);
      resetCropState();
    }
  }

  async function handleConfirmCrop() {
    if (!cropSrc || !croppedAreaPixels) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const blob = await getCroppedAvatarBlob(
        cropSrc,
        croppedAreaPixels,
        "image/jpeg",
      );

      if (blob.size > AVATAR_MAX_BYTES) {
        setError("裁剪后仍超过 2MB，请缩小缩放或换一张图");
        setProcessing(false);
        return;
      }

      const file = await blobToAvatarFile(blob, "avatar.jpg");
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
      }

      const nextPreview = URL.createObjectURL(blob);
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(nextPreview);
      setHasCroppedFile(true);
      handleDialogChange(false);
    } catch {
      setError("裁剪失败，请重试");
    } finally {
      setProcessing(false);
    }
  }

  function handleClear() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(initialPreviewUrl ?? null);
    setHasCroppedFile(false);
    setError(null);
  }

  return (
    <div className={cn("space-y-4", className)}>
      {label ? <Label htmlFor={inputId}>{label}</Label> : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative shrink-0 self-start">
          <UserAvatar
            src={previewUrl}
            name="头像预览"
            size="xl"
            className="h-20 w-20 ring-2 ring-border"
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-black/10"
            aria-hidden
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => pickerRef.current?.click()}
            >
              {previewUrl ? "更换并裁剪" : "选择并裁剪"}
            </Button>
            {hasCroppedFile ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
              >
                清除新头像
              </Button>
            ) : null}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            支持 JPG / PNG / WebP，裁剪后按圆形头像框保存。
          </p>
        </div>
      </div>

      <input
        ref={pickerRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handlePickFile}
      />

      {/* 提交给 Server Action 的裁剪结果 */}
      <input
        ref={fileInputRef}
        type="file"
        name={name}
        accept="image/jpeg"
        className="hidden"
        tabIndex={-1}
        aria-hidden
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="space-y-1 px-6 pt-6">
            <DialogTitle>裁剪头像</DialogTitle>
            <DialogDescription>
              拖动与缩放图片，使内容落在圆形框内。确认后将按该圆形区域保存。
            </DialogDescription>
          </DialogHeader>

          <div className="relative mx-6 mt-4 h-72 overflow-hidden rounded-lg bg-muted sm:h-80">
            {cropSrc ? (
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            ) : null}
          </div>

          <div className="space-y-2 px-6 py-4">
            <Label htmlFor={`${inputId}-zoom`} className="text-xs">
              缩放
            </Label>
            <input
              id={`${inputId}-zoom`}
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <DialogFooter className="gap-2 border-t px-6 py-4 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogChange(false)}
              disabled={processing}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCrop}
              disabled={processing || !croppedAreaPixels}
            >
              {processing ? "处理中..." : "确认裁剪"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
