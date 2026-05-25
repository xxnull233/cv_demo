import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View
} from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

import { styles } from "../styles/categories";
import { ResultCard } from "../components/ResultCard";
import { fetchCategories, fetchCategoryVideos } from "../api/categories";

const CATEGORY_BAR_HEIGHT = 36;

export function CategoryScreen({ sourceEntries, onOpenResult, onBack, detailLoading }) {
  const [siteKey, setSiteKey] = useState("");
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [videos, setVideos] = useState([]);
  const [loadingCat, setLoadingCat] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const flatListRef = useRef(null);

  // 默认选中第一个启用的源
  useEffect(() => {
    if (sourceEntries.length > 0 && !siteKey) {
      setSiteKey(sourceEntries[0][0]);
    }
  }, [sourceEntries, siteKey]);

  // 切换资源站 -> 重新加载分类
  useEffect(() => {
    if (!siteKey) return;
    loadCategories();
  }, [siteKey]);

  async function loadCategories() {
    const entry = sourceEntries.find(([k]) => k === siteKey);
    if (!entry) return;
    const site = entry[1];
    setLoadingCat(true);
    setActiveCategoryId("");
    setVideos([]);
    setPage(1);
    setHasMore(true);
    try {
      const list = await fetchCategories(site);
      setCategories(list);
      // 自动选中第一个分类
      if (list.length > 0) {
        setActiveCategoryId(list[0].id);
      }
    } catch (e) {
      setCategories([]);
    } finally {
      setLoadingCat(false);
    }
  }

  // activeCategoryId 变化 -> 加载视频
  useEffect(() => {
    if (!activeCategoryId || !siteKey) return;
    loadVideos(1, true);
  }, [activeCategoryId, siteKey]);

  async function loadVideos(targetPage, replace) {
    const entry = sourceEntries.find(([k]) => k === siteKey);
    if (!entry) return;
    const site = entry[1];

    if (replace) {
      setLoadingVideos(true);
    }
    try {
      const result = await fetchCategoryVideos(site, activeCategoryId, siteKey, targetPage);
      if (replace) {
        setVideos(result.items);
      } else {
        setVideos((prev) => [...prev, ...result.items]);
      }
      setPage(targetPage);
      setHasMore(targetPage < result.pageCount);
    } catch (e) {
      // 加载失败时保留已有数据
    } finally {
      setLoadingVideos(false);
      setRefreshing(false);
    }
  }

  function handleCategoryPress(catId) {
    if (catId === activeCategoryId) return;
    setActiveCategoryId(catId);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }

  function handleLoadMore() {
    if (loadingVideos || !hasMore) return;
    loadVideos(page + 1, false);
  }

  function handleRefresh() {
    setRefreshing(true);
    loadVideos(1, true);
  }

  const activeSiteName = useCallback(() => {
    const entry = sourceEntries.find(([k]) => k === siteKey);
    return entry ? entry[1].name : "";
  }, [siteKey, sourceEntries]);

  function renderCategoryTab(cat) {
    const isActive = cat.id === activeCategoryId;
    return (
      <Pressable
        key={cat.id}
        style={[
          { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: isActive ? "#f8fafc" : "#1a1a1a" }
        ]}
        onPress={() => handleCategoryPress(cat.id)}
      >
        <Text style={{ color: isActive ? "#050505" : "#a0a0a0", fontSize: 14, fontWeight: isActive ? "700" : "500" }}>
          {cat.name}
        </Text>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" backgroundColor="#050505" translucent={false} />

      {/* 顶部导航 */}
      <View style={styles.header}>
        <Pressable style={styles.ghostButton} onPress={onBack}>
          <Text style={styles.ghostButtonText}>返回</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        {/* 资源站选择器 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: 360, flexGrow: 1 }}>
          {sourceEntries.map(([key]) => {
            const isActive = key === siteKey;
            return (
              <Pressable
                key={key}
                style={[
                  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginLeft: 6, backgroundColor: isActive ? "#f8fafc" : "#1a1a1a" }
                ]}
                onPress={() => setSiteKey(key)}
              >
                <Text style={{ color: isActive ? "#050505" : "#a0a0a0", fontSize: 12, fontWeight: isActive ? "700" : "500" }}>
                  {sourceEntries.find(([k]) => k === key)?.[1].name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 分类标签栏 */}
      <View style={{ height: CATEGORY_BAR_HEIGHT, justifyContent: "center", marginLeft: 16 , marginTop: 4 , marginBottom: 2}}>
        {loadingCat ? (
          <ActivityIndicator color="#38bdf8" size="small" />
        ) : categories.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map(renderCategoryTab)}
          </ScrollView>
        ) : (
          <Text style={{ color: "#8a8a8a", fontSize: 13 }}>暂未获取到分类</Text>
        )}
      </View>

      {/* 视频列表 */}
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={({ item }) => (
          <ResultCard item={item} onOpen={onOpenResult} />
        )}
        keyExtractor={(item) => `${item.sourceKey}-${item.id}`}
        contentContainerStyle={[styles.listContent, { paddingTop: 4 }]}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !loadingVideos ? (
            <View style={styles.centerState}>
              <Text style={styles.centerTitle}>选择分类浏览</Text>
              <Text style={styles.centerText}>上方为分类标签，点击切换</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingVideos ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <ActivityIndicator color="#38bdf8" size="small" />
              <Text style={{ color: "#8a8a8a", fontSize: 12, marginTop: 6 }}>加载中...</Text>
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
  );
}
