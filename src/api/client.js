import { API_HEADERS, API_SITES } from "./sites";

const SEARCH_TIMEOUT = 9000;
const DETAIL_TIMEOUT = 10000;
const M3U8_PATTERN = /\$?(https?:\/\/[^"'\s]+?\.m3u8[^"'\s]*)/g;

function withTimeout(ms) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  return { controller, timeoutId };
}

function stripHtml(value = "") {
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueBy(items, getKey) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeApiBase(url) {
  return url.replace(/\/+$/, "");
}

function getSearchUrl(site, query, page = 1) {
  const base = normalizeApiBase(site.api);
  const encoded = encodeURIComponent(query);
  if (page <= 1) return `${base}?ac=videolist&wd=${encoded}`;
  return `${base}?ac=videolist&wd=${encoded}&pg=${page}`;
}

function getDetailUrl(site, id) {
  return `${normalizeApiBase(site.api)}?ac=videolist&ids=${encodeURIComponent(id)}`;
}

async function fetchJson(url, timeout) {
  const { controller, timeoutId } = withTimeout(timeout);
  try {
    const response = await fetch(url, {
      headers: API_HEADERS,
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchText(url, timeout) {
  const { controller, timeoutId } = withTimeout(timeout);
  try {
    const response = await fetch(url, {
      headers: { Accept: "text/html,*/*" },
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function searchSource(sourceKey, query) {
  const site = API_SITES[sourceKey];
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
    console.warn(`Search failed for ${sourceKey}:`, error.message);
    return [];
  }
}

export async function searchManySources(sourceKeys, query) {
  const batches = await Promise.all(sourceKeys.map((key) => searchSource(key, query)));
  const merged = batches.flat();
  return uniqueBy(merged, (item) => `${item.sourceKey}:${item.id}`);
}

function parseEpisodesFromPlayUrl(playUrl = "") {
  if (!playUrl) return [];
  const firstSource = String(playUrl).split("$$$")[0] || "";
  return firstSource
    .split("#")
    .map((episode, index) => {
      const parts = episode.split("$");
      const title = parts.length > 1 ? parts[0] : `第 ${index + 1} 集`;
      const url = parts.length > 1 ? parts[1] : parts[0];
      return {
        title: title || `第 ${index + 1} 集`,
        url: (url || "").trim()
      };
    })
    .filter((episode) => /^https?:\/\//.test(episode.url));
}

function parseEpisodesFromText(text = "") {
  const matches = [];
  let match;
  while ((match = M3U8_PATTERN.exec(text))) {
    matches.push({
      title: `第 ${matches.length + 1} 集`,
      url: match[1].replace(/[),]+$/, "")
    });
  }
  return uniqueBy(matches, (episode) => episode.url);
}

async function loadHtmlDetail(site, id, sourceKey) {
  if (!site.detail) return null;

  const detailUrl = `${normalizeApiBase(site.detail)}/index.php/vod/detail/id/${encodeURIComponent(id)}.html`;
  const html = await fetchText(detailUrl, DETAIL_TIMEOUT);
  const title = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() || "";
  const desc = html.match(/<div[^>]*class=["']sketch["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] || "";

  return {
    title,
    desc: stripHtml(desc),
    sourceKey,
    sourceName: site.name,
    episodes: parseEpisodesFromText(html),
    detailUrl
  };
}

export async function loadDetail(result) {
  const site = API_SITES[result.sourceKey];
  if (!site) throw new Error("资源不存在");

  try {
    const data = await fetchJson(getDetailUrl(site, result.id), DETAIL_TIMEOUT);
    const item = Array.isArray(data?.list) ? data.list[0] : null;
    if (!item) throw new Error("详情为空");

    let episodes = parseEpisodesFromPlayUrl(item.vod_play_url);
    if (episodes.length === 0) {
      episodes = parseEpisodesFromText(item.vod_content || "");
    }

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
