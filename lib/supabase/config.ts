function isPlaceholder(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized.includes("your_supabase") ||
    normalized === "undefined" ||
    normalized === "null"
  );
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** 仅在 URL/Key 为真实可用配置时返回 true；占位符不算已配置。 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (isPlaceholder(url) || isPlaceholder(anonKey)) {
    return false;
  }

  return isValidHttpUrl(url);
}

export function getSupabasePublicConfig():
  | { url: string; anonKey: string }
  | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
  };
}
