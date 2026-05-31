import { useEvent } from "expo";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";

/**
 * Bilibili 风格播放器控制覆盖层
 * 三层结构：顶部返回条 + 中心播放按钮 + 底部控制栏
 *
 * Props:
 *   player    - VideoPlayer 实例
 *   title     - 视频标题
 *   onBack    - 返回回调
 *   style     - 覆盖层容器样式
 */
export function PlayerControls({ player, title, onBack, style }) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef(null);

  // 播放状态
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  // 时间和进度
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    function tick() {
      try {
        const t = player.currentTime || 0;
        const d = player.duration || 0;
        setCurrentTime(t);
        setDuration(d);
      } catch {}
    }
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [player]);

  // 自动隐藏
  useEffect(() => {
    if (!controlsVisible) return;
    if (!isPlaying) return;

    hideTimer.current = setTimeout(() => {
      fadeOut();
    }, 3000);

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [controlsVisible, isPlaying]);

  function fadeOut() {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(function () {
      setControlsVisible(false);
    });
  }

  function fadeIn() {
    setControlsVisible(true);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }

  function toggleControls() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (controlsVisible) {
      fadeOut();
    } else {
      fadeIn();
    }
  }

  function handlePlayPause() {
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

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return (
        String(h).padStart(2, "0") +
        ":" +
        String(m).padStart(2, "0") +
        ":" +
        String(s).padStart(2, "0")
      );
    }
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  const isEnded = duration > 0 && currentTime >= duration - 0.5;

  return (
    <Animated.View style={[{ opacity }, style]} pointerEvents="box-none">
      {/* 点击区域 — 切换控件显隐 */}
      <Pressable style={controlsTouchArea} onPress={toggleControls} />

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
      {(!isPlaying || isEnded) && controlsVisible && (
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
            <View style={[progressFillStyle, { width: (progressRatio * 100) + "%" }]} />
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
    </Animated.View>
  );
}

// ─── 内联样式 ───

const controlsTouchArea = {
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
