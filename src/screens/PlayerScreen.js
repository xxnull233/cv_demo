import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  ToastAndroid,
  useWindowDimensions,
  View
} from "react-native";
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

const styles = { ...sharedStyles, ...playerStyles };
const PROGRESS_SAVE_INTERVAL = 5000;
const PROXY_BASE = "http://localhost:19001";

// 在 Web 端将 m3u8 URL 路由到本地代理进行广告过滤 + 绝对路径展开
function getPlayerUrl(url) {
  if (!url) return null;
  if (Platform.OS === "web" && url.includes(".m3u8")) {
    return `${PROXY_BASE}/m3u8?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function showToast(msg) {
  if (Platform.OS === "android") {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    console.warn(msg);
  }
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
  const mobileFileRef = useRef(null); // 缓存文件路径 (string)
  const mobileTimeRef = useRef(0); // PlayerView 定期同步 currentTime 到此 ref

  // Compute episode/line info (safe when currentDetail is null)
  const currentLine = currentDetail?.lines?.[currentLineIndex];
  const episodes = currentLine?.episodes || currentDetail?.episodes || [];
  const currentEpisode = episodes[currentEpisodeIndex];
  const lines = currentDetail?.lines || [];
  const isHlsOnWeb = Platform.OS === "web" && currentEpisode?.url?.includes(".m3u8");
  const isMobileM3u8 = Platform.OS !== "web" && currentEpisode?.url?.includes(".m3u8");

  // 移动端：下载 m3u8 → 过滤广告 → 写入缓存 → 设置 filteredUri
  // 过滤完成前保持 loading，完成后才渲染 PlayerView
  useEffect(() => {
    // 清理上一集的缓存文件
    if (mobileFileRef.current) {
      try { deleteAsync(mobileFileRef.current); } catch {}
      mobileFileRef.current = null;
    }

    const url = currentEpisode?.url;
    if (!url || !url.includes(".m3u8") || Platform.OS === "web") {
      // 非 m3u8 或 Web 端：无需过滤，直接可用
      setFilteredUri(url || null);
      setFiltering(false);
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

        const { text: cleanText } = await filterM3u8ByUrl(url);

        if (cancelled) return;

        if (!cleanText) {
          showToast("过滤后 m3u8 为空，回退原始 URL");
          setFilteredUri(url);
          setFiltering(false);
          return;
        }

        const uid = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        const filePath = `${cacheDirectory}hls_filtered_${uid}.m3u8`;
        await writeAsStringAsync(filePath, cleanText);

        if (cancelled) {
          try { deleteAsync(filePath); } catch {}
          return;
        }

        mobileFileRef.current = filePath;
        setFilteredUri(filePath);
        setFiltering(false);
      } catch (e) {
        if (cancelled) return;
        showToast("m3u8 过滤失败: " + e.message);
        // 过滤失败则回退原始 URL
        setFilteredUri(url);
        setFiltering(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentEpisode?.url, mobileRetryKey]);

  // 定期保存播放进度
  useEffect(() => {
    if (!currentEpisode?.url || !currentDetail?.id || !currentDetail?.sourceKey) return;

    const interval = setInterval(() => {
      const time = isHlsOnWeb ? hlsTimeRef.current : mobileTimeRef.current;
      if (time > 0) {
        updateProgress(currentDetail.id, currentDetail.sourceKey, {
          currentTime: time,
          episodeIndex: currentEpisodeIndex,
          lineIndex: currentLineIndex,
          episodeUrl: currentEpisode?.url || ""
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
          episodeUrl: currentEpisode?.url || ""
        });
      }
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
      <View style={styles.playerHeader}>
        <Pressable style={styles.ghostButton} onPress={handleBack}>
          <Text style={styles.ghostButtonText}>{"\u8fd4\u56de"}</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentDetail.title}
        </Text>
      </View>

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
            key={`mobile-${mobileRetryKey}`}
            uri={filteredUri}
            style={styles.video}
            initialTime={savedPlaybackTime.current}
            onTimeUpdate={(t) => { mobileTimeRef.current = t; }}
            onError={setMobileError}
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

      <ScrollView style={styles.playerContent}>
        <Text style={styles.nowPlaying} numberOfLines={2}>
          {currentEpisode?.title || ("\u7b2c " + (currentEpisodeIndex + 1) + " \u96c6")}
        </Text>
        <Text style={styles.resultMeta}>
          {currentDetail.sourceName} {"\u00b7"} {"\u5171"} {episodes.length} {"\u96c6"}
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
            <Text style={styles.sectionTitle}>{"\u7b80\u4ecb"}</Text>
            <Text style={styles.description}>{currentDetail.desc}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


