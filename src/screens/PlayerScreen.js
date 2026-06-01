import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";

import {
  EPISODE_GRID_GAP,
  EPISODE_MIN_WIDTH,
  PLAYER_HORIZONTAL_PADDING
} from "../constants/player";
import { useHistory } from "../context/HistoryContext";
import { usePlayer } from "../context/PlayerContext";
import { styles as playerStyles } from "../styles/player";
import { styles as sharedStyles } from "../styles/shared";
import { HlsVideo } from "../components/HlsVideo";
import { PlayerView } from "../components/PlayerView";
import { cacheDirectory, writeAsStringAsync, deleteAsync } from "expo-file-system";
import { filterM3u8ByUrl } from "../utils/m3u8Filter";
import { getDetectorForSource } from "../utils/m3u8Strategies";
import { PROXY_BASE } from "../constants/app";
import { useSources } from "../context/SourceContext";

// iOS 视频缓存路径转换（需 expo-video-cache 服务）
// 失败时会向外抛出异常，由调用方的 try/catch 回退到原始网络 URL
let _convertUrl = null;
async function getConvertedUrl(filePath) {
  if (_convertUrl === null) {
    const mod = await import("expo-video-cache");
    _convertUrl = mod.convertUrl;
  }
  return _convertUrl("file://" + filePath);
}

const styles = { ...sharedStyles, ...playerStyles };
const PROGRESS_SAVE_INTERVAL = 3000;
const PROGRESS_SAVE_THRESHOLD = 10;

// m3u8 过滤结果内存缓存（按 URL 缓存，30 分钟 TTL）
const M3U8_FILTER_CACHE_TTL = 30 * 60 * 1000;
const m3u8FilterCache = new Map();
function getM3u8CacheKey(url) {
  // 取到最后一个 / 之前的部分作为缓存 key，相同路径的剧集复用
  const idx = url.lastIndexOf('/');
  return idx > 0 ? url.substring(0, idx) : url;
}
function getCachedFilter(url) {
  const key = getM3u8CacheKey(url);
  const entry = m3u8FilterCache.get(key);
  if (entry && Date.now() - entry.timestamp < M3U8_FILTER_CACHE_TTL) {
    return entry.result;
  }
  m3u8FilterCache.delete(key);
  return null;
}
function setCachedFilter(url, result) {
  const key = getM3u8CacheKey(url);
  m3u8FilterCache.set(key, { result, timestamp: Date.now() });
  // 控制缓存大小，超过 10 条删除最旧的
  if (m3u8FilterCache.size > 10) {
    const oldest = m3u8FilterCache.keys().next().value;
    m3u8FilterCache.delete(oldest);
  }
}

function getPlayerUrl(url) {
  if (!url) return null;
  if (Platform.OS === "web" && url.includes(".m3u8")) {
    return `${PROXY_BASE}/m3u8?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function showToast(msg, type) {
  Toast.show({ type: type || "error", text1: msg, position: "bottom", visibilityTime: 3000 });
}

export function PlayerScreen() {
  const navigation = useNavigation();
  const {
    currentDetail,
    currentEpisodeIndex,
    currentLineIndex,
    savedPlaybackTime,
    closePlayer,
    setCurrentEpisodeIndex,
    selectLine
  } = usePlayer();
  const { sourceMap } = useSources();
  const { updateProgress } = useHistory();

  const { width: windowWidth } = useWindowDimensions();
  const [hlsError, setHlsError] = useState(false);
  const [hlsRetryKey, setHlsRetryKey] = useState(0);
  const hlsTimeRef = useRef(0);

  // 移动端：等待 m3u8 过滤完成后再初始化播放器
  const [filtering, setFiltering] = useState(true);
  const [filteredUri, setFilteredUri] = useState(null);
  const [mobileRetryKey, setMobileRetryKey] = useState(0);
  const [mobileError, setMobileError] = useState(false);
  const [pageFullscreen, setPageFullscreen] = useState(false);
  const mobileFileRef = useRef(null); // 缓存文件路径 (string)
  const mobileTimeRef = useRef(0); // PlayerView 定期同步 currentTime 到此 ref
  const lastSavedTimeRef = useRef(0); // 上次保存的播放时间，用于脏检查
  // Compute episode/line info (safe when currentDetail is null)
  const currentLine = currentDetail?.lines?.[currentLineIndex];
  const episodes = currentLine?.episodes || currentDetail?.episodes || [];
  const currentEpisode = episodes[currentEpisodeIndex];
  const lines = currentDetail?.lines || [];
  const isHlsOnWeb = Platform.OS === "web" && currentEpisode?.url?.includes(".m3u8");
  const isMobileM3u8 = Platform.OS !== "web" && currentEpisode?.url?.includes(".m3u8");

  // 移动端：下载 m3u8 → 过滤广告 → 写入缓存 → 设置 filteredUri
  // 带内存缓存，相同路径的剧集切换时跳过过滤
  useEffect(() => {
    // 清理上一集的缓存文件
    if (mobileFileRef.current) {
      try { deleteAsync(mobileFileRef.current); } catch {}
      mobileFileRef.current = null;
    }

    const url = currentEpisode?.url;
    if (!url || !url.includes(".m3u8") || Platform.OS === "web") {
      setFilteredUri(url || null);
      setFiltering(false);
      return;
    }

    // 检查内存缓存
    const cached = getCachedFilter(url);
    if (cached) {
      const uid = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const filePath = `${cacheDirectory}hls_filtered_${uid}.m3u8`;
      (async () => {
        try {
          await writeAsStringAsync(filePath, cached);
          mobileFileRef.current = filePath;
          setFilteredUri(Platform.OS === "ios" ? await getConvertedUrl(filePath) : filePath);
          setFiltering(false);
        } catch {
          // 写入失败回退原始 URL
          setFilteredUri(url);
          setFiltering(false);
        }
      })();
      return;
    }

    // 移动端 m3u8：开始过滤
    let cancelled = false;
    setFiltering(true);
    setFilteredUri(null);
    setMobileError(false);

    (async () => {
      try {
        if (!cacheDirectory) {
          throw new Error("cacheDirectory is null");
        }

        const detector = currentDetail?.sourceKey
          ? getDetectorForSource(sourceMap?.[currentDetail.sourceKey]?.adStrategy)
          : null;
        const { text: cleanText } = await filterM3u8ByUrl(url, detector);

        if (cancelled) return;

        if (!cleanText) {
          showToast("过滤后 m3u8 为空，已回退原始 URL", "info");
          setFilteredUri(url);
          setFiltering(false);
          return;
        }

        // 写入内存缓存
        setCachedFilter(url, cleanText);

        const uid = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        const filePath = `${cacheDirectory}hls_filtered_${uid}.m3u8`;
        await writeAsStringAsync(filePath, cleanText);

        if (cancelled) {
          try { deleteAsync(filePath); } catch {}
          return;
        }

        mobileFileRef.current = filePath;
        setFilteredUri(Platform.OS === "ios" ? await getConvertedUrl(filePath) : filePath);
        setFiltering(false);
      } catch (e) {
        if (cancelled) return;
        showToast("m3u8 过滤失败: " + e.message, "error");
        setFilteredUri(url);
        setFiltering(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentEpisode?.url, mobileRetryKey]);


  // 定期保存播放进度（带脏检查：时间变化超过阈值才写入）
  useEffect(() => {
    if (!currentEpisode?.url || !currentDetail?.id || !currentDetail?.sourceKey) return;

    const interval = setInterval(() => {
      const time = isHlsOnWeb ? hlsTimeRef.current : mobileTimeRef.current;
      if (time > 0 && Math.abs(time - lastSavedTimeRef.current) >= PROGRESS_SAVE_THRESHOLD) {
        lastSavedTimeRef.current = time;
        updateProgress(currentDetail.id, currentDetail.sourceKey, {
          currentTime: time,
          episodeIndex: currentEpisodeIndex,
          lineIndex: currentLineIndex,
          episodeUrl: currentEpisode?.url || "",
          episodeTitle: currentEpisode?.title || ""
        });
      }
    }, PROGRESS_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [
    currentEpisode?.url,
    currentEpisodeIndex,
    currentLineIndex,
    currentDetail?.id,
    currentDetail?.sourceKey,
    updateProgress,
    isHlsOnWeb
  ]);

  function handleRetry() {
    if (isHlsOnWeb) {
      setHlsError(false);
      setHlsRetryKey((k) => k + 1);
    } else {
      setMobileError(false);
      setMobileRetryKey((k) => k + 1);
    }
  }

  function handleBack() {
    // 离开前保存最终播放位置
    if (currentDetail?.id && currentDetail?.sourceKey && currentEpisode?.url) {
      const time = isHlsOnWeb ? hlsTimeRef.current : mobileTimeRef.current;
      if (time > 0) {
        updateProgress(currentDetail.id, currentDetail.sourceKey, {
          currentTime: time,
          episodeIndex: currentEpisodeIndex,
          lineIndex: currentLineIndex,
          episodeUrl: currentEpisode?.url || "",
          episodeTitle: currentEpisode?.title || ""
        });
      }
    }
    // 清理移动端过滤缓存
    if (mobileFileRef.current) {
      try { deleteAsync(mobileFileRef.current); } catch {}
      mobileFileRef.current = null;
    }
    closePlayer();
    navigation.goBack();
  }

  if (!currentDetail) {
    return null;
  }

  const episodeButtonWidth = useMemo(() => {
    const availableWidth = Math.max(
      0,
      windowWidth - PLAYER_HORIZONTAL_PADDING * 2
    );
    const columns = Math.max(
      2,
      Math.floor((availableWidth + EPISODE_GRID_GAP) / (EPISODE_MIN_WIDTH + EPISODE_GRID_GAP))
    );
    return Math.floor(
      (availableWidth - EPISODE_GRID_GAP * (columns - 1)) / columns
    );
  }, [windowWidth]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" backgroundColor="#050505" translucent={false} />
      <View style={styles.videoWrapper}>
        {isHlsOnWeb ? (
          <HlsVideo
            key={hlsRetryKey}
            uri={getPlayerUrl(currentEpisode?.url)}
            style={styles.video}
            contentFit="contain"
            onError={setHlsError}
            onTimeUpdate={(t) => { hlsTimeRef.current = t; }}
            onFirstFrameRender={() => {}}
            onBack={handleBack}
            initialTime={savedPlaybackTime.current}
          />
        ) : filtering ? (
          <View style={styles.video}>
            <View style={styles.playerOverlay}>
              <ActivityIndicator color="#38bdf8" size="large" />
              <Text style={[styles.playerOverlayText, { marginTop: 12 }]}>
                加载播放地址...
              </Text>
            </View>
          </View>
        ) : (
          <PlayerView
            key={`mobile-${mobileRetryKey}-${currentEpisode?.url || index}`}
            uri={filteredUri}
            style={styles.video}
            title={currentDetail?.title}
            onBack={handleBack}
            initialTime={savedPlaybackTime.current}
            onTimeUpdate={(t) => { mobileTimeRef.current = t; }}
            onError={setMobileError}
            onFullscreenChange={setPageFullscreen}
          />
        )}

        {(isHlsOnWeb ? hlsError : mobileError) && (
          <View style={styles.playerOverlay}>
            <Text style={[styles.playerOverlayText, { fontSize: 16 }]}>播放失败</Text>
            <Pressable style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>重新加载</Text>
            </Pressable>
          </View>
        )}
      </View>

      {!pageFullscreen && (
        <ScrollView style={styles.playerContent}>
        <Text style={styles.nowPlaying} numberOfLines={2}>
          {currentEpisode?.title || ("第 " + (currentEpisodeIndex + 1) + " 集")}
        </Text>
        <Text style={styles.resultMeta}>
          {currentDetail.sourceName} {"· 共"} {episodes.length} {"集"}
        </Text>

        {lines.length > 1 && (
          <View style={styles.lineRow}>
            {lines.map((line, index) => (
              <Pressable
                key={line.name + "-" + index}
                style={[
                  styles.lineButton,
                  index === currentLineIndex && styles.lineButtonActive
                ]}
                onPress={() => selectLine(index)}
              >
                <Text
                  style={[
                    styles.lineButtonText,
                    index === currentLineIndex && styles.lineButtonTextActive
                  ]}
                  numberOfLines={1}
                >
                  {line.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.episodeGrid}>
          {episodes.map((episode, index) => (
            <Pressable
              key={episode.url + "-" + index}
              style={[
                styles.episodeButton,
                { width: episodeButtonWidth },
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
            <Text style={styles.sectionTitle}>{"简介"}</Text>
            <Text style={styles.description}>{currentDetail.desc}</Text>
          </View>
        )}
      </ScrollView>)}
    </SafeAreaView>
  );
}


