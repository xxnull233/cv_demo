import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View
} from "react-native";

import { styles as homeStyles } from "../styles/home";
import { styles as sharedStyles } from "../styles/shared";

const styles = { ...sharedStyles, ...homeStyles };

import { HistoryModal } from "../components/HistoryModal";
import { ResultCard } from "../components/ResultCard";
import { SettingsModal } from "../components/SettingsModal";

export function HomeScreen({
  query,
  setQuery,
  results,
  selectedSources,
  sourceEntries,
  history,
  loading,
  detailLoading,
  resultCountLabel,
  settingsVisible,
  historyVisible,
  onSearch,
  onOpenResult,
  onToggleSource,
  onSelectAllSources,
  onResetDefaultSources,
  onSaveCustomSource,
  onDeleteCustomSource,
  onClearHistory,
  onOpenHistory,
  setSettingsVisible,
  setHistoryVisible,
  onOpenCategories
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" backgroundColor="#050505" translucent={false} />
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>CV</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconButton} onPress={onOpenCategories}>
            <Text style={styles.iconButtonText}>分类</Text>
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
          onSubmitEditing={onSearch}
        />
        <Pressable style={styles.searchButton} onPress={onSearch} disabled={loading}>
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
            <ResultCard item={item} onOpen={onOpenResult} />
          )}
          keyExtractor={(item) => `${item.sourceKey}-${item.id}`}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Text style={styles.centerTitle}>输入关键字开始搜索</Text>
              <Text style={styles.centerText}>
                
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
        sourceEntries={sourceEntries}
        onClose={() => setSettingsVisible(false)}
        onToggle={onToggleSource}
        onSelectAll={onSelectAllSources}
        onResetDefault={onResetDefaultSources}
        onSaveCustomSource={onSaveCustomSource}
        onDeleteCustomSource={onDeleteCustomSource}
      />
      <HistoryModal
        visible={historyVisible}
        history={history}
        onClose={() => setHistoryVisible(false)}
        onClear={onClearHistory}
        onOpen={onOpenHistory}
      />
    </SafeAreaView>
  );
}
