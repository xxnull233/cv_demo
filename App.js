import { StatusBar } from "expo-status-bar";
import { Video, ResizeMode } from "expo-av";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { API_SITES } from "./src/api/sites";
import { loadDetail, searchManySources } from "./src/api/client";
import {
  clearHistory,
  loadHistory,
  loadSelectedSources,
  saveHistoryItem,
  saveSelectedSources
} from "./src/storage";

const SOURCE_ENTRIES = Object.entries(API_SITES);

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentDetail, setCurrentDetail] = useState(null);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      setSelectedSources(await loadSelectedSources());
      setHistory(await loadHistory());
    }
    bootstrap();
  }, []);

  const currentEpisode = currentDetail?.episodes?.[currentEpisodeIndex];

  const resultCountLabel = useMemo(() => {
    if (loading) return "搜索中";
    if (!results.length) return "暂无结果";
    return `${results.length} 个结果`;
  }, [loading, results.length]);

  async function handleSearch() {
    const text = query.trim();
    if (!text) {
      Alert.alert("请输入关键词");
      return;
    }
    if (selectedSources.length === 0) {
      Alert.alert("请选择至少一个数据源");
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setCurrentDetail(null);
    try {
      const found = await searchManySources(selectedSources, text);
      setResults(found);
      if (found.length === 0) {
        Alert.alert("没有搜索到内容", "可以换个关键词或打开更多数据源。");
      }
    } catch (error) {
      Alert.alert("搜索失败", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function openResult(result) {
    setDetailLoading(true);
    try {
      const detail = await loadDetail(result);
      if (!detail.episodes.length) {
        Alert.alert("没有可播放剧集", "该资源没有返回可用的 HLS 地址。");
        return;
      }
      setCurrentEpisodeIndex(0);
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
      Alert.alert("加载详情失败", error.message);
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

  function renderResult({ item }) {
    return (
      <Pressable style={styles.resultCard} onPress={() => openResult(item)}>
        {item.poster ? (
          <Image source={{ uri: item.poster }} style={styles.poster} />
        ) : (
          <View style={[styles.poster, styles.posterFallback]}>
            <Text style={styles.posterFallbackText}>LibreTV</Text>
          </View>
        )}
        <View style={styles.resultBody}>
          <Text style={styles.resultTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.resultMeta} numberOfLines={1}>
            {item.sourceName} {item.remarks ? ` · ${item.remarks}` : ""}
          </Text>
          <Text style={styles.resultType} numberOfLines={1}>
            {item.type || "视频资源"}
          </Text>
        </View>
      </Pressable>
    );
  }

  if (currentDetail) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.playerHeader}>
          <Pressable style={styles.ghostButton} onPress={() => setCurrentDetail(null)}>
            <Text style={styles.ghostButtonText}>返回</Text>
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {currentDetail.title}
          </Text>
        </View>

        <Video
          key={currentEpisode?.url}
          source={{ uri: currentEpisode?.url }}
          style={styles.video}
          useNativeControls
          shouldPlay
          resizeMode={ResizeMode.CONTAIN}
        />

        <ScrollView style={styles.playerContent}>
          <Text style={styles.nowPlaying} numberOfLines={2}>
            {currentEpisode?.title || `第 ${currentEpisodeIndex + 1} 集`}
          </Text>
          <Text style={styles.resultMeta}>
            {currentDetail.sourceName} · 共 {currentDetail.episodes.length} 集
          </Text>

          <View style={styles.episodeGrid}>
            {currentDetail.episodes.map((episode, index) => (
              <Pressable
                key={`${episode.url}-${index}`}
                style={[
                  styles.episodeButton,
                  index === currentEpisodeIndex && styles.episodeButtonActive
                ]}
                onPress={() => setCurrentEpisodeIndex(index)}
              >
                <Text
                  style={[
                    styles.episodeButtonText,
                    index === currentEpisodeIndex && styles.episodeButtonTextActive
                  ]}
                  numberOfLines={1}
                >
                  {episode.title || index + 1}
                </Text>
              </Pressable>
            ))}
          </View>

          {!!currentDetail.desc && (
            <View style={styles.detailBlock}>
              <Text style={styles.sectionTitle}>简介</Text>
              <Text style={styles.description}>{currentDetail.desc}</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>LibreTV</Text>
          <Text style={styles.subtitle}>移动端 MVP · 直连数据源</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconButton} onPress={() => setHistoryVisible(true)}>
            <Text style={styles.iconButtonText}>历史</Text>
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => setSettingsVisible(true)}>
            <Text style={styles.iconButtonText}>设置</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.searchPanel}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="搜索电影、剧集、动漫"
          placeholderTextColor="#737373"
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <Pressable style={styles.searchButton} onPress={handleSearch} disabled={loading}>
          <Text style={styles.searchButtonText}>{loading ? "..." : "搜索"}</Text>
        </Pressable>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusText}>{resultCountLabel}</Text>
        <Text style={styles.statusText}>已选 {selectedSources.length} 个源</Text>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#38bdf8" size="large" />
          <Text style={styles.centerText}>正在直连资源站...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item) => `${item.sourceKey}-${item.id}`}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Text style={styles.centerTitle}>开始搜索</Text>
              <Text style={styles.centerText}>
                MVP 已移除后端代理，请求会从 iOS/Android App 直接发往采集 API。
              </Text>
            </View>
          }
        />
      )}

      {detailLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#38bdf8" size="large" />
          <Text style={styles.overlayText}>加载详情...</Text>
        </View>
      )}

      <SettingsModal
        visible={settingsVisible}
        selectedSources={selectedSources}
        onClose={() => setSettingsVisible(false)}
        onToggle={toggleSource}
      />
      <HistoryModal
        visible={historyVisible}
        history={history}
        onClose={() => setHistoryVisible(false)}
        onClear={handleClearHistory}
        onOpen={(item) => {
          setHistoryVisible(false);
          openResult({
            id: item.id,
            title: item.title,
            poster: item.poster,
            sourceKey: item.sourceKey,
            sourceName: item.sourceName
          });
        }}
      />
    </SafeAreaView>
  );
}

function SettingsModal({ visible, selectedSources, onClose, onToggle }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>数据源设置</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeText}>完成</Text>
            </Pressable>
          </View>
          <ScrollView>
            {SOURCE_ENTRIES.map(([key, site]) => {
              const active = selectedSources.includes(key);
              return (
                <Pressable
                  key={key}
                  style={[styles.sourceRow, active && styles.sourceRowActive]}
                  onPress={() => onToggle(key)}
                >
                  <View>
                    <Text style={styles.sourceName}>{site.name}</Text>
                    <Text style={styles.sourceUrl} numberOfLines={1}>
                      {site.api}
                    </Text>
                  </View>
                  <Text style={[styles.sourceCheck, active && styles.sourceCheckActive]}>
                    {active ? "开启" : "关闭"}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function HistoryModal({ visible, history, onClose, onClear, onOpen }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>观看历史</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeText}>关闭</Text>
            </Pressable>
          </View>
          {history.length === 0 ? (
            <View style={styles.centerState}>
              <Text style={styles.centerText}>暂无历史记录</Text>
            </View>
          ) : (
            <ScrollView>
              {history.map((item) => (
                <Pressable
                  key={`${item.sourceKey}-${item.id}`}
                  style={styles.historyRow}
                  onPress={() => onOpen(item)}
                >
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.resultMeta}>
                    {item.sourceName} · {item.episodeCount || 0} 集
                  </Text>
                </Pressable>
              ))}
              <Pressable style={styles.clearButton} onPress={onClear}>
                <Text style={styles.clearButtonText}>清空历史</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505"
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  brand: {
    color: "#f8fafc",
    fontSize: 32,
    fontWeight: "800"
  },
  subtitle: {
    color: "#8a8a8a",
    marginTop: 4,
    fontSize: 13
  },
  headerActions: {
    flexDirection: "row",
    gap: 8
  },
  iconButton: {
    borderColor: "#2a2a2a",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#121212"
  },
  iconButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "600"
  },
  searchPanel: {
    marginHorizontal: 18,
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#111"
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    minHeight: 50,
    paddingHorizontal: 14,
    fontSize: 16
  },
  searchButton: {
    width: 76,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center"
  },
  searchButtonText: {
    color: "#050505",
    fontWeight: "800"
  },
  statusRow: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  statusText: {
    color: "#8a8a8a",
    fontSize: 13
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 28
  },
  resultCard: {
    minHeight: 124,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#242424",
    backgroundColor: "#111",
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 12
  },
  poster: {
    width: 86,
    minHeight: 124,
    backgroundColor: "#181818"
  },
  posterFallback: {
    alignItems: "center",
    justifyContent: "center"
  },
  posterFallbackText: {
    color: "#5f5f5f",
    fontSize: 12
  },
  resultBody: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between"
  },
  resultTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700"
  },
  resultMeta: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 6
  },
  resultType: {
    color: "#38bdf8",
    fontSize: 13,
    marginTop: 8
  },
  centerState: {
    flex: 1,
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32
  },
  centerTitle: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8
  },
  centerText: {
    color: "#8a8a8a",
    lineHeight: 20,
    textAlign: "center",
    marginTop: 10
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center"
  },
  overlayText: {
    color: "#f8fafc",
    marginTop: 12
  },
  playerHeader: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1f1f1f"
  },
  ghostButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a"
  },
  ghostButtonText: {
    color: "#f8fafc",
    fontWeight: "700"
  },
  headerTitle: {
    flex: 1,
    color: "#f8fafc",
    fontWeight: "800",
    fontSize: 16,
    marginLeft: 12
  },
  video: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000"
  },
  playerContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  nowPlaying: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "800"
  },
  episodeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18
  },
  episodeButton: {
    width: 76,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#111"
  },
  episodeButtonActive: {
    backgroundColor: "#f8fafc",
    borderColor: "#f8fafc"
  },
  episodeButtonText: {
    color: "#d4d4d4",
    textAlign: "center",
    fontWeight: "700"
  },
  episodeButtonTextActive: {
    color: "#050505"
  },
  detailBlock: {
    marginTop: 22,
    marginBottom: 36
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8
  },
  description: {
    color: "#b5b5b5",
    lineHeight: 22
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end"
  },
  modalSheet: {
    maxHeight: "78%",
    minHeight: "48%",
    backgroundColor: "#0b0b0b",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 1,
    borderColor: "#242424",
    padding: 16
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  modalTitle: {
    color: "#f8fafc",
    fontWeight: "800",
    fontSize: 20
  },
  closeText: {
    color: "#38bdf8",
    fontWeight: "800"
  },
  sourceRow: {
    borderWidth: 1,
    borderColor: "#242424",
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  sourceRowActive: {
    borderColor: "#38bdf8"
  },
  sourceName: {
    color: "#f8fafc",
    fontWeight: "800",
    marginBottom: 4
  },
  sourceUrl: {
    color: "#777",
    maxWidth: 250
  },
  sourceCheck: {
    color: "#737373",
    fontWeight: "800"
  },
  sourceCheckActive: {
    color: "#38bdf8"
  },
  historyRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#202020",
    paddingVertical: 14
  },
  clearButton: {
    marginTop: 18,
    marginBottom: 28,
    borderRadius: 8,
    paddingVertical: 13,
    backgroundColor: "#2a1212",
    borderWidth: 1,
    borderColor: "#5a2020"
  },
  clearButtonText: {
    color: "#fecaca",
    textAlign: "center",
    fontWeight: "800"
  }
});
