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
