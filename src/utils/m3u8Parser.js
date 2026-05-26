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
    return parts.slice(-3).join("/");
  } catch {
    return "";
  }
}

/**
 * 广告段检测 — 两种策略
 * 策略 1：DISCONTINUITY 后路径切换 → DISCONTINUITY 前为广告
 * 策略 2：无 DISCONTINUITY，前几段路径与主体不同 → 前几段为广告
 * @param {Array} segments - segment 数组，每项需含 { url, afterDiscontinuity }
 * @param {string} baseUrl - 用于解析相对路径
 * @returns {Set<number>} 广告段索引集合
 */
export function detectAdSegments(segments, baseUrl) {
  const adIndices = new Set();
  if (segments.length < 3) return adIndices;

  // 策略 1：DISCONTINUITY + 路径差异
  const firstDiscIdx = segments.findIndex((s) => s.afterDiscontinuity);
  if (firstDiscIdx > 1) {
    const pre = segments.slice(0, firstDiscIdx);
    const post = segments.slice(firstDiscIdx);
    const prePaths = [...new Set(pre.map((s) => getPathDir(resolveUrl(baseUrl, s.url))))];
    const postPaths = [...new Set(post.map((s) => getPathDir(resolveUrl(baseUrl, s.url))))];
    if (prePaths.every((p) => !postPaths.includes(p)) && prePaths.length <= 2 && postPaths.length >= 1) {
      for (let i = 0; i < firstDiscIdx; i++) adIndices.add(i);
      return adIndices;
    }
  }

  // 策略 2：无 DISCONTINUITY，前几段路径不同
  const paths = segments.map((s) => getPathDir(resolveUrl(baseUrl, s.url)));
  const counts = {};
  paths.forEach((p) => { counts[p] = (counts[p] || 0) + 1; });
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (dominant) {
    const firstDom = paths.indexOf(dominant);
    if (firstDom > 1) {
      const firstPaths = new Set(paths.slice(0, firstDom));
      if ([...firstPaths].every((p) => p !== dominant) && firstPaths.size <= 2) {
        for (let i = 0; i < firstDom; i++) adIndices.add(i);
      }
    }
  }

  return adIndices;
}

/**
 * 解析多码率 Master Playlist，提取各子流 URL（已转绝对路径）
 */
export function parseMasterPlaylist(text, masterUrl) {
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
