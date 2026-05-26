import { useNavigation } from "@react-navigation/native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View
} from "react-native";

import { HistoryModal } from "../components/HistoryModal";
import { ResultCard } from "../components/ResultCard";
import { SettingsModal } from "../components/SettingsModal";
import { APP_NAME } from "../constants/app";
import { useFavorites } from "../context/FavoritesContext";
import { useHistory } from "../context/HistoryContext";
import { useSearch } from "../context/SearchContext";
import { useSources } from "../context/SourceContext";
import { useOpenResult } from "../hooks/useOpenResult";
import { styles as homeStyles } from "../styles/home";
import { styles as sharedStyles } from "../styles/shared";

const styles = { ...sharedStyles, ...homeStyles };

export function HomeScreen() {
  const navigation = useNavigation();
  const { query, setQuery, results, loading, resultCountLabel, handleSearch } = useSearch();
  const {
    selectedSources,
    sourceEntries,
    toggleSource,
    selectAllSources,
    resetDefaultSources,
    saveCustomSource,
    deleteCustomSource
  } = useSources();
  const { history, clearAllHistory } = useHistory();
  const { favorites, checkIsFavorited, handleFavoritePress } = useFavorites();
  const { openResult, detailLoading } = useOpenResult();

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);

  async function handleOpenHistory(historyItem) {
    setHistoryVisible(false);
    await openResult(historyItem);
  }

  async function handleClearHistory() {
    await clearAllHistory();
    setHistoryVisible(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" backgroundColor="#050505" translucent={false} />
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>{APP_NAME}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconButton} onPress={() => navigation.navigate("Categories")}>
            <Text style={styles.iconButtonText}>分类</Text>
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => navigation.navigate("Favorites")}>
            <Text style={styles.iconButtonText}>收藏</Text>
          </Pressable>
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
          <Text style={styles.centerText}>正在搜索...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={({ item }) => (
            <ResultCard
              item={item}
              onOpen={openResult}
              onFavorite={handleFavoritePress}
              isFavorited={checkIsFavorited(item)}
            />
          )}
          keyExtractor={(item) => `${item.sourceKey}-${item.id}`}
          extraData={favorites}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Text style={styles.centerTitle}>输入关键字开始搜索</Text>
              <Text style={styles.centerText} />
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
        sourceEntries={sourceEntries}
        onClose={() => setSettingsVisible(false)}
        onToggle={toggleSource}
        onSelectAll={selectAllSources}
        onResetDefault={resetDefaultSources}
        onSaveCustomSource={saveCustomSource}
        onDeleteCustomSource={deleteCustomSource}
      />
      <HistoryModal
        visible={historyVisible}
        history={history}
        onClose={() => setHistoryVisible(false)}
        onClear={handleClearHistory}
        onOpen={handleOpenHistory}
      />
    </SafeAreaView>
  );
}
