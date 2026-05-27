import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
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
import { File, Paths } from "expo-file-system";
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
  const hasRestored = useRef(false);
  const [hlsError, setHlsError] = useState(false);
  const [hlsRetryKey, setHlsRetryKey] = useState(0);
  const hlsTimeRef = useRef(0);
  const [mobileFilteredUri, setMobileFilteredUri] = useState(null);
  const mobileFileRef = useRef(null);

  // Compute episode/line info (safe when currentDetail is null)
  const currentLine = currentDetail?.lines?.[currentLineIndex];
  const episodes = currentLine?.episodes || currentDetail?.episodes || [];
  const currentEpisode = episodes[currentEpisodeIndex];
  const lines = currentDetail?.lines || [];
  const isHlsOnWeb = Platform.OS === "web" && currentEpisode?.url?.includes(".m3u8");
  const isMobileM3u8 = Platform.OS !== "web" && currentEpisode?.url?.includes(".m3u8");

  // 移动端 m3u8：下载 → 过滤广告 → 写入缓存文件 → file:// URI
  useEffect(() => {
    let cancelled = false;

    // 清理上一集的缓存文件
    if (mobileFileRef.current) {
      try { mobileFileRef.current.delete(); } catch {}
      mobileFileRef.current = null;
    }

    const url = currentEpisode?.url;
    if (!url || !url.includes(".m3u8") || Platform.OS === "web") {
      setMobileFilteredUri(url || null);
      return;
    }

    (async () => {
      try {
        const { text: cleanText, error } = await filterM3u8ByUrl(url);

        const uid = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        const file = new File(Paths.cache, `hls_filtered_${uid}.m3u8`);
        file.write(cleanText);
        if (!cancelled) {
          mobileFileRef.current = file;
          setMobileFilteredUri(file.uri);
        } else {
          try { file.delete(); } catch {}
        }
      } catch (e) {
        console.warn("m3u8 本地过滤失败，回退原始 URL:", e.message);
        if (!cancelled) setMobileFilteredUri(url);
      }
    })();

    return () => {
      cancelled = true;
      if (mobileFileRef.current) {
        try { mobileFileRef.current.delete(); } catch {}
        mobileFileRef.current = null;
      }
    };
  }, [currentEpisode?.url]);

  // 移动端 m3u8 → 等待本地过滤完成（不降级原始 URL）；Web HLS → null（HlsVideo 接管）；其余 → 直连
  const videoUrl = isMobileM3u8
    ? mobileFilteredUri
    : (isHlsOnWeb ? null : getPlayerUrl(currentEpisode?.url));

  const player = useVideoPlayer(videoUrl, (player) => {
    player.play();
  });

  // Track player status for error handling
  const statusEvent = useEvent(player, "statusChange", {
    status: player.status,
    oldStatus: player.status
  });
  const playerStatus = statusEvent?.status || player.status;

  // Enable time-update events for progress tracking
  useEffect(() => {
    player.timeUpdateEventInterval = 1;
  }, [player]);

  // Replace source when episode changes, reset restore flag
  useEffect(() => {
    if (videoUrl) {
      player.replace(videoUrl);
      player.play();
      hasRestored.current = false;
    }
  }, [videoUrl, player]);

  // Periodically save playback progress to history
  useEffect(() => {
    if (!currentEpisode?.url || !currentDetail?.id || !currentDetail?.sourceKey) return;

    const interval = setInterval(() => {
      const time = isHlsOnWeb ? hlsTimeRef.current : player.currentTime;
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
    player,
    currentEpisode?.url,
    currentEpisodeIndex,
    currentLineIndex,
    currentDetail?.id,
    currentDetail?.sourceKey,
    updateProgress
  ]);

  function handleRetry() {
    if (isHlsOnWeb) {
      setHlsError(false);
      setHlsRetryKey((k) => k + 1);
    } else if (videoUrl) {
      player.replace(videoUrl);
      player.play();
    }
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

  function handleBack() {
    // Save final position before closing
    if (currentDetail?.id && currentDetail?.sourceKey && currentEpisode?.url) {
      const time = isHlsOnWeb ? hlsTimeRef.current : player.currentTime;
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

  function handleOnFirstFrameRender() {
    if (savedPlaybackTime.current > 0 && !hasRestored.current) {
      player.currentTime = savedPlaybackTime.current;
      hasRestored.current = true;
    }
  }

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
            onFirstFrameRender={handleOnFirstFrameRender}
            initialTime={savedPlaybackTime.current}
          />
        ) : (
          <VideoView
            player={player}
            style={styles.video}
            nativeControls
            contentFit="contain"
            onFirstFrameRender={handleOnFirstFrameRender}
          />
        )}

        {((isHlsOnWeb ? hlsError : playerStatus === "error")) && (
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

