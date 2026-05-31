import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const webDir = path.join(root, "web");
const distDir = path.join(root, "dist");

const html = fs.readFileSync(path.join(webDir, "index.html"), "utf8");
const css = fs.readFileSync(path.join(webDir, "styles.css"), "utf8");
const content = fs.readFileSync(path.join(webDir, "content.js"), "utf8");
const app = fs.readFileSync(path.join(webDir, "app.js"), "utf8");

const bundled = html
  .replace('<link rel="stylesheet" href="./styles.css" />', () => `<style>\n${css}\n</style>`)
  .replace('<script src="./content.js"></script>', () => `<script>\n${content}\n</script>`)
  .replace('<script src="./app.js"></script>', () => `<script>\n${app}\n</script>`);

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, "index.html"), bundled);
