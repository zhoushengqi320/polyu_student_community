import type { Area } from "react-easy-crop";

const OUTPUT_SIZE = 512;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = src;
  });
}

/**
 * 按裁剪区域导出正方形头像（圆形框展示用 object-cover 即可贴合）。
 * 同时用圆形蒙版绘制，避免四周多余内容。
 */
export async function getCroppedAvatarBlob(
  imageSrc: string,
  pixelCrop: Area,
  mimeType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg",
  quality = 0.92,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("无法创建画布");
  }

  ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  ctx.beginPath();
  ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  // JPEG 不支持透明，用白底保证圆形外区域干净（clip 后外圈本无像素，
  // 但部分浏览器 JPEG 会填黑；先铺白底再裁更稳）
  if (mimeType === "image/jpeg") {
    const withBg = document.createElement("canvas");
    withBg.width = OUTPUT_SIZE;
    withBg.height = OUTPUT_SIZE;
    const bgCtx = withBg.getContext("2d");
    if (!bgCtx) {
      throw new Error("无法创建画布");
    }
    bgCtx.fillStyle = "#ffffff";
    bgCtx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    bgCtx.drawImage(canvas, 0, 0);

    return new Promise((resolve, reject) => {
      withBg.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("裁剪失败"));
            return;
          }
          resolve(blob);
        },
        mimeType,
        quality,
      );
    });
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("裁剪失败"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

export async function blobToAvatarFile(
  blob: Blob,
  fileName = "avatar.jpg",
): Promise<File> {
  return new File([blob], fileName, {
    type: blob.type || "image/jpeg",
    lastModified: Date.now(),
  });
}
