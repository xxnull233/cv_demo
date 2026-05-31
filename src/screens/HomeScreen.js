import { useNavigation } from "@react-navigation/native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ResultCard } from "../components/ResultCard";
import { APP_NAME } from "../constants/app";
import { useFavorites } from "../context/FavoritesContext";
import { useSearch } from "../context/SearchContext";
import { useSources } from "../context/SourceContext";
import { useOpenResult } from "../hooks/useOpenResult";
import { styles as homeStyles } from "../styles/home";
import { styles as sharedStyles } from "../styles/shared";

const styles = { ...sharedStyles, ...homeStyles };

export function HomeScreen() {
  const navigation = useNavigation();
  const { query, setQuery, results, loading, searchError, searchedOnce, resultCountLabel, handleSearch } = useSearch();
  const { sources } = useSources();
  const { favorites, checkIsFavorited, handleFavoritePress } = useFavorites();
  const { openResult, detailLoading, detailError } = useOpenResult();



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
          <Pressable style={styles.iconButton} onPress={() => navigation.navigate("History")}>
            <Text style={styles.iconButtonText}>历史</Text>
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => navigation.navigate("Settings")}>
            <Text style={styles.iconButtonText}>设置</Text>
          </Pressable>
        </View>
      </View>

      {sources && sources.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>暂无数据源</Text>
          <Text style={styles.centerText}>请点击右上角设置 → 导入数据源</Text>
        </View>
      ) : (
        <>
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
            <Text style={styles.statusText}>已选 {sources.filter(s => s.enabled).length} 个源</Text>
          </View>

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
            keyExtractor={(item) => item.sourceKey + String.fromCharCode(45) + item.id}
            extraData={favorites}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              loading ? (
                <View style={styles.centerState}>
                  <ActivityIndicator color="#38bdf8" size="large" />
                  <Text style={styles.loadingText}>正在搜索...</Text>
                </View>
              ) : searchError ? (
                <View style={styles.centerState}>
                  <Text style={styles.centerTitle}>{searchError}</Text>
                </View>
              ) : !searchedOnce ? (
                <View style={styles.centerState}>
                  <Text style={styles.centerTitle}>输入关键字开始搜索</Text>
                  <Text style={styles.centerText} />
                </View>
              ) : null
            }
            ListFooterComponent={
              loading && results.length > 0 ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator color="#38bdf8" size="small" />
                </View>
              ) : null
            }
          />

          {detailLoading && (
            <View style={styles.overlay}>
              <ActivityIndicator color="#38bdf8" size="large" />
              <Text style={styles.overlayText}>{detailError || "加载详情..."}</Text>
            </View>
          )}
        </>
      )}

    </SafeAreaView>
  );
}

