import { createContext, useContext, useRef, useState } from "react";

import { loadDetail } from "../api/client";
import { useHistory } from "./HistoryContext";
import { useSources } from "./SourceContext";

const PlayerContext = createContext(null);

// 详情缓存 TTL: 10 分钟, 最多 30 条
const DETAIL_CACHE_TTL = 10 * 60 * 1000;
const DETAIL_CACHE_MAX = 30;

export function PlayerProvider({ children }) {
  const { sourceMap } = useSources();
  const { addHistoryItem } = useHistory();

  const [currentDetail, setCurrentDetail] = useState(null);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // Saved playback position for resuming (set when opening from history)
  const savedPlaybackTime = useRef(0);
  const loadIdRef = useRef(0);
  const detailCacheRef = useRef(null);

  function getDetailCache(cacheKey) {
    const cache = detailCacheRef.current;
    if (!cache) return null;
    const entry = cache[cacheKey];
    if (entry && Date.now() - entry.timestamp < DETAIL_CACHE_TTL) {
      return entry.detail;
    }
    return null;
  }

  function setDetailCache(cacheKey, detail) {
    let cache = detailCacheRef.current;
    if (!cache) { cache = {}; detailCacheRef.current = cache; }
    cache[cacheKey] = { detail, timestamp: Date.now() };
    const keys = Object.keys(cache);
    if (keys.length > DETAIL_CACHE_MAX) {
      delete cache[keys[0]];
    }
  }

  async function openResult(result) {
    const currentLoadId = ++loadIdRef.current;
    setDetailLoading(true);
    setDetailError("");

    // Restore position from history item (if coming from history)
    const restoreLineIndex = result.lineIndex ?? 0;
    const restoreEpisodeIndex = result.episodeIndex ?? 0;
    const restoreTime = result.currentTime ?? 0;

    try {
      let detail;

      // 检查详情缓存
      const cacheKey = result.sourceKey + ":" + result.id;
      const cachedDetail = getDetailCache(cacheKey);
      if (cachedDetail) {
        detail = cachedDetail;
      } else {
        detail = await loadDetail(result, sourceMap);
        if (currentLoadId !== loadIdRef.current) return false;
        setDetailCache(cacheKey, detail);
      }

      if (currentLoadId !== loadIdRef.current) return false;

      if (!detail.episodes.length) {
        setDetailError("该资源没有可播放剧集");
        return false;
      }

      setCurrentLineIndex(restoreLineIndex);
      setCurrentEpisodeIndex(Math.min(restoreEpisodeIndex, Math.max(0, detail.episodes.length - 1)));
      savedPlaybackTime.current = restoreTime > 0 ? restoreTime : 0;
      setCurrentDetail({ ...detail, id: result.id });

      await addHistoryItem({
        id: result.id,
        title: detail.title || result.title,
        poster: detail.poster || result.poster,
        sourceKey: result.sourceKey,
        sourceName: result.sourceName,
                episodeCount: detail.episodes.length,
        episodeTitle: detail.episodes[restoreEpisodeIndex]?.title || "",
        lineIndex: restoreLineIndex,
        episodeIndex: restoreEpisodeIndex,
        episodeUrl: detail.episodes[restoreEpisodeIndex]?.url || ""
      });
      return true;
    } catch (error) {
      if (currentLoadId !== loadIdRef.current) return false;
      setDetailError("加载详情失败: " + error.message);
      return false;
    } finally {
      if (currentLoadId === loadIdRef.current) {
        setDetailLoading(false);
      }
    }
  }

  function closePlayer() {
    setCurrentDetail(null);
    setDetailError("");
    savedPlaybackTime.current = 0;
  }

  function selectLine(index) {
    setCurrentLineIndex(index);
    setCurrentEpisodeIndex(0);
  }

  const value = {
    currentDetail,
    currentEpisodeIndex,
    currentLineIndex,
    savedPlaybackTime,
    detailLoading,
    detailError,
    openResult,
    closePlayer,
    setCurrentEpisodeIndex,
    selectLine
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return context;
}

