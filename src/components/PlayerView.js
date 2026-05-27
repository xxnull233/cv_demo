import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef } from "react";

/**
 * 播放器子组件 — 仅在合法 URI 传入时才挂载
 *
 * 将 useVideoPlayer 封装在此组件内，确保播放器首次创建时
 * 永远收到有效源（不会以 null 初始化），避免空源导致的错误状态。
 */
export function PlayerView({
  uri,
  style,
  onTimeUpdate,
  onFirstFrameRender,
  onError,
  initialTime = 0
}) {
  const player = useVideoPlayer(uri, (player) => {
    if (initialTime > 0) {
      player.currentTime = initialTime;
    }
    player.play();
  });
  const firstFrameDone = useRef(false);

  // 启用 timeupdate 事件
  useEffect(() => {
    player.timeUpdateEventInterval = 1;
  }, [player]);

  // 定期向父组件报告播放进度
  useEffect(() => {
    if (!onTimeUpdate) return;
    const interval = setInterval(() => {
      onTimeUpdate(player.currentTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [player, onTimeUpdate]);

  // 监听播放器状态变化，错误时通知父组件
  const statusEvent = useEvent(player, "statusChange", {
    status: player.status,
    oldStatus: player.status
  });
  const playerStatus = statusEvent?.status || player.status;

  useEffect(() => {
    if (playerStatus === "error") {
      onError?.(true);
    }
  }, [playerStatus, onError]);

  function handleFirstFrameRender() {
    if (!firstFrameDone.current) {
      firstFrameDone.current = true;
      onFirstFrameRender?.();
    }
  }

  return (
    <VideoView
      player={player}
      style={style}
      nativeControls
      contentFit="contain"
      onFirstFrameRender={handleFirstFrameRender}
    />
  );
}
