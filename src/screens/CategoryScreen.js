import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

import { styles } from "../styles/categories";
import { ResultCard } from "../components/ResultCard";
import { fetchCategories, fetchCategoryVideos } from "../api/categories";
import { useFavorites } from "../context/FavoritesContext";
import { useSources } from "../context/SourceContext";
import { useOpenResult } from "../hooks/useOpenResult";

const CATEGORY_BAR_HEIGHT = 36;

export function CategoryScreen() {
  const navigation = useNavigation();
  const { sourceEntries } = useSources();
  const { favorites, checkIsFavorited, handleFavoritePress } = useFavorites();
  const { openResult, detailLoading } = useOpenResult();
  const [siteKey, setSiteKey] = useState("");
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [videos, setVideos] = useState([]);
  const [loadingCat, setLoadingCat] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadCatError, setLoadCatError] = useState("");
  const flatListRef = useRef(null);
  const loadIdRef = useRef(0);
  const sourceEntriesRef = useRef(sourceEntries);

  // 保持 ref 与 props 同步
  sourceEntriesRef.current = sourceEntries;

  // 默认选中第一个启用的源
  useEffect(() => {
    if (sourceEntries.length > 0 && !siteKey) {
      setSiteKey(sourceEntries[0][0]);
    }
  }, [sourceEntries, siteKey]);

  // 切换资源站 -> 重新加载分类
  useEffect(() => {
    if (!siteKey) return;
    const entry = sourceEntriesRef.current.find(function(e) { return e[0] === siteKey; });
    if (entry) loadCategories(entry[1]);
  }, [siteKey]);

  async function loadCategories(site) {
    const currentLoadId = ++loadIdRef.current;
    setLoadingCat(true);
    setLoadingVideos(true);
    setLoadCatError("");
    setActiveCategoryId("");
    setVideos([]);
    setPage(1);
    setHasMore(true);
    try {
      const entry = sourceEntriesRef.current.find(function(e) { return e[0] === siteKey; });
      if (!entry) { setCategories([]); setLoadingVideos(false); return; }
      const cats = await fetchCategories(site);
      if (currentLoadId !== loadIdRef.current) return;
      const excludeIds = (site.excludeClass || "").split(",").filter(Boolean);
      const filtered = excludeIds.length > 0
        ? cats.filter(function(cat) { return excludeIds.indexOf(cat.id) < 0; })
        : cats;
      setCategories(filtered);
      if (filtered.length > 0) {
        setActiveCategoryId(filtered[0].id);
        loadVideos(1, true, filtered[0].id, currentLoadId);
      } else {
        setLoadingVideos(false);
      }
    } catch (e) {
      if (currentLoadId !== loadIdRef.current) return;
      setCategories([]);
      setLoadingVideos(false);
      setLoadCatError(e.message || "请求失败");
    } finally {
      if (currentLoadId === loadIdRef.current) {
        setLoadingCat(false);
      }
    }
  }

  async function loadVideos(targetPage, replace, catId, loadId) {
    const currentLoadId = loadId || ++loadIdRef.current;
    const categoryId = catId || activeCategoryId;
    const entry = sourceEntriesRef.current.find(function(e) { return e[0] === siteKey; });
    if (!entry) return;
    const site = entry[1];
    if (replace) {
      setLoadingVideos(true);
    }
    try {
      const result = await fetchCategoryVideos(site, categoryId, siteKey, targetPage);
      if (currentLoadId !== loadIdRef.current) return;
      if (replace) {
        setVideos(result.items);
      } else {
        setVideos(function(prev) { return prev.concat(result.items); });
      }
      setPage(targetPage);
      setHasMore(targetPage < result.pageCount);
    } catch (e) {
      if (currentLoadId !== loadIdRef.current) return;
    } finally {
      if (currentLoadId === loadIdRef.current) {
        setLoadingVideos(false);
        if (replace) setRefreshing(false);
      }
    }
  }

  function handleCategoryPress(catId) {
    if (catId === activeCategoryId || loadingVideos) return;
    setActiveCategoryId(catId);
    setVideos([]);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    loadVideos(1, true, catId);
  }

  function handleLoadMore() {
    if (loadingVideos || !hasMore) return;
    loadVideos(page + 1, false);
  }

  function handleRefresh() {
    setRefreshing(true);
    loadVideos(1, true);
  }

  function renderCategoryTab(cat) {
    const isActive = cat.id === activeCategoryId;
    return (
      <Pressable key={cat.id} style={[{
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8,
        backgroundColor: isActive ? "#f8fafc" : "#1a1a1a"
      }]} onPress={function() { handleCategoryPress(cat.id); }}>
        <Text style={{ color: isActive ? "#050505" : "#a0a0a0", fontSize: 14, fontWeight: isActive ? "700" : "500" }}>
          {cat.name}
        </Text>
      </Pressable>
    );
  }

  return (
    <>
    {sourceEntries && sourceEntries.length === 0 ? (
      <SafeAreaView style={styles.safeArea}>
        <ExpoStatusBar style="light" backgroundColor="#050505" translucent={false} />
        <View style={styles.header}>
          <Pressable style={styles.ghostButton} onPress={() => navigation.goBack()}>
            <Text style={styles.ghostButtonText}>返回</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>暂无数据源</Text>
          <Text style={styles.centerText}>请先在首页设置中导入数据源</Text>
        </View>
      </SafeAreaView>
    ) : (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" backgroundColor="#050505" translucent={false} />
      <View style={styles.header}>
        <Pressable style={styles.ghostButton} onPress={() => navigation.goBack()}>
          <Text style={styles.ghostButtonText}>返回</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: 360, flexGrow: 1 }}>
          {sourceEntries.map(function(entry) {
            const key = entry[0];
            const isActive = key === siteKey;
            return (
              <Pressable key={key} style={[{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginLeft: 6,
                backgroundColor: isActive ? "#f8fafc" : "#1a1a1a"
              }]} onPress={function() { setSiteKey(key); }}>
                <Text style={{ color: isActive ? "#050505" : "#a0a0a0", fontSize: 12, fontWeight: isActive ? "700" : "500" }}>
                  {entry[1].name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ height: CATEGORY_BAR_HEIGHT, justifyContent: "center", marginLeft: 16, marginTop: 4, marginBottom: 2 }}>
        {loadingCat ? (
          <ActivityIndicator color="#38bdf8" size="small" />
        ) : categories.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map(renderCategoryTab)}
          </ScrollView>
        ) : loadCatError ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: "#ef4444", fontSize: 13 }}>{loadCatError}</Text>
            <Pressable style={{ marginLeft: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: "#38bdf8" }} onPress={function() {
              const entry = sourceEntriesRef.current.find(function(e) { return e[0] === siteKey; });
              if (entry) loadCategories(entry[1]);
            }}>
              <Text style={{ color: "#38bdf8", fontSize: 12, fontWeight: "600" }}>重试</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={{ color: "#8a8a8a", fontSize: 13 }}>暂未获取到分类</Text>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={({ item }) => (
          <ResultCard item={item} onOpen={openResult} onFavorite={handleFavoritePress} isFavorited={checkIsFavorited(item)} />
        )}
        keyExtractor={function(item) { return item.sourceKey + "-" + item.id; }}
        extraData={favorites}
        contentContainerStyle={[styles.listContent, { paddingTop: 4 }]}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          loadingVideos ? (
            <View style={styles.centerState}>
              <ActivityIndicator color="#38bdf8" size="large" />
              <Text style={{ color: "#8a8a8a", fontSize: 13, marginTop: 10 }}>加载中...</Text>
            </View>
          ) : (
            <View style={styles.centerState}>
              <Text style={styles.centerTitle}>选择分类浏览</Text>
              <Text style={styles.centerText}>上方为分类标签，点击切换</Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingVideos && videos.length > 0 ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <ActivityIndicator color="#38bdf8" size="small" />
            </View>
          ) : !hasMore && videos.length > 0 ? (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
              <Text style={{ color: "#5f5f5f", fontSize: 12 }}>已全部加载</Text>
            </View>
          ) : null
        }
      />
      {detailLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#38bdf8" size="large" />
          <Text style={styles.overlayText}>加载详情...</Text>
        </View>
      )}
    </SafeAreaView>
    )}
    </>
  );
}

