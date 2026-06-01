import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef } from "react";
import { View } from "react-native";

import { PlayerControls } from "./PlayerControls";

/**
 * 播放器子组件 — 仅在合法 URI 传入时才挂载
 *
 * 使用原生控件播放，同时叠加 Bilibili 风格的自定义控制覆盖层。
 * 覆盖层不拦截触摸事件（pointerEvents="box-none"），
 * 播放/暂停依赖原生控件，覆盖层仅提供视觉增强和快捷操作。
 */
export function PlayerView({
  uri,
  style,
  title,
  onBack,
  onTimeUpdate,
  onFirstFrameRender,
  onError,
  initialTime = 0,
}) {
  const player = useVideoPlayer(uri, (player) => {
    if (initialTime > 0) {
      player.currentTime = initialTime;
    }
    player.play();
  });
  const firstFrameDone = useRef(false);

  // 源变化时切换到新地址
  useEffect(() => {
    if (uri) {
      player.replace(uri);
      if (initialTime > 0) {
        player.currentTime = initialTime;
      }
      player.play();
    }
  }, [uri, player]);

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
    oldStatus: player.status,
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
    <View style={style}>
      <VideoView
        player={player}
        style={{ flex: 1 }}
        nativeControls={false}
        contentFit="contain"
        onFirstFrameRender={handleFirstFrameRender}
      />
      <PlayerControls
        player={player}
        title={title}
        onBack={onBack}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
    </View>
  );
}
