/**
 * 学习 / 生活 / 入学攻略列表展示顺序（与 content/ 下文件编号一致）。
 * 未出现在表中的条目排在后面，再按 title 稳定排序。
 */
export const GUIDE_LIST_ORDER: Record<string, readonly string[]> = {
  study: [
    "常用官网",
    "选课策略",
    "GPA规则",
    "考试安排",
    "学术规范",
    "校园地图",
    "图书馆",
    "自习空间",
    "校内设施设备",
  ],
  life: [
    "电话卡",
    "银行开户",
    "八达通办理",
    "商超采购",
    "快递外卖",
    "基础医疗",
    "水电煤气与生活缴费",
    "邮政与信件收发",
    "本地生活规则",
    "生活服务",
    "交通出行",
    "口岸介绍",
  ],
  guides: [
    "入学前准备：证件与行前清单",
    "初次抵港：通关、到校与临时住宿",
    "租房指南：热门区域与找房渠道",
    "租房指南：看房、签约与费用",
    "租房指南：验房退租、防骗与合租",
    "学校注册：NetID、eStudent、选课与学生卡",
    "宿舍指南：红磡与何文田、申请与保宿",
  ],
} as const;

export function compareByGuideListOrder(
  module: string,
  leftTitle: string,
  rightTitle: string,
): number {
  const order = GUIDE_LIST_ORDER[module];
  if (!order) {
    return leftTitle.localeCompare(rightTitle, "zh-Hans");
  }

  const leftIndex = order.indexOf(leftTitle);
  const rightIndex = order.indexOf(rightTitle);
  const leftRank = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
  const rightRank = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  return leftTitle.localeCompare(rightTitle, "zh-Hans");
}
