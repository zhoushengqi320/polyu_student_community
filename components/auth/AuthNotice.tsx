import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  ENV_FILE_EXAMPLE,
  ENV_FILE_LOCAL,
} from "@/constants/site";

export function AuthNotice() {
  if (isSupabaseConfigured()) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-medium">认证服务尚未配置</p>
      <p className="mt-1 text-amber-800/90">
        请复制{" "}
        <code className="rounded bg-amber-100 px-1">{ENV_FILE_EXAMPLE}</code>{" "}
        为{" "}
        <code className="rounded bg-amber-100 px-1">{ENV_FILE_LOCAL}</code>
        ，并填入数据库项目地址与匿名访问密钥后再试。
      </p>
    </div>
  );
}
