import { parseLinesFromPlayUrl } from "../src/api/parsers.js";

const samplePlayFrom = "rym3u8$$$ruyi";
const samplePlayUrl = [
  "第01集$https://svip.ryplay16.com/20260515/539536_3cd9527c/index.m3u8",
  "第01集$https://svip.ryplay16.com/share/d2b41eb6e616ff5f9f0e95ff732fd796"
].join("$$$");

const lines = parseLinesFromPlayUrl(samplePlayUrl, samplePlayFrom);

if (lines.length !== 1 || lines[0].name !== "rym3u8") {
  throw new Error("Expected parser to keep only the direct HLS rym3u8 line.");
}

console.log("OK parser keeps playable HLS lines only");
