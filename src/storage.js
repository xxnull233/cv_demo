import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_SELECTED_SOURCES } from "./api/sites";

const SOURCE_KEY = "libretv.mobile.selectedSources";
const CUSTOM_SOURCE_KEY = "libretv.mobile.customSources";
const HISTORY_KEY = "libretv.mobile.history";

export async function loadSelectedSources() {
  const raw = await AsyncStorage.getItem(SOURCE_KEY);
  if (!raw) return DEFAULT_SELECTED_SOURCES;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SELECTED_SOURCES;
  } catch {
    return DEFAULT_SELECTED_SOURCES;
  }
}

export async function saveSelectedSources(sourceKeys) {
  await AsyncStorage.setItem(SOURCE_KEY, JSON.stringify(sourceKeys));
}

function normalizeCustomSource(source) {
  if (!source || typeof source !== "object") return null;
  const key = String(source.key || "").trim();
  const name = String(source.name || "").trim();
  const api = String(source.api || "").trim();
  const detail = String(source.detail || "").trim();
  if (!key || !name || !api) return null;
  return {
    key,
    name,
    api,
    detail,
    isCustom: true
  };
}

export async function loadCustomSources() {
  const raw = await AsyncStorage.getItem(CUSTOM_SOURCE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeCustomSource).filter(Boolean);
  } catch {
    return [];
  }
}

export async function saveCustomSources(sources) {
  const normalized = Array.isArray(sources)
    ? sources.map(normalizeCustomSource).filter(Boolean)
    : [];
  await AsyncStorage.setItem(CUSTOM_SOURCE_KEY, JSON.stringify(normalized));
}

export async function loadSourceSettings() {
  const [selectedSources, customSources] = await Promise.all([
    loadSelectedSources(),
    loadCustomSources()
  ]);
  return { selectedSources, customSources };
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

export async function updateHistoryProgress(id, sourceKey, progress) {
  const history = await loadHistory();
  const next = history.map((entry) => {
    if (entry.sourceKey === sourceKey && entry.id === id) {
      return { ...entry, ...progress, watchedAt: Date.now() };
    }
    return entry;
  });
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}
const FAVORITES_KEY = "libretv.mobile.favorites";
const LAST_FAVORITE_FOLDER_KEY = "libretv.mobile.lastFavoriteFolder";
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



