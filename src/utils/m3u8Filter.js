import { resolveUrl, getPathDir, detectAdSegments, parseMasterPlaylist } from "./m3u8Parser";

/**
 * m3u8 广告过滤 — 移动端本地过滤链路
 * 下载 m3u8 → 解析 segment → 检测广告 → 删除广告段 → 展开绝对路径
 */

// ─── 解析 m3u8 ────────────────────────────────────────────────────

function parseSegments(text) {
  const lines = text.split("\n");
  const segments = [];
  let currentExtinf = null;
  let currentExtinfLine = -1;
  let currentKey = null;
  let hasDiscontinuity = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const l = raw.trim();
    if (!l) continue;

    if (l.startsWith("#EXTINF:")) {
      currentExtinf = parseFloat(l.replace("#EXTINF:", "").replace(",", ""));
      currentExtinfLine = i;
    } else if (l.startsWith("#EXT-X-KEY:")) {
      currentKey = l;
    } else if (l.startsWith("#EXT-X-DISCONTINUITY")) {
      hasDiscontinuity = true;
    } else if (!l.startsWith("#")) {
      segments.push({
        url: l,
        duration: currentExtinf || 0,
        key: currentKey,
        afterDiscontinuity: hasDiscontinuity,
        urlLineIndex: i,
        extinfLineIndex: currentExtinfLine,
      });
      currentExtinf = null;
      currentExtinfLine = -1;
    }
  }

  return segments;
}

// ─── 原地删除广告分段 ────────────────────────────────────────────

function removeAdLines(text, segments, adIndices) {
  if (adIndices.size === 0) return null;

  const lines = text.split("\n");
  const removeSet = new Set();

  for (const idx of adIndices) {
    const seg = segments[idx];
    if (seg.extinfLineIndex >= 0) removeSet.add(seg.extinfLineIndex);
    removeSet.add(seg.urlLineIndex);
  }

  const sortedAdIdx = [...adIndices].sort((a, b) => a - b);
  const firstAdSeg = segments[sortedAdIdx[0]];
  if (firstAdSeg) {
    const lineBefore = firstAdSeg.extinfLineIndex - 1;
    if (lineBefore >= 0) {
      const trimmed = lines[lineBefore].trim();
      if (trimmed.startsWith("#EXT-X-KEY:METHOD=NONE")) {
        removeSet.add(lineBefore);
      }
    }
  }

  const lastAdSeg = segments[sortedAdIdx[sortedAdIdx.length - 1]];
  if (lastAdSeg) {
    const lineAfter = lastAdSeg.urlLineIndex + 1;
    if (lineAfter < lines.length) {
      const trimmed = lines[lineAfter].trim();
      if (trimmed.startsWith("#EXT-X-DISCONTINUITY")) {
        removeSet.add(lineAfter);
      }
    }
  }

  const result = [];
  let inAdBlock = false;

  for (let i = 0; i < lines.length; i++) {
    if (removeSet.has(i)) {
      inAdBlock = true;
      continue;
    }
    if (inAdBlock) {
      inAdBlock = false;
    }
    result.push(lines[i]);
  }

  if (result.length === lines.length && result.every((v, i) => v === lines[i])) {
    return null;
  }

  const trimmed = result.map(l => l.trim()).filter(Boolean);
  if (trimmed.length > 0 && trimmed[trimmed.length - 1] !== "#EXT-X-ENDLIST") {
    result.push("#EXT-X-ENDLIST");
  }

  const output = result.join("\n");
  return output.trim() ? output : null;
}

// ─── 相对路径转绝对路径 ─────────────────────────────────────────

function resolveAllUrls(text, baseUrl) {
  const uriPattern = /URI="([^"]+)"/g;
  const lines = text.split("\n");
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith("#")) {
        return line.replace(uriPattern, (match, uri) => {
          const resolved = resolveUrl(baseUrl, uri);
          return resolved !== uri ? `URI="${resolved}"` : match;
        });
      }
      return resolveUrl(baseUrl, trimmed) || line;
    })
    .join("\n");
}

// ─── 核心过滤逻辑（纯文本）──────────────────────────────────────

/**
 * 对已下载的 m3u8 文本执行广告过滤，返回过滤后的纯文本。
 * 相对路径的 segment URL 会被展开为绝对地址。
 * @param {string} text - m3u8 playlist 原始文本
 * @param {string} baseUrl - 原始 m3u8 URL（用于解析相对路径和检测广告）
 * @returns {string|null} 过滤后的文本，无合法段时返回 null
 */
export function filterSegmentsText(text, baseUrl) {
  const segments = parseSegments(text);
  if (segments.length === 0) return null;

  const adIndices = detectAdSegments(segments, baseUrl);
  const filtered = removeAdLines(text, segments, adIndices);
  if (!filtered) return null;

  return resolveAllUrls(filtered, baseUrl);
}
