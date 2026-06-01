import AsyncStorage from "@react-native-async-storage/async-storage";

const ALL_SOURCES_KEY = "cv.mobile.allSources";
const HISTORY_KEY = "cv.mobile.history";

export async function loadAllSources() {
  const raw = await AsyncStorage.getItem("cv.mobile.allSources");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(s => s && s.name && s.api) : [];
  } catch { return []; }
}

export async function saveAllSources(sources) {
  const valid = Array.isArray(sources) ? sources.filter(s => s && s.name && s.api) : [];
  await AsyncStorage.setItem("cv.mobile.allSources", JSON.stringify(valid));
}

export function importSourcesFromJson(jsonString, existingSources) {
  let imported;
  try { imported = JSON.parse(jsonString); }
  catch(e) { throw new Error("JSON 解析失败"); }
  if (!Array.isArray(imported)) throw new Error("数据格式错误，应为数组");
  const result = existingSources.slice();
  for (let i = 0; i < imported.length; i++) {
    const item = imported[i];
    if (!item.name || !item.api) continue;
    let existingIndex = -1;
    for (let j = 0; j < result.length; j++) {
      if (result[j].api === item.api || (item.key && result[j].key === item.key)) {
        existingIndex = j; break;
      }
    }
    const key = item.key || Math.random().toString(36).substring(2,10);
    const source = { key: key, name: String(item.name).trim(), api: String(item.api).trim(), excludeClass: typeof item.excludeClass === "string" ? item.excludeClass : "", enabled: item.enabled !== false };
    if (existingIndex >= 0) {
      source.enabled = result[existingIndex].enabled;
      result[existingIndex] = source;
    } else { result.push(source); }
  }
  return result;
}

export async function importSourcesFromUrl(url, existingSources) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("网络请求失败: HTTP " + response.status);
  const text = await response.text();
  return importSourcesFromJson(text, existingSources);
}

export function exportSources(sources) {
  const data = sources.map(function(s) { return { name: s.name, api: s.api, excludeClass: s.excludeClass || "", enabled: s.enabled !== false };});
  return JSON.stringify(data, null, 2);
}

export async function migrateOldSources() {
  const r1 = await AsyncStorage.getItem("cv.mobile.selectedSources");
  const r2 = await AsyncStorage.getItem("cv.mobile.customSources");
  if (!r1 && !r2) return;
  const existing = await loadAllSources();
  if (existing.length > 0) return;
  try {
    const custom = r2 ? JSON.parse(r2) : [];
    if (Array.isArray(custom) && custom.length) {
      const migrated = custom.map(function(cs) { return { key: cs.key, name: cs.name, api: cs.api, excludeClass: "", enabled: true }; });
      await saveAllSources(migrated);
    }
  } catch(e) {}
  await AsyncStorage.removeItem("cv.mobile.selectedSources");
  await AsyncStorage.removeItem("cv.mobile.customSources");
}
export async function loadHistory() {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveHistoryItem(item) {
  const history = await loadHistory();
  const next = [
    {
      ...item,
      watchedAt: Date.now()
    },
    ...history.filter(
      (entry) => !(entry.sourceKey === item.sourceKey && entry.id === item.id)
    )
  ].slice(0, 30);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export async function clearHistory() {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

// 写串行队列：防止快速切换剧集时 read-modify-write 竞态
var _progressWriteQueue = Promise.resolve();

export async function updateHistoryProgress(id, sourceKey, progress) {
  _progressWriteQueue = _progressWriteQueue.then(async function () {
    const history = await loadHistory();
    const next = history.map((entry) => {
      if (entry.sourceKey === sourceKey && entry.id === id) {
        return { ...entry, ...progress, watchedAt: Date.now() };
      }
      return entry;
    });
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    return next;
  });
  return _progressWriteQueue;
}
const FAVORITES_KEY = "cv.mobile.favorites";
const LAST_FAVORITE_FOLDER_KEY = "cv.mobile.lastFavoriteFolder";
const DEFAULT_FAVORITES = {
  folders: [
    {
      id: "default0",
      name: "默认收藏夹",
      videos: []
    }
  ]
};

export function getDefaultFavorites() {
  return {
    folders: DEFAULT_FAVORITES.folders.map((f) => ({ ...f, videos: [] }))
  };
}

function normalizeFavoriteFolder(folder) {
  if (!folder || typeof folder !== "object") return null;
  const id = String(folder.id || "").trim();
  const name = String(folder.name || "").trim();
  if (!id || !name) return null;
  const videos = Array.isArray(folder.videos)
    ? folder.videos.filter((video) => video && video.id && video.sourceKey)
    : [];
  return { id, name, videos };
}

function normalizeFavorites(data) {
  const folders = Array.isArray(data?.folders)
    ? data.folders.map(normalizeFavoriteFolder).filter(Boolean)
    : [];
  return folders.length > 0 ? { folders } : getDefaultFavorites();
}

function parseFavorites(raw) {
  try {
    const parsed = JSON.parse(raw);
    return normalizeFavorites(parsed);
  } catch {
    return getDefaultFavorites();
  }
}

export async function loadFavorites() {
  const raw = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!raw) {
    const retry = await AsyncStorage.getItem(FAVORITES_KEY);
    if (retry) return parseFavorites(retry);
    const defaultData = getDefaultFavorites();
    await saveFavorites(defaultData);
    return defaultData;
  }
  return parseFavorites(raw);
}

async function saveFavorites(data) {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(data));
}

export async function loadLastFavoriteFolderId() {
  const raw = await AsyncStorage.getItem(LAST_FAVORITE_FOLDER_KEY);
  return raw ? String(raw) : "";
}

export async function saveLastFavoriteFolderId(folderId) {
  if (!folderId) return;
  await AsyncStorage.setItem(LAST_FAVORITE_FOLDER_KEY, String(folderId));
}

export function findFavoriteFolderId(favorites, videoId, sourceKey) {
  const folder = favorites?.folders?.find((entry) =>
    (entry.videos ?? []).some((video) => video.id === videoId && video.sourceKey === sourceKey)
  );
  return folder?.id || "";
}

export async function addFavorite(video, folderId) {
  const fav = await loadFavorites();
  const folder = fav.folders.find((f) => f.id === folderId);
  if (!folder) return fav;

  for (const entry of fav.folders) {
    entry.videos = (entry.videos ?? []).filter(
      (v) => !(v.id === video.id && v.sourceKey === video.sourceKey)
    );
  }

  folder.videos.unshift({
    id: video.id,
    title: video.title,
    poster: video.poster,
    sourceKey: video.sourceKey,
    sourceName: video.sourceName,
    type: video.type || "",
    remarks: video.remarks || "",
    favoritedAt: Date.now()
  });
  await saveFavorites(fav);
  await saveLastFavoriteFolderId(folderId);
  return fav;
}

export async function removeFavorite(videoId, sourceKey) {
  const fav = await loadFavorites();
  for (const folder of fav.folders) {
    folder.videos = folder.videos.filter(
      (v) => !(v.id === videoId && v.sourceKey === sourceKey)
    );
  }
  await saveFavorites(fav);
  return fav;
}

export async function isFavorited(videoId, sourceKey) {
  const fav = await loadFavorites();
  return fav.folders.some((folder) =>
    folder.videos.some((v) => v.id === videoId && v.sourceKey === sourceKey)
  );
}

export async function createFavoriteFolder(name) {
  const fav = await loadFavorites();
  const id = Math.random().toString(36).substring(2, 10);
  fav.folders.push({ id, name: name.trim(), videos: [] });
  await saveFavorites(fav);
  return fav;
}

export async function deleteFavoriteFolder(folderId) {
  const fav = await loadFavorites();
  fav.folders = fav.folders.filter((f) => f.id !== folderId);
  await saveFavorites(fav);
  return fav;
}





