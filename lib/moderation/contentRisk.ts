import {
  CONTENT_RISK_LEVELS,
  type ContentRiskLevel,
} from "@/constants/moderation";

const HIGH_RISK_PATTERNS: RegExp[] = [
  /代写|代考|卖答案|泄题|漏题|exam\s*paper|cheating\s*service/i,
  /代做\s*assignment|帮写\s*essay|ghost\s*write/i,
  /\b(whatsapp|telegram|wechat|微信)\s*[:：]?\s*(\+?\d{8,})/i,
];

const MEDIUM_RISK_PATTERNS: RegExp[] = [
  /加微信|加vx|扫码|私聊转账|兼职刷单|代开/i,
  /http[s]?:\/\//i,
  /(fuck|shit|死全家|去死|垃圾老师|废物)/i,
  /\b\d{8}\b/,
];

const HIGH_RISK_KEYWORDS = [
  "代写",
  "代考",
  "卖答案",
  "泄题",
  "漏题",
  "作弊",
  "枪手",
];

const MEDIUM_RISK_KEYWORDS = [
  "诈骗",
  "刷单",
  "私聊",
  "加我",
  "vx",
  "微信",
  "telegram",
];

export type ContentRiskResult = {
  level: ContentRiskLevel;
  flags: string[];
};

export function assessContentRisk(text: string): ContentRiskResult {
  const normalized = text.trim();
  const flags: string[] = [];

  if (!normalized) {
    return { level: CONTENT_RISK_LEVELS.low, flags };
  }

  for (const pattern of HIGH_RISK_PATTERNS) {
    if (pattern.test(normalized)) {
      flags.push(`pattern:${pattern.source.slice(0, 24)}`);
    }
  }

  for (const keyword of HIGH_RISK_KEYWORDS) {
    if (normalized.toLowerCase().includes(keyword.toLowerCase())) {
      flags.push(`keyword:${keyword}`);
    }
  }

  if (flags.length > 0) {
    return { level: CONTENT_RISK_LEVELS.high, flags };
  }

  for (const pattern of MEDIUM_RISK_PATTERNS) {
    if (pattern.test(normalized)) {
      flags.push(`pattern:${pattern.source.slice(0, 24)}`);
    }
  }

  for (const keyword of MEDIUM_RISK_KEYWORDS) {
    if (normalized.toLowerCase().includes(keyword.toLowerCase())) {
      flags.push(`keyword:${keyword}`);
    }
  }

  if (flags.length > 0) {
    return { level: CONTENT_RISK_LEVELS.medium, flags };
  }

  return { level: CONTENT_RISK_LEVELS.low, flags };
}

export function assessForumPostRisk(input: {
  title: string;
  content: string;
}): ContentRiskResult {
  const combined = `${input.title}\n${input.content}`;
  return assessContentRisk(combined);
}
