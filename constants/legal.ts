export const LEGAL_DOCUMENTS = {
  privacy: {
    slug: "privacy",
    title: "私隐政策",
    description:
      "依据香港《个人资料（私隐）条例》说明本平台如何收集、使用与保护个人资料。",
    file: "privacy.txt",
  },
  terms: {
    slug: "terms",
    title: "网站使用条款",
    description:
      "说明平台服务范围、账号规则、内容规范、免责声明及香港法管辖约定。",
    file: "terms.txt",
  },
  copyright: {
    slug: "copyright",
    title: "版权与侵权免责声明",
    description:
      "依据香港《版权条例》说明内容版权归属、引用规范与侵权投诉处理机制。",
    file: "copyright.txt",
  },
  communityRules: {
    slug: "community-rules",
    title: "社区规则",
    description:
      "说明 PolyUHub 鼓励分享的内容、明确禁止事项，以及举报与处理约定。",
    file: "community-rules.txt",
  },
} as const;

export type LegalSlug = keyof typeof LEGAL_DOCUMENTS;

export const LEGAL_SLUGS = Object.keys(LEGAL_DOCUMENTS) as LegalSlug[];

export const LEGAL_NAV_ITEMS = [
  LEGAL_DOCUMENTS.communityRules,
  LEGAL_DOCUMENTS.privacy,
  LEGAL_DOCUMENTS.terms,
  LEGAL_DOCUMENTS.copyright,
] as const;

export function isLegalSlug(value: string): value is LegalSlug {
  return value in LEGAL_DOCUMENTS;
}

export function getLegalDocumentMeta(slug: LegalSlug) {
  return LEGAL_DOCUMENTS[slug];
}
