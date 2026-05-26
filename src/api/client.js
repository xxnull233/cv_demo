import { API_HEADERS } from "./sites";
import { resolveUrl, withTimeout, normalizeApiBase } from "./utils";
import {
  linesFromText,
  parseLinesFromPlayUrl,
  stripHtml,
  uniqueBy
} from "./parsers";

const SEARCH_TIMEOUT = 9000;
const DETAIL_TIMEOUT = 10000;

function getSearchUrl(site, query, page = 1) {
  const base = normalizeApiBase(site.api);
  const encoded = encodeURIComponent(query);
  if (page <= 1) return base + "?ac=videolist&wd=" + encoded;
  return base + "?ac=videolist&wd=" + encoded + "&pg=" + page;
}

function getDetailUrl(site, id) {
  return normalizeApiBase(site.api) + "?ac=videolist&ids=" + encodeURIComponent(id);
}

async function fetchJson(url, timeout) {
  const { controller, timeoutId } = withTimeout(timeout);
  try {
    const response = await fetch(resolveUrl(url), {
      headers: API_HEADERS,
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchText(url, timeout) {
  const { controller, timeoutId } = withTimeout(timeout);
  try {
    const response = await fetch(resolveUrl(url), {
      headers: { Accept: "text/html,*/*" },
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function searchSource(sourceKey, query, sourceMap) {
  const site = sourceMap?.[sourceKey];
  if (!site || !query.trim()) return [];

  try {
    const data = await fetchJson(getSearchUrl(site, query), SEARCH_TIMEOUT);
    const list = Array.isArray(data?.list) ? data.list : [];

    return list.map((item) => ({
      id: String(item.vod_id ?? ""),
      title: item.vod_name || "未知视频",
      poster: item.vod_pic || "",
      remarks: item.vod_remarks || item.vod_year || "",
      type: item.type_name || "",
      sourceKey,
      sourceName: site.name,
      raw: item
    }));
  } catch (error) {
    console.warn("Search failed for " + sourceKey + ":", error.message);
    return [];
  }
}

export async function searchManySources(sourceKeys, query, sourceMap) {
  const batches = await Promise.all(
    sourceKeys.map((key) => searchSource(key, query, sourceMap))
  );
  const merged = batches.flat();
  return uniqueBy(merged, (item) => item.sourceKey + ":" + item.id);
}

async function loadHtmlDetail(site, id, sourceKey) {
  if (!site.detail) return null;

  const detailUrl = normalizeApiBase(site.detail) + "/index.php/vod/detail/id/" + encodeURIComponent(id) + ".html";
  const html = await fetchText(detailUrl, DETAIL_TIMEOUT);
  const title = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() || "";
  const desc = html.match(/<div[^>]*class=["']sketch["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] || "";
  const lines = linesFromText(html);

  return {
    title,
    desc: stripHtml(desc),
    sourceKey,
    sourceName: site.name,
    lines,
    episodes: lines[0]?.episodes || [],
    detailUrl
  };
}

export async function loadDetail(result, sourceMap) {
  const site = sourceMap?.[result.sourceKey];
  if (!site) throw new Error("资源不存在");

  try {
    const data = await fetchJson(getDetailUrl(site, result.id), DETAIL_TIMEOUT);
    const item = Array.isArray(data?.list) ? data.list[0] : null;
    if (!item) throw new Error("详情为空");

    let lines = parseLinesFromPlayUrl(item.vod_play_url, item.vod_play_from);
    if (lines.length === 0) {
      lines = linesFromText(item.vod_content || "");
    }
    const episodes = lines[0]?.episodes || [];

    return {
      title: item.vod_name || result.title,
      poster: item.vod_pic || result.poster,
      desc: stripHtml(item.vod_content || ""),
      type: item.type_name || result.type,
      year: item.vod_year || "",
      area: item.vod_area || "",
      actor: item.vod_actor || "",
      director: item.vod_director || "",
      sourceKey: result.sourceKey,
      sourceName: site.name,
      lines,
      episodes,
      detailUrl: getDetailUrl(site, result.id)
    };
  } catch (jsonError) {
    if (!site.detail) throw jsonError;
    const htmlDetail = await loadHtmlDetail(site, result.id, result.sourceKey);
    if (!htmlDetail || htmlDetail.episodes.length === 0) throw jsonError;
    return {
      ...htmlDetail,
      title: htmlDetail.title || result.title,
      poster: result.poster,
      type: result.type
    };
  }
}
