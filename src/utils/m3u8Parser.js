/**
 * m3u8 解析与广告检测 — 共享纯函数
 * 不含任何平台 API（Browser / Node / React Native），
 * 可被前端 m3u8Filter.js 和后端 proxy-server.mjs 共同引用。
 */

export function resolveUrl(base, relative) {
  if (!relative) return "";
  if (relative.startsWith("http://") || relative.startsWith("https://")) return relative;
  try {
    const baseUrl = new URL(base);
    if (relative.startsWith("/")) return baseUrl.origin + relative;
    const baseDir = base.substring(0, base.lastIndexOf("/") + 1);
    return new URL(relative, baseDir).href;
  } catch {
    return relative;
  }
}

export function getPathDir(url) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    parts.pop();
    const dir = parts.slice(-3).join("/");
    return parsed.hostname + (dir ? "/" + dir : "");
  } catch {
    return "";
  }
}

// ─── 广告检测策略 ───────────────────────────────────

/**
 * 策略 1：DISCONTINUITY 路径差异
 * 检测 #EXT-X-DISCONTINUITY 标记，对比前后 segments 路径目录。
 * 若前段路径全异于后段 → 前段为广告。
 * @param {Array} segments - segment 数组，每项需含 { url, afterDiscontinuity }
 * @param {string} baseUrl - 用于解析相对路径
 * @returns {Set<number>} 广告段索引集合
 */
export function detectByDiscontinuity(segments, baseUrl) {
  const adIndices = new Set();
  if (segments.length < 3) return adIndices;

  const firstDiscIdx = segments.findIndex((s) => s.afterDiscontinuity);
  if (firstDiscIdx > 0) {
    const pre = segments.slice(0, firstDiscIdx);
    const post = segments.slice(firstDiscIdx);
    const prePaths = [...new Set(pre.map((s) => getPathDir(resolveUrl(baseUrl, s.url))))];
    const postPaths = [...new Set(post.map((s) => getPathDir(resolveUrl(baseUrl, s.url))))];
    if (prePaths.every((p) => !postPaths.includes(p)) && postPaths.length >= 1) {
      for (let i = 0; i < firstDiscIdx; i++) adIndices.add(i);
    }
  }

  return adIndices;
}

/**
 * 策略 2：均匀时长检测
 * 按 DISCONTINUITY 边界分组，若某组内有 ≥5 个 segment 时长 ≈ 4 秒，
 * 则整个组判定为广告（常见于固定片头片尾广告）。
 * @param {Array} segments - segment 数组
 * @param {string} baseUrl - 用于解析相对路径（本策略未使用）
 * @returns {Set<number>} 广告段索引集合
 */
export function detectByUniformDuration(segments, baseUrl) {
  const adIndices = new Set();
  if (segments.length < 3) return adIndices;

  // 按 DISCONTINUITY 边界分组
  let groupStart = 0;
  for (let i = 0; i <= segments.length; i++) {
    const isBoundary = i === segments.length || segments[i].afterDiscontinuity;
    if (isBoundary) {
      if (i > groupStart) {
        const countMatch = (function () {
          var n = 0;
          for (var j = groupStart; j < i; j++) {
            if (Math.abs(segments[j].duration - 4) < 0.01) n++;
          }
          return n;
        })();
        if (countMatch === 5) {
          for (var j = groupStart; j < i; j++) adIndices.add(j);
        }
      }
      groupStart = i;
    }
  }

  return adIndices;
}

/**
 * 默认组合策略（当前行为）
 * 先试 DISCONTINUITY 策略，无命中再用前缀路径策略。
 * @param {Array} segments - segment 数组
 * @param {string} baseUrl - 用于解析相对路径
 * @returns {Set<number>} 广告段索引集合
 */
export function detectAdSegments(segments, baseUrl) {
  const discResult = detectByDiscontinuity(segments, baseUrl);
  if (discResult.size > 0) return discResult;
  return new Set();
}

/**
 * 探测器工厂 — 从多个策略函数按顺序组合。
 * 依次尝试每个策略，第一个返回非空结果者生效。
 *
 * @param {...Function} strategies - 策略函数列表，签名 (segments, baseUrl) => Set<number>
 * @returns {Function} 组合探测器 (segments, baseUrl) => Set<number>
 *
 * @example
 * const detector = createDetector(detectByDiscontinuity);

 */
export function createDetector(...strategies) {
  return function (segments, baseUrl) {
    for (const strategy of strategies) {
      const result = strategy(segments, baseUrl);
      if (result.size > 0) return result;
    }
    return new Set();
  };
}

// ─── Playlist 解析 ─────────────────────────────────

/**
 * 解析多码率 Master Playlist，提取各子流 URL（已转绝对路径）
 */
export function parseMasterPlaylist(text, masterUrl) {
  if (!text) return [];
  const lines = text.split("\n");
  const streams = [];
  let currentInfo = null;

  for (const raw of lines) {
    const l = raw.trim();
    if (!l) continue;
    if (l.startsWith("#EXT-X-STREAM-INF:")) {
      const bw = parseInt(l.match(/BANDWIDTH=(\d+)/)?.[1] || "0", 10);
      currentInfo = { bandwidth: bw };
    } else if (!l.startsWith("#") && currentInfo) {
      streams.push({ url: resolveUrl(masterUrl, l), bandwidth: currentInfo.bandwidth });
      currentInfo = null;
    }
  }

  return streams;
}

/**
 * 解析 Media Playlist，提取所有 segment
 * @param {string} text - m3u8 playlist 原始文本
 * @returns {{ segments: Array, hasDiscontinuity: boolean }}
 */
export function parseM3u8Segments(text) {
  const lines = text.split("\n");
  const segments = [];
  let currentExtinf = null;
  let currentKey = null;
  let hasDiscontinuity = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith("#EXTINF:")) {
      const duration = parseFloat(line.replace("#EXTINF:", "").replace(",", ""));
      currentExtinf = duration;
    } else if (line.startsWith("#EXT-X-KEY:")) {
      currentKey = line;
    } else if (line.startsWith("#EXT-X-DISCONTINUITY")) {
      hasDiscontinuity = true;
    } else if (!line.startsWith("#")) {
      segments.push({
        url: line,
        duration: currentExtinf || 0,
        key: currentKey,
        afterDiscontinuity: hasDiscontinuity,
      });
      currentExtinf = null;
      hasDiscontinuity = false;
    }
  }

  return { segments, hasDiscontinuity };
}

/**
 * 重建 playlist — 删除广告段后全新生成
 * @param {Array} segments - 完整 segment 数组
 * @param {Set<number>} adIndices - 广告段索引集合
 * @param {string} baseUrl - 原始 m3u8 URL（用于展开相对路径）
 * @returns {{ clean: string|null, adCount: number, totalCount: number }}
 */
export function generateCleanPlaylist(segments, adIndices, baseUrl) {
  const cleanSegments = segments.filter((_, i) => !adIndices.has(i));

  if (cleanSegments.length === 0) {
    return { clean: null, adCount: segments.length, totalCount: segments.length };
  }

  const lines = [];
  lines.push("#EXTM3U");
  lines.push("#EXT-X-VERSION:3");
  lines.push("#EXT-X-TARGETDURATION:10");
  lines.push("#EXT-X-PLAYLIST-TYPE:VOD");
  lines.push("#EXT-X-MEDIA-SEQUENCE:0");

  let currentKey = null;
  for (const seg of cleanSegments) {
    if (seg.key && seg.key !== currentKey) {
      const resolvedKey = seg.key.replace(
        /URI="([^"]+)"/g,
        (_, uri) => 'URI="' + resolveUrl(baseUrl, uri) + '"'
      );
      lines.push(resolvedKey);
      currentKey = seg.key;
    }
    lines.push("#EXTINF:" + seg.duration.toFixed(3) + ",");
    lines.push(resolveUrl(baseUrl, seg.url));
  }

  lines.push("#EXT-X-ENDLIST");

  return {
    clean: lines.join("\n"),
    adCount: segments.length - cleanSegments.length,
    totalCount: segments.length,
  };
}
