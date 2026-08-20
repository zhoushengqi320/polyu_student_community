import { cn } from "@/lib/utils/cn";

/** 表单字段校验失败时的红色边框样式 */
export function formFieldClassName(base: string, hasError?: boolean) {
  return cn(
    base,
    hasError && "border-destructive focus-visible:ring-destructive",
  );
}

export function formControlHasError(
  fieldErrors: Record<string, string> | undefined,
  field: string,
) {
  return Boolean(fieldErrors?.[field]);
}
