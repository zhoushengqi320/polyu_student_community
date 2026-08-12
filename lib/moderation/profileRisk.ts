import {
  CONTENT_RISK_LEVELS,
  type ContentRiskLevel,
} from "@/constants/moderation";
import {
  assessContentRisk,
  type ContentRiskResult,
} from "@/lib/moderation/contentRisk";

const NICKNAME_HIGH_PATTERNS: RegExp[] = [
  /管理员|admin|official|官方客服|理大官方|polyuhub\s*官方/i,
  /习近平|毛泽东|共产党|国民党|台独|港独|疆独|藏独/i,
  /色情|约炮|援交|裸体|性爱|porn|sex\s*worker/i,
];

const NICKNAME_MEDIUM_PATTERNS: RegExp[] = [
  /客服|官方|staff|support/i,
  /傻逼|操你|草泥马|尼玛|妈的|白痴/i,
  /[^\w\u4e00-\u9fff\s\-_.·]{3,}/,
];

function maxRisk(
  a: ContentRiskLevel,
  b: ContentRiskLevel,
): ContentRiskLevel {
  const rank = { low: 0, medium: 1, high: 2 } as const;
  return rank[a] >= rank[b] ? a : b;
}

export function assessNicknameRisk(nickname: string): ContentRiskResult {
  const normalized = nickname.trim();
  if (!normalized) {
    return { level: CONTENT_RISK_LEVELS.low, flags: [] };
  }

  const base = assessContentRisk(normalized);
  const flags = [...base.flags];
  let level = base.level;

  for (const pattern of NICKNAME_HIGH_PATTERNS) {
    if (pattern.test(normalized)) {
      flags.push(`nickname_high:${pattern.source.slice(0, 20)}`);
      level = CONTENT_RISK_LEVELS.high;
    }
  }

  if (level !== CONTENT_RISK_LEVELS.high) {
    for (const pattern of NICKNAME_MEDIUM_PATTERNS) {
      if (pattern.test(normalized)) {
        flags.push(`nickname_medium:${pattern.source.slice(0, 20)}`);
        level = maxRisk(level, CONTENT_RISK_LEVELS.medium);
      }
    }
  }

  return { level, flags };
}

/** 头像无视觉模型时：站内上传默认低风险；外链与可疑 URL 升档 */
export function assessAvatarRisk(avatarUrl: string): ContentRiskResult {
  const url = avatarUrl.trim();
  if (!url) {
    return { level: CONTENT_RISK_LEVELS.low, flags: [] };
  }

  const flags: string[] = [];
  const lower = url.toLowerCase();

  if (
    /telegram|t\.me|whatsapp|weixin|qq\.com\/qr|porn|xxx|adult/i.test(lower)
  ) {
    flags.push("avatar_url:suspicious_host");
    return { level: CONTENT_RISK_LEVELS.high, flags };
  }

  const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? (() => {
        try {
          return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host;
        } catch {
          return null;
        }
      })()
    : null;

  if (supabaseHost && lower.includes(supabaseHost.toLowerCase())) {
    return { level: CONTENT_RISK_LEVELS.low, flags };
  }

  if (lower.startsWith("/") && !lower.startsWith("//")) {
    return { level: CONTENT_RISK_LEVELS.low, flags };
  }

  if (/^https?:\/\//i.test(url)) {
    flags.push("avatar_url:external");
    return { level: CONTENT_RISK_LEVELS.medium, flags };
  }

  flags.push("avatar_url:unusual");
  return { level: CONTENT_RISK_LEVELS.medium, flags };
}

export function assessProfileSubmissionRisk(input: {
  nickname?: string | null;
  avatarUrl?: string | null;
}): ContentRiskResult {
  const nicknameRisk = input.nickname
    ? assessNicknameRisk(input.nickname)
    : { level: CONTENT_RISK_LEVELS.low as ContentRiskLevel, flags: [] };
  const avatarRisk = input.avatarUrl
    ? assessAvatarRisk(input.avatarUrl)
    : { level: CONTENT_RISK_LEVELS.low as ContentRiskLevel, flags: [] };

  return {
    level: maxRisk(nicknameRisk.level, avatarRisk.level),
    flags: [...nicknameRisk.flags, ...avatarRisk.flags],
  };
}
