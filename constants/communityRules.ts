/** 社区规则页摘要与目录（与 content/legal/community-rules.txt 对齐） */

export const COMMUNITY_RULES_ENCOURAGED = [
  "课程体验：难度、工作量、给分、考核、出勤、Tips 等真实选课参考",
  "学习与生活指南：复习方法、概念讨论、校园办事流程、住宿交通等经验",
  "找搭子与互助：学习、约饭、组队、室友等公开协调信息",
  "实习、RA、校园活动与公开资讯的经验分享",
  "善意提问、礼貌讨论与建设性不同意见",
] as const;

export const COMMUNITY_RULES_PROHIBITED = [
  "骚扰、歧视、仇恨言论、人身攻击、性骚扰",
  "泄露他人隐私（学号、证件、住址、私人联系方式、私人照片等）",
  "诈骗、导流不明交易、金融借贷或违规中介推广",
  "学术不端：代写、代考、售卖答案、泄题或保密试卷、盗版课件",
  "故意散布虚假信息，恶意抹黑学生或教职工",
  "其他违反香港法律、理大校规或平台使用条款的内容",
] as const;

export type CommunityRulesTocItem = {
  id: string;
  label: string;
};

/** 从正文提取一级章节，生成与 LegalDocumentView 一致的锚点 id */
export function getCommunityRulesToc(content: string): CommunityRulesTocItem[] {
  const items: CommunityRulesTocItem[] = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (!match || /^\d+\.\d+/.test(trimmed)) {
      continue;
    }
    items.push({
      id: `section-${match[1]}`,
      label: trimmed,
    });
  }

  return items;
}
