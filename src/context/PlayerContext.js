import { createContext, useContext, useRef, useState } from "react";

import { loadDetail } from "../api/client";
import { useHistory } from "./HistoryContext";
import { useSources } from "./SourceContext";

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const { sourceMap } = useSources();
  const { addHistoryItem } = useHistory();

  const [currentDetail, setCurrentDetail] = useState(null);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);

  // Saved playback position for resuming (set when opening from history)
  const savedPlaybackTime = useRef(0);

  async function openResult(result) {
    setDetailLoading(true);
    try {
      const detail = await loadDetail(result, sourceMap);
      if (!detail.episodes.length) {
        alert("该资源没有可播放剧集");
        return false;
      }

      // Restore position from history item (if coming from history)
      const restoreLineIndex = result.lineIndex ?? 0;
      const restoreEpisodeIndex = result.episodeIndex ?? 0;
      const restoreTime = result.currentTime ?? 0;

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
        lineIndex: restoreLineIndex,
        episodeIndex: restoreEpisodeIndex,
        episodeUrl: detail.episodes[restoreEpisodeIndex]?.url || ""
      });
      return true;
    } catch (error) {
      alert("加载详情失败: " + error.message);
      return false;
    } finally {
      setDetailLoading(false);
    }
  }

  function closePlayer() {
    setCurrentDetail(null);
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
