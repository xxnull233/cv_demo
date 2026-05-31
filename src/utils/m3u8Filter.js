import { parseMasterPlaylist, parseM3u8Segments, generateCleanPlaylist } from "./m3u8Parser";

/**
 * m3u8 广告过滤 — 移动端本地过滤链路
 * 下载 m3u8 → 解析 segment → 检测广告 → 删除广告段 → 展开绝对路径
 */

// ─── 核心过滤逻辑（纯文本）──────────────────────────────────────

/**
 * 对已下载的 m3u8 文本执行广告过滤，返回过滤后的纯文本。
 * 不传 detector 时不执行过滤，直接返回原文。
 *
 * @param {string} text - m3u8 playlist 原始文本
 * @param {string} baseUrl - 原始 m3u8 URL（用于解析相对路径和检测广告）
 * @param {Function|null} [detector] - 自定义探测器，签名 (segments, baseUrl) => Set<number>
 * @returns {string|null} 过滤后的文本，无合法段时返回 null
 */
export function filterSegmentsText(text, baseUrl, detector) {
  if (!detector) return text;

  const { segments } = parseM3u8Segments(text);
  if (segments.length === 0) return null;

  const adIndices = detector(segments, baseUrl);
  const result = generateCleanPlaylist(segments, adIndices, baseUrl);

  return result.clean;
}

/**
 * 对 m3u8 URL 进行完整过滤（支持 Master Playlist 多层递归）
 *
 * 不传 detector 时直接返回原始内容，不执行任何过滤。
 *
 * @param {string} m3u8Url - m3u8 地址
 * @param {Function|null} [detector] - 自定义探测器，透传给 filterSegmentsText
 * @returns {Promise<{ text: string|null, error?: string }>}
 */
export async function filterM3u8ByUrl(m3u8Url, detector) {
  const resp = await fetch(m3u8Url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const text = await resp.text();

  // 未配置策略 → 原始内容直通
  if (!detector) {
    return { text };
  }

  // 处理 Master Playlist（多码率）：取最高码率子流递归过滤
  if (text.includes("#EXT-X-STREAM-INF")) {
    const streams = parseMasterPlaylist(text, m3u8Url);
    streams.sort((a, b) => b.bandwidth - a.bandwidth);
    if (streams.length === 0) {
      return { text: null, error: "Master playlist has no streams" };
    }
    return await filterM3u8ByUrl(streams[0].url, detector);
  }

  // 处理 Media Playlist（直接含 .ts 片段）
  const cleanText = filterSegmentsText(text, m3u8Url, detector);
  if (!cleanText) {
    return { text: null, error: "All segments filtered as ads or no valid segments" };
  }

  return { text: cleanText };
}
