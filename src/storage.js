import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_SELECTED_SOURCES } from "./api/sites";

const SOURCE_KEY = "libretv.mobile.selectedSources";
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
