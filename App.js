import { useEffect, useState } from "react";
import { SafeAreaView, View, StyleSheet, StatusBar } from "react-native";

import { API_SITES } from "./src/api/sites";
import { loadDetail, searchManySources } from "./src/api/client";
import {
  clearHistory,
  loadCustomSources,
  loadHistory,
  loadSelectedSources,
  saveCustomSources,
  saveHistoryItem,
  saveSelectedSources
} from "./src/storage";

import { HomeScreen } from "./src/screens/HomeScreen";
import { PlayerScreen } from "./src/screens/PlayerScreen";
import { CategoryScreen } from "./src/screens/CategoryScreen";

const SOURCE_ENTRIES = Object.entries(API_SITES);

export default function App() {
  // search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // source state
  const [selectedSources, setSelectedSources] = useState([]);
  const [customSources, setCustomSources] = useState([]);

  // modal state
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [history, setHistory] = useState([]);

  // player state
  const [currentDetail, setCurrentDetail] = useState(null);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // player line state
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  // category screen
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  // derived
  const resultCountLabel = results.length > 0 ? `${results.length} 个结果` : "";

  // startup
  useEffect(() => {
    loadSelectedSources().then(setSelectedSources);
    loadCustomSources().then(setCustomSources);
    loadHistory().then(setHistory);
  }, []);

  // combined source entries (built-in + custom) for settings display
  const sourceEntriesWithCustom = [
    ...SOURCE_ENTRIES,
    ...customSources.map((cs) => [cs.key, cs]),
  ];

  // actions
  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setResults([]);
    try {
      const sourceMap = { ...API_SITES };
      for (const cs of customSources) {
        sourceMap[cs.key] = cs;
      }
      const sourceEntries = [...selectedSources, ...customSources.map((cs) => cs.key)];
      const merged = await searchManySources(sourceEntries, trimmed, sourceMap);
      setResults(merged);
    } catch (error) {
      console.warn("Search error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function openResult(result) {
    setDetailLoading(true);
    try {
      const sourceMap = { ...API_SITES };
      for (const cs of customSources) {
        sourceMap[cs.key] = cs;
      }
      const detail = await loadDetail(result, sourceMap);
      if (!detail.episodes.length) {
        alert("该资源没有可播放剧集");
        return;
      }
      setCurrentEpisodeIndex(0);
      setCurrentLineIndex(0);
      setCurrentDetail({ ...detail, id: result.id });
      const nextHistory = await saveHistoryItem({
        id: result.id,
        title: detail.title || result.title,
        poster: detail.poster || result.poster,
        sourceKey: result.sourceKey,
        sourceName: result.sourceName,
        episodeCount: detail.episodes.length
      });
      setHistory(nextHistory);
    } catch (error) {
      alert("加载详情失败: " + error.message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function toggleSource(sourceKey) {
    const next = selectedSources.includes(sourceKey)
      ? selectedSources.filter((key) => key !== sourceKey)
      : [...selectedSources, sourceKey];
    setSelectedSources(next);
    await saveSelectedSources(next);
  }

  async function handleClearHistory() {
    await clearHistory();
    setHistory([]);
    setHistoryVisible(false);
  }

  function handleSelectLine(index) {
    setCurrentLineIndex(index);
    setCurrentEpisodeIndex(0);
  }

  function handleBack() {
    setCurrentDetail(null);
  }

  async function handleSelectAllSources() {
    const allKeys = [...SOURCE_ENTRIES.map(([key]) => key), ...customSources.map((cs) => cs.key)];
    setSelectedSources(allKeys);
    await saveSelectedSources(allKeys);
  }

  async function handleResetDefaultSources() {
    const defaultKeys = SOURCE_ENTRIES.map(([key]) => key);
    setSelectedSources(defaultKeys);
    await saveSelectedSources(defaultKeys);
  }

  async function handleSaveCustomSource(source, editingKey) {
    // check duplicate api across built-in and custom sources
    const isApiDuplicate = [...SOURCE_ENTRIES, ...customSources].some(
      ([k, s]) => (!editingKey || k !== editingKey) && s.api === source.api
    );
    if (isApiDuplicate) {
      alert("该 API 地址已存在，请勿重复添加");
      return false;
    }

    // 8位随机key
    const key = editingKey || Math.random().toString(36).substring(2, 10);
    const newSource = { ...source, key, isCustom: true };

    let updated;
    if (editingKey) {
      // 编辑
      updated = customSources.map((cs) => cs.key === editingKey ? newSource : cs);
    } else {
      // ???????
      updated = [...customSources, newSource];
    }

    setCustomSources(updated);
    await saveCustomSources(updated);

    // auto-select new custom sources
    if (!editingKey && !selectedSources.includes(key)) {
      const newSelected = [...selectedSources, key];
      setSelectedSources(newSelected);
      await saveSelectedSources(newSelected);
    }
    return true; // ????????
  }

async function handleDeleteCustomSource(key) {
    const updated = customSources.filter((cs) => cs.key !== key);
    setCustomSources(updated);
    await saveCustomSources(updated);
    if (selectedSources.includes(key)) {
      const newSelected = selectedSources.filter((k) => k !== key);
      setSelectedSources(newSelected);
      await saveSelectedSources(newSelected);
    }
  }

  function handleOpenHistory(historyItem) {
    setHistoryVisible(false);
    openResult(historyItem);
  }

  // screen routing: keep screens mounted to preserve scroll position across player transitions
  return (
    <>
      {categoriesOpen && (
        <View style={currentDetail ? styles.hidden : styles.visible}>
          <CategoryScreen
            sourceEntries={sourceEntriesWithCustom}
            onOpenResult={openResult}
            onBack={() => setCategoriesOpen(false)}
            detailLoading={detailLoading}
          />
        </View>
      )}
      {!categoriesOpen && (
        <View style={currentDetail ? styles.hidden : styles.visible}>
          <HomeScreen
            query={query}
            setQuery={setQuery}
            results={results}
            selectedSources={selectedSources}
            sourceEntries={sourceEntriesWithCustom}
            history={history}
            loading={loading}
            detailLoading={detailLoading}
            resultCountLabel={resultCountLabel}
            settingsVisible={settingsVisible}
            historyVisible={historyVisible}
            onSearch={handleSearch}
            onOpenResult={openResult}
            onToggleSource={toggleSource}
            onSelectAllSources={handleSelectAllSources}
            onResetDefaultSources={handleResetDefaultSources}
            onSaveCustomSource={handleSaveCustomSource}
            onDeleteCustomSource={handleDeleteCustomSource}
            onClearHistory={handleClearHistory}
            onOpenHistory={handleOpenHistory}
            setSettingsVisible={setSettingsVisible}
            setHistoryVisible={setHistoryVisible}
            onOpenCategories={() => setCategoriesOpen(true)}
          />
        </View>
      )}
      {currentDetail && (
        <View style={styles.visible}>
          <PlayerScreen
            currentDetail={{ ...currentDetail, currentLineIndex }}
            currentEpisodeIndex={currentEpisodeIndex}
            playbackRate={playbackRate}
            onBack={handleBack}
            onSelectEpisode={setCurrentEpisodeIndex}
            onSelectLine={handleSelectLine}
            onSetPlaybackRate={setPlaybackRate}
            onFullscreenUpdate={() => {}}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  hidden: { display: "none" },
  visible: { flex: 1 },
});
