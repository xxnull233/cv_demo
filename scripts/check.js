import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { transformSync } from "@babel/core";

function collectJavaScriptFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return collectJavaScriptFiles(path);
    return entry.name.endsWith(".js") ? [path] : [];
  });
}

const files = ["App.js", ...collectJavaScriptFiles("src")];

for (const file of files) {
  transformSync(readFileSync(join(process.cwd(), file), "utf8"), {
    filename: file,
    presets: ["babel-preset-expo"]
  });
  console.log(`OK ${file}`);
}
