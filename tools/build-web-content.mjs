import fs from "node:fs";
import path from "node:path";

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

const planMarkdown = fs.readFileSync(path.join(sourceDir, "09-30天入门学习计划.md"), "utf8");
const dayRegex = /### Day (\d+)\n([\s\S]*?)(?=\n### Day \d+|\n## |$)/g;
const days = [];
let match;

while ((match = dayRegex.exec(planMarkdown))) {
  const day = Number(match[1]);
  const block = match[2].trim();
  const lines = block.split(/\r?\n/);
  const tasks = lines
    .filter((line) => line.trim().startsWith("- "))
    .map((line) => line.replace(/^\s*-\s+/, "").trim());
  days.push({
    day,
    title: getDayTitle(day),
    tasks,
    markdown: block,
  });
}

function getDayTitle(day) {
  if (day <= 7) return "建立行业和指标基础";
  if (day <= 14) return "TikTok 运营专项";
  if (day <= 21) return "平台经营模式";
  return "面试和作品集";
}

const payload = `window.KB_DATA = ${JSON.stringify(
  {
    generatedAt: new Date().toISOString(),
    chapters,
    days,
  },
  null,
  2,
)};\n`;

fs.mkdirSync(webDir, { recursive: true });
fs.writeFileSync(path.join(webDir, "content.js"), payload);

