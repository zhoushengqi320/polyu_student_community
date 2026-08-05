"use client";

import { useEffect, useRef } from "react";

type UseCtrlSSaveOptions = {
  /** 为 false 时不注册（例如非编辑场景） */
  enabled?: boolean;
  /** 保存进行中等，仍会拦截浏览器默认保存 */
  disabled?: boolean;
  onSave: () => void;
};

function isSaveChord(event: KeyboardEvent) {
  const isModifier = event.metaKey || event.ctrlKey;
  if (!isModifier || event.altKey || event.shiftKey) {
    return false;
  }
  return event.code === "KeyS" || event.key.toLowerCase() === "s";
}

/**
 * Ctrl/Cmd+S：拦截浏览器「保存网页」，并触发当前表单保存。
 * capture + passive:false，配合编辑器内拦截，避免 Chrome ⌘S 仍弹出存网页。
 */
export function useCtrlSSave({
  enabled = true,
  disabled = false,
  onSave,
}: UseCtrlSSaveOptions) {
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const lastSaveAtRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (!isSaveChord(event)) {
        return;
      }

      // 必须同步 preventDefault，否则 Chrome 会打开「存储网页」
      event.preventDefault();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      event.stopPropagation();

      if (disabledRef.current || event.repeat) {
        return;
      }

      const now = Date.now();
      // 全局监听与 TipTap 内拦截可能各触发一次，短时去重
      if (now - lastSaveAtRef.current < 500) {
        return;
      }
      lastSaveAtRef.current = now;
      onSaveRef.current();
    }

    const options: AddEventListenerOptions = {
      capture: true,
      passive: false,
    };

    document.addEventListener("keydown", onKeyDown, options);
    return () => {
      document.removeEventListener("keydown", onKeyDown, options);
    };
  }, [enabled]);
}
