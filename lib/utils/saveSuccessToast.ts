type SaveSuccessListener = (message: string) => void;

let listener: SaveSuccessListener | null = null;

/** 订阅保存成功提示（由 SaveSuccessToastHost 注册） */
export function subscribeSaveSuccessToast(next: SaveSuccessListener) {
  listener = next;
  return () => {
    if (listener === next) {
      listener = null;
    }
  };
}

/** 屏幕中央弹出「保存成功」等提示 */
export function showSaveSuccessToast(message = "保存成功") {
  listener?.(message);
}
