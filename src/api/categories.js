import { API_HEADERS } from "../constants/app";
import { resolveUrl, withTimeout, normalizeApiBase } from "./utils";
import { stripHtml } from "./parsers";

const CLASS_TIMEOUT = 8000;
const VIDEO_LIST_TIMEOUT = 10000;

/**
 * 获取指定资源站的分类列表
 * 苹果 CMS10 接口: ac=class
 * 返回: { class: [{ type_id, type_name, ... }] }
 */
export async function fetchCategories(site) {
  const base = normalizeApiBase(site.api);
  const url = base + "?ac=class";

  const { controller, timeoutId } = withTimeout(CLASS_TIMEOUT);
  try {
    const response = await fetch(resolveUrl(url), {
      headers: API_HEADERS,
      signal: controller.signal
    });
    if (!response.ok) throw new Error("HTTP " + response.status);

    const text = await response.text();
    const data = JSON.parse(text);
    const classList = Array.isArray(data?.class) ? data.class : [];

    return classList
      .map((item) => ({
        id: String(item.type_id || ""),
        name: stripHtml(item.type_name || ""),
        pid: String(item.pid || "0"),
        sort: Number(item.sort) || 0
      }))
      .filter((item) => item.id && item.name);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 获取某个分类下的视频列表（分页）
 * 苹果 CMS10 接口: ac=videolist&t={classId}&pg={page}
 * 返回: { list: [...], page: 1, pagecount: 10, recordcount: 200 }
 */
export async function fetchCategoryVideos(site, classId, siteKey, page = 1) {
  const base = normalizeApiBase(site.api);
  const url = base + "?ac=videolist&t=" + classId + "&pg=" + page;

  const { controller, timeoutId } = withTimeout(VIDEO_LIST_TIMEOUT);
  try {
    const response = await fetch(resolveUrl(url), {
      headers: API_HEADERS,
      signal: controller.signal
    });
    if (!response.ok) throw new Error("HTTP " + response.status);

    const text = await response.text();
    const data = JSON.parse(text);
    const list = Array.isArray(data?.list) ? data.list : [];

    const items = list.map((item) => ({
      id: String(item.vod_id ?? ""),
      title: item.vod_name || "未知视频",
      poster: item.vod_pic || "",
      remarks: item.vod_remarks || item.vod_year || "",
      type: item.type_name || "",
      sourceKey: siteKey || "",
      sourceName: site.name,
      raw: item
    }));

    return {
      items,
      page: data.page || 1,
      pageCount: data.pagecount || 1,
      total: data.recordcount || 0
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
