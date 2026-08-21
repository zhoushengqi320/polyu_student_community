import { PERMANENT_MODULES } from "@/constants/modules";

export type HomeTourStep = {
  id: string;
  /** 对应 DOM 上的 data-tour 值；省略则为居中弹窗步骤 */
  target?: string;
  title: string;
  description: string;
};

const MODULE_TOUR_COPY: Record<
  (typeof PERMANENT_MODULES)[number]["key"],
  { title: string; description: string }
> = {
  courses: {
    title: "课程评价",
    description:
      "选课前先看真实评价：难度、工作量、给分、考试与作业体验，帮你少踩坑、选到合适的课。",
  },
  food: {
    title: "吃喝玩乐",
    description:
      "校园周边美食与休闲推荐，发现同学常去的餐厅与好去处，不用到处问群聊。",
  },
  study: {
    title: "学习指南",
    description:
      "选课策略、常用官网、GPA 与考试技巧等学习资料，整理成文方便查阅。",
  },
  life: {
    title: "生活指南",
    description:
      "电话卡、银行、八达通、医疗、交通等抵港与生活适应信息，新生老手都实用。",
  },
  forum: {
    title: "自由讨论区",
    description:
      "课程求助、校园闲聊、实习分享；用「找搭子」话题组队学习、约饭、运动或项目。",
  },
};

export const HOME_TOUR_STEPS: HomeTourStep[] = [
  {
    id: "welcome",
    title: "欢迎来到 PolyUHub",
    description:
      "这里是 PolyU 学生自己的校园信息社区。接下来带你快速认识首页最重要的几个板块。",
  },
  {
    id: "search",
    target: "home-search",
    title: "全局搜索",
    description: "点击页眉放大镜即可搜索课程、指南、帖子或攻略。",
  },
  ...PERMANENT_MODULES.map((module) => ({
    id: `module-${module.key}`,
    target: `home-module-${module.key}`,
    title: MODULE_TOUR_COPY[module.key].title,
    description: MODULE_TOUR_COPY[module.key].description,
  })),
  {
    id: "latest-forum",
    target: "home-latest-forum",
    title: "最新讨论",
    description: "看看同学们最近在讨论什么，随时加入交流或发布新帖。",
  },
  {
    id: "finish",
    title: "准备就绪",
    description:
      "你已经了解 PolyUHub 的主要功能。选课前，先查 PolyUHub——开始探索吧！",
  },
];
