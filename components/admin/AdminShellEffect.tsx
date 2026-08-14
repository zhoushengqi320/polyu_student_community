"use client";

import { useEffect } from "react";

/** 管理后台挂载时隐藏全站 header/footer，离开时恢复。 */
export function AdminShellEffect() {
  useEffect(() => {
    document.body.classList.add("admin-shell-active");
    return () => {
      document.body.classList.remove("admin-shell-active");
    };
  }, []);

  return null;
}
