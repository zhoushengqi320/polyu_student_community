const MAX_TRANSLATE_LENGTH = 2000;
const MYMEMORY_MAX_CHARS = 480;

export type TranslateTextResult =
  | { ok: true; translation: string; detectedLang?: string }
  | { ok: false; error: string };

/**
 * 是否包含需要译成中文的非中文外文（拉丁、日文假名、韩文、西里尔等）。
 * 纯中文、数字、标点、emoji 等不含此类字符时返回 false。
 */
export function containsForeignText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }
  if (/[A-Za-z]/.test(trimmed)) {
    return true;
  }
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(trimmed)) {
    return true;
  }
  if (/[\uac00-\ud7af]/.test(trimmed)) {
    return true;
  }
  if (/[\u0400-\u04ff]/.test(trimmed)) {
    return true;
  }
  if (/[\u0600-\u06ff]/.test(trimmed)) {
    return true;
  }
  if (/[\u0e00-\u0e7f]/.test(trimmed)) {
    return true;
  }
  return false;
}

/** 无外文可译：直接返回原文（emoji、纯中文、数字、符号等） */
export function shouldReturnOriginalText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return true;
  }
  return !containsForeignText(trimmed);
}

function acceptSameTranslation(source: string, translation: string): boolean {
  return (
    source.trim().toUpperCase() === translation.trim().toUpperCase() &&
    shouldReturnOriginalText(source)
  );
}

/** 过滤 API 返回的乱译（如纯数字被译成无关 hashtag 文本） */
function isPlausibleTranslation(source: string, translation: string): boolean {
  const s = source.trim();
  const t = translation.trim();
  if (!t) {
    return false;
  }
  if (acceptSameTranslation(s, t)) {
    return true;
  }
  if (/^\d+$/.test(s) && !/^\d+$/.test(t)) {
    return false;
  }
  if (s.length <= 12 && !s.includes("#") && t.includes("#")) {
    return false;
  }
  if (s.length <= 8 && t.length > s.length * 3) {
    return false;
  }
  return true;
}

function guessLangPair(text: string): string {
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
    return "ja|zh-CN";
  }
  if (/[\uac00-\ud7af]/.test(text)) {
    return "ko|zh-CN";
  }
  if (/[\u0400-\u04ff]/.test(text)) {
    return "ru|zh-CN";
  }
  if (/[\u4e00-\u9fff]/.test(text)) {
    return "zh-TW|zh-CN";
  }
  return "en|zh-CN";
}

async function translateViaGoogle(text: string): Promise<TranslateTextResult | null> {
  try {
    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", "auto");
    url.searchParams.set("tl", "zh-CN");
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", text);

    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) {
      return null;
    }

    const data = (await response.json()) as [
      Array<[string, string, ...unknown[]]>,
      string,
    ];
    const translation = data[0]?.map((item) => item[0]).join("").trim();
    if (!translation) {
      return null;
    }

    return {
      ok: true,
      translation,
      detectedLang: data[1],
    };
  } catch {
    return null;
  }
}

async function translateViaMyMemory(text: string): Promise<TranslateTextResult | null> {
  try {
    const chunk = text.slice(0, MYMEMORY_MAX_CHARS);
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", chunk);
    url.searchParams.set("langpair", guessLangPair(chunk));

    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      responseStatus?: number;
      responseData?: { translatedText?: string };
    };

    if (data.responseStatus !== 200) {
      return null;
    }

    const translation = data.responseData?.translatedText?.trim();
    if (!translation) {
      return null;
    }

    if (translation.toUpperCase() === chunk.toUpperCase()) {
      if (acceptSameTranslation(chunk, translation)) {
        return { ok: true, translation };
      }
      return null;
    }

    return { ok: true, translation };
  } catch {
    return null;
  }
}

async function translateViaLibreTranslate(
  text: string,
): Promise<TranslateTextResult | null> {
  try {
    const response = await fetch("https://translate.argosopentech.com/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        q: text.slice(0, MYMEMORY_MAX_CHARS),
        source: "auto",
        target: "zh",
        format: "text",
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { translatedText?: string };
    const translation = data.translatedText?.trim();
    if (!translation) {
      return null;
    }

    return { ok: true, translation };
  } catch {
    return null;
  }
}

export async function translateTextToChinese(
  text: string,
): Promise<TranslateTextResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: "没有可翻译的文字" };
  }
  if (trimmed.length > MAX_TRANSLATE_LENGTH) {
    return { ok: false, error: "文本过长，请复制后使用翻译工具" };
  }
  if (shouldReturnOriginalText(trimmed)) {
    return { ok: true, translation: trimmed };
  }

  const providers = [
    translateViaGoogle,
    translateViaMyMemory,
    translateViaLibreTranslate,
  ] as const;

  for (const provider of providers) {
    const result = await provider(trimmed);
    if (
      result?.ok &&
      isPlausibleTranslation(trimmed, result.translation)
    ) {
      return result;
    }
  }

  return { ok: false, error: "翻译服务暂不可用，请稍后重试" };
}
