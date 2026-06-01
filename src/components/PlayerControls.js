import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

/**
 * Bilibili 风格播放器控制覆盖层
 * 安全模式：不拦截触摸事件（依赖下方原生控件处理播放/暂停），
 * 仅渲染视觉覆盖层：顶部返回+标题、中心播放/暂停指示、底部进度条+时间
 *
 * Props:
 *   player    - VideoPlayer 实例
 *   title     - 视频标题
 *   onBack    - 返回回调
 *   style     - 覆盖层容器样式
 */
export function PlayerControls({ player, title, onBack, style }) {
  const [isPlaying, setIsPlaying] = useState(player?.playing ?? false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [barWidth, setBarWidth] = useState(0);

  // 轮询播放状态和时间（避免 useEvent 在 v2.2.2 上不可靠）
  useEffect(() => {
    if (!player) return;
    function tick() {
      try {
        setIsPlaying(player.playing);
        setCurrentTime(player.currentTime || 0);
        setDuration(player.duration || 0);
      } catch {}
    }
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [player]);

  function handlePlayPause() {
    if (!player) return;
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  }

  function handleProgressLayout(event) {
    setBarWidth(event.nativeEvent.layout.width);
  }

  function handleProgressTap(event) {
    if (!duration || duration <= 0 || !barWidth) return;
    const { locationX } = event.nativeEvent;
    const ratio = Math.max(0, Math.min(1, locationX / barWidth));
    player.currentTime = ratio * duration;
  }

  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const isEnded = duration > 0 && currentTime >= duration - 0.5;

  return (
    <View style={[style, containerStyle]} pointerEvents="box-none">
      {/* 顶部条 */}
      <View style={topBarStyle} pointerEvents="box-none">
        <Pressable style={backBtnStyle} onPress={onBack}>
          <Text style={backBtnTextStyle}>{"← 返回"}</Text>
        </Pressable>
        <Text style={titleStyle} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* 中心播放/重播按钮 */}
      {(!isPlaying || isEnded) && (
        <Pressable style={centerBtnStyle} onPress={handlePlayPause}>
          <Text style={centerBtnTextStyle}>{isEnded ? "↻" : "▶"}</Text>
        </Pressable>
      )}

      {/* 底部控制栏 */}
      <View style={bottomBarStyle} pointerEvents="box-none">
        <Pressable
          style={progressBarOuterStyle}
          onLayout={handleProgressLayout}
          onPress={handleProgressTap}
        >
          <View style={progressTrackStyle}>
            <View
              style={[progressFillStyle, { width: (progressRatio * 100) + "%" }]}
            />
          </View>
        </Pressable>
        <View style={controlsRowStyle}>
          <Pressable style={ctrlBtnStyle} onPress={handlePlayPause}>
            <Text style={ctrlBtnTextStyle}>{isPlaying ? "⏸" : "▶"}</Text>
          </Pressable>
          <Text style={timeTextStyle}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return (
      String(h).padStart(2, "0") +
      ":" + String(m).padStart(2, "0") +
      ":" + String(s).padStart(2, "0")
    );
  }
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

// ─── 内联样式 ───

const containerStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const topBarStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  flexDirection: "row",
  alignItems: "center",
  paddingTop: 8,
  paddingHorizontal: 12,
  paddingBottom: 10,
  backgroundColor: "rgba(0,0,0,0.35)",
};

const backBtnStyle = {
  paddingVertical: 6,
  paddingRight: 12,
};

const backBtnTextStyle = {
  color: "#f8fafc",
  fontSize: 15,
  fontWeight: "700",
};

const titleStyle = {
  flex: 1,
  color: "#f8fafc",
  fontSize: 15,
  fontWeight: "700",
};

const centerBtnStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: "center",
  alignItems: "center",
};

const centerBtnTextStyle = {
  color: "#f8fafc",
  fontSize: 52,
  fontWeight: "700",
  textShadowColor: "rgba(0,0,0,0.5)",
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 8,
};

const bottomBarStyle = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  paddingHorizontal: 12,
  paddingTop: 6,
  paddingBottom: 10,
  backgroundColor: "rgba(0,0,0,0.45)",
};

const progressBarOuterStyle = {
  paddingVertical: 8,
};

const progressTrackStyle = {
  height: 3,
  backgroundColor: "rgba(255,255,255,0.25)",
  borderRadius: 2,
  overflow: "hidden",
};

const progressFillStyle = {
  height: "100%",
  backgroundColor: "#38bdf8",
  borderRadius: 2,
};

const controlsRowStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
};

const ctrlBtnStyle = {
  paddingVertical: 4,
  paddingHorizontal: 4,
};

const ctrlBtnTextStyle = {
  color: "#f8fafc",
  fontSize: 18,
  fontWeight: "700",
};

const timeTextStyle = {
  color: "#d4d4d4",
  fontSize: 12,
  fontWeight: "600",
  flex: 1,
  textAlign: "center",
};
