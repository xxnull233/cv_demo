import { resolveUrl, getPathDir, detectAdSegments, parseMasterPlaylist, parseM3u8Segments, generateCleanPlaylist } from "./m3u8Parser";

/**
 * m3u8 广告过滤 — 移动端本地过滤链路
 * 下载 m3u8 → 解析 segment → 检测广告 → 删除广告段 → 展开绝对路径
 */

// ─── 核心过滤逻辑（纯文本）──────────────────────────────────────

/**
 * 对已下载的 m3u8 文本执行广告过滤，返回过滤后的纯文本。
 * 相对路径的 segment URL 会被展开为绝对地址。
 * @param {string} text - m3u8 playlist 原始文本
 * @param {string} baseUrl - 原始 m3u8 URL（用于解析相对路径和检测广告）
 * @returns {string|null} 过滤后的文本，无合法段时返回 null
 */
export function filterSegmentsText(text, baseUrl) {
  const { segments } = parseM3u8Segments(text);
  if (segments.length === 0) return null;

  const adIndices = detectAdSegments(segments, baseUrl);
  const result = generateCleanPlaylist(segments, adIndices, baseUrl);

  return result.clean;
}

/**
 * 对 m3u8 URL 进行完整过滤（支持 Master Playlist 多层递归）
 * 与 Web 代理（proxy-server.mjs）逻辑一致
 *
 * 1. 如果是 Master Playlist → 取最高码率子流 → 递归过滤
 * 2. 如果是 Media Playlist → filterSegmentsText 去广告
 *
 * @param {string} m3u8Url - m3u8 地址
 * @returns {Promise<{ text: string|null, error?: string }>}
 */
export async function filterM3u8ByUrl(m3u8Url) {
  const resp = await fetch(m3u8Url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const text = await resp.text();

  // 处理 Master Playlist（多码率）：取最高码率子流递归过滤
  if (text.includes("#EXT-X-STREAM-INF")) {
    const streams = parseMasterPlaylist(text, m3u8Url);
    // 按码率从高到低排序，取最高的
    streams.sort((a, b) => b.bandwidth - a.bandwidth);
    if (streams.length === 0) {
      return { text: null, error: "Master playlist has no streams" };
    }
    return await filterM3u8ByUrl(streams[0].url);
  }

  // 处理 Media Playlist（直接含 .ts 片段）
  const cleanText = filterSegmentsText(text, m3u8Url);
  if (!cleanText) {
    return { text: null, error: "All segments filtered as ads or no valid segments" };
  }

  return { text: cleanText };
}
