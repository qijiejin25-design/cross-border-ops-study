import fs from "node:fs";
import path from "node:path";
import { interviewQuestions } from "./interview-questions.mjs";

const root = process.cwd();
const sourceDir = path.join(root, "跨境运营知识库");
const webDir = path.join(root, "web");

const files = fs
  .readdirSync(sourceDir)
  .filter((file) => file.endsWith(".md"))
  .sort((a, b) => {
    if (a === "README.md") return -1;
    if (b === "README.md") return 1;
    return a.localeCompare(b, "zh-Hans-CN");
  });

const chapters = files.map((file, index) => {
  const markdown = fs.readFileSync(path.join(sourceDir, file), "utf8");
  const firstLine = markdown.split(/\r?\n/).find((line) => line.startsWith("# "));
  return {
    id: file.replace(/\.md$/, ""),
    file,
    order: index,
    title: firstLine ? firstLine.replace(/^#\s+/, "") : file.replace(/\.md$/, ""),
    markdown,
  };
});

const days = [
  {
    day: 1,
    title: "行业链路和核心指标",
    tasks: ["读 01、02、03 中的链路和指标部分", "背 CTR、CVR、ROI、ROAS、GMV、AOV", "完成 10 道基础指标面试题", "写 1 分钟回答：跨境运营是什么"],
  },
  {
    day: 2,
    title: "平台差异速记",
    tasks: ["读 05 平台经营模式对比", "背 Amazon、TikTok Shop、Shopee、eBay 的差异", "完成 12 道平台题", "写一张四平台对比表"],
  },
  {
    day: 3,
    title: "TikTok 运营冲刺",
    tasks: ["读 04 TikTok 运营从 0 到 1", "拆 3 条带货视频的钩子、卖点和行动引导", "写 3 条 20 秒短视频脚本", "完成 TikTok 相关面试题"],
  },
  {
    day: 4,
    title: "选品和商品页",
    tasks: ["读 06 选品内容流量转化 SOP", "用需求、竞争、利润、供应、合规、内容性给 3 个产品打分", "写一个用户画像", "完成选品和商品页题"],
  },
  {
    day: 5,
    title: "数据诊断和复盘",
    tasks: ["背销售额拆解公式", "练习曝光高 CTR 低、CTR 高 CVR 低、利润低三个场景", "写一份周复盘模板", "完成数据诊断题"],
  },
  {
    day: 6,
    title: "案例题和行为面试",
    tasks: ["读 07 案例分析和 08 面试题库", "准备 TikTok 新店第一周运营方案", "准备没经验为什么适合岗位", "完成案例题和行为面试题"],
  },
  {
    day: 7,
    title: "模拟面试和补缺",
    tasks: ["刷互动面试题至少 30 分钟", "录 1 分钟自我介绍", "整理 3 个反问面试官的问题", "复习答错的题和今日笔记"],
  },
];

const payload = `window.KB_DATA = ${JSON.stringify(
  {
    generatedAt: new Date().toISOString(),
    chapters,
    days,
    interviewQuestions,
  },
  null,
  2,
)};\n`;

fs.mkdirSync(webDir, { recursive: true });
fs.writeFileSync(path.join(webDir, "content.js"), payload);
