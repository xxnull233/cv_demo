import { createContext, useContext, useState } from "react";

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
  const [playbackRate, setPlaybackRate] = useState(1);
  const [detailLoading, setDetailLoading] = useState(false);

  async function openResult(result) {
    setDetailLoading(true);
    try {
      const detail = await loadDetail(result, sourceMap);
      if (!detail.episodes.length) {
        alert("该资源没有可播放剧集");
        return false;
      }
      setCurrentEpisodeIndex(0);
      setCurrentLineIndex(0);
      setCurrentDetail({ ...detail, id: result.id });
      await addHistoryItem({
        id: result.id,
        title: detail.title || result.title,
        poster: detail.poster || result.poster,
        sourceKey: result.sourceKey,
        sourceName: result.sourceName,
        episodeCount: detail.episodes.length
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
  }

  function selectLine(index) {
    setCurrentLineIndex(index);
    setCurrentEpisodeIndex(0);
  }

  const value = {
    currentDetail,
    currentEpisodeIndex,
    currentLineIndex,
    playbackRate,
    detailLoading,
    openResult,
    closePlayer,
    setCurrentEpisodeIndex,
    selectLine,
    setPlaybackRate
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
