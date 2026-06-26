import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, PanResponder, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

/**
 * 播放器控制覆盖层 — 与 Web 端全功能同步
 */
export function PlayerControls({ player, title, onBack, style, fullscreenMode, onFullscreenToggle }) {
  const insets = useSafeAreaInsets();
  const isFullscreen = fullscreenMode !== "normal";
  // ── 状态 ──
  const [isPlaying, setIsPlaying] = useState(player?.playing ?? false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSpeed, setShowSpeed] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [buffering, setBuffering] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);

  const hideTimer = useRef(null);
  const barWidthRef = useRef(0);
  const lastClickRef = useRef(0);
  const clickTimer = useRef(null);
  const seekStartX = useRef(0);
  const seekStartTime = useRef(0);
  const seekingRef = useRef(false);
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progWidth = progressAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  const gestureStartX = useRef(0);
  const gestureSwiping = useRef(false);
  const seekTimeRef = useRef(0);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const playerRef = useRef(player);
  const shouldHideRef = useRef(true);
  const justSeekedRef = useRef(false);
  const speedBtnRef = useRef(null);
  const [speedOptPos, setSpeedOptPos] = useState(null);

  // ── 轮询播放状态和时间 ──
  useEffect(() => {
    if (!player) return;
    function animateToProgress(pct, dur) {
      Animated.timing(progressAnim, {
        toValue: pct,
        duration: dur || 300,
        useNativeDriver: false,
      }).start();
    }
    function tick() {
      try {
        setIsPlaying(player.playing);
        var d = player.duration || 0;
        setDuration(d);
        durationRef.current = d;
        var t;
        if (justSeekedRef.current) {
          t = currentTimeRef.current;
          if (Math.abs((player.currentTime || 0) - t) > 0.5) {
            justSeekedRef.current = true;
          }
        } else {
          t = player.currentTime || 0;
        }
        setCurrentTime(t);
        currentTimeRef.current = t;
        animateToProgress(d > 0 ? (t / d) * 100 : 0, 300);
      } catch {}
    }
    tick();
    var interval = setInterval(tick, 250);
    return function () { clearInterval(interval); };
  }, [player]);

  useEffect(() => { playerRef.current = player; }, [player]);

  // ── 缓冲状态 —— 使用 addListener ──
  useEffect(() => {
    if (!player) return;
    setBuffering(player.status === "loading");
    var sub = player.addListener("statusChange", function (event) {
      setBuffering(event.status === "loading");
    });
    return function () { sub.remove(); };
  }, [player]);

  // ── 自动隐藏 ──
  useEffect(() => {
    const ended = duration > 0 && currentTime >= duration - 0.5;
    if (!isPlaying || ended) return;
    if (!showControls) return;
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(function () { fadeOut(); }, 5000);
    return function () { clearTimeout(hideTimer.current); };
  }, [showControls, isPlaying, currentTime, duration]);

  function fadeOut() {
    shouldHideRef.current = true;
    Animated.timing(opacityAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(function () {
      if (shouldHideRef.current) {
        setShowControls(false);
      }
    });
  }
  function fadeIn() {
    shouldHideRef.current = false;
    setShowControls(true);
    Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }

  // ── 倍速选项定位 ──
  useEffect(() => {
    if (!showSpeed) { setSpeedOptPos(null); return; }
    if (!speedBtnRef.current) return;
    try {
      speedBtnRef.current.measureInWindow(function (x, y, w, h) {
        var win = Dimensions.get("window");
        setSpeedOptPos({
          right: win.width - x - w,
          bottom: win.height - y + 4,
        });
      });
    } catch (e) {}
  }, [showSpeed]);

  // ── 播放/暂停 ──
  function togglePlay() {
    if (!player) return;
    if (player.playing) { player.pause(); } else { player.play(); }
  }

  // ── 单击/双击 ──
  function handleTap() {
    var now = Date.now();
    var last = lastClickRef.current;
    lastClickRef.current = now;
    if (now - last < 200) {
      if (clickTimer.current) clearTimeout(clickTimer.current);
      clickTimer.current = null;
      togglePlay();
      return;
    }
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(function () {
      if (showControls) { fadeOut(); }
      else { fadeIn(); }
      clickTimer.current = null;
    }, 200);
  }

  function handleBackPress() {
    onBack();
  }

  // ── 进度条 ──
  function handleProgressLayout(e) { barWidthRef.current = e.nativeEvent.layout.width; }

  // ── 滑动手势 ──
  function handleSeekStart(x) {
    if (!durationRef.current) return;
    seekStartX.current = x;
    seekStartTime.current = currentTimeRef.current;
    setShowSpeed(false);
  }
  function handleSeekMove(x) {
    if (!barWidthRef.current) return;
    var dx = x - seekStartX.current;
    if (!seekingRef.current) {
      if (Math.abs(dx) < 10) return;
      seekingRef.current = true;
      setSeekTime(seekStartTime.current);
      if (clickTimer.current) clearTimeout(clickTimer.current);
      setShowControls(true);
      setSeeking(true);
    }
    var ratio = dx / (barWidthRef.current || 1);
    var computed = Math.max(0, Math.min(durationRef.current, seekStartTime.current + ratio * durationRef.current));
    setSeekTime(computed);
    seekTimeRef.current = computed;
    progressAnim.setValue(durationRef.current > 0 ? (computed / durationRef.current) * 100 : 0);
  }
  function handleSeekEnd() {
    if (!seekingRef.current) return;
    var target = seekTimeRef.current;
    seekingRef.current = false;
    setSeeking(false);
    setCurrentTime(target);
    currentTimeRef.current = target;
    justSeekedRef.current = true;
    if (playerRef.current) playerRef.current.currentTime = target;
  }

  // ── 圆点拖动（用 PanResponder）──
  var dotPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: function () { return true; },
      onPanResponderGrant: function (e) {
        handleSeekStart(e.nativeEvent.pageX);
      },
      onPanResponderMove: function (e) {
        handleSeekMove(e.nativeEvent.pageX);
      },
      onPanResponderRelease: function () {
        handleSeekEnd();
      },
    })
  ).current;



  // ── 倍速 ──
  var SPEEDS = [1, 1.25, 1.5, 2];
  function selectSpeed(val) {
    setSpeed(val);
    try { player.playbackRate = val; } catch {}
    setShowSpeed(false);
  }

  return (
    <View style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, style]} pointerEvents="box-none">
      {/* 全屏手势处理 —— 点击 + 滑动 */}
      <View
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          gestureStartX.current = e.nativeEvent.pageX;
          gestureSwiping.current = false;
        }}
        onResponderMove={(e) => {
          var x = e.nativeEvent.pageX;
          var dx = x - gestureStartX.current;
          if (!gestureSwiping.current && Math.abs(dx) > 10) {
            gestureSwiping.current = true;
            if (clickTimer.current) {
              clearTimeout(clickTimer.current);
              clickTimer.current = null;
            }
            setShowSpeed(false);
            setSeeking(true);
            setShowControls(true);
            seekStartX.current = x;
            seekStartTime.current = currentTimeRef.current;
            seekingRef.current = true;
            setSeekTime(currentTimeRef.current);
          }
          if (gestureSwiping.current && durationRef.current > 0) {
            var ratio = dx / (barWidthRef.current || 300);
            var computed = Math.max(0, Math.min(durationRef.current, seekStartTime.current + ratio * durationRef.current));
            setSeekTime(computed);
            seekTimeRef.current = computed;
            progressAnim.setValue(durationRef.current > 0 ? (computed / durationRef.current) * 100 : 0);
          }
        }}
        onResponderRelease={() => {
          if (gestureSwiping.current) {
            var target = seekTimeRef.current;
            seekingRef.current = false;
            setSeeking(false);
            setCurrentTime(target);
            currentTimeRef.current = target;
            justSeekedRef.current = true;
            if (playerRef.current) playerRef.current.currentTime = target;
          } else {
            handleTap();
          }
        }}
      />

      {/* 缓冲提示 */}
      {buffering && (
        <View style={bufferingContainer}>
          <View style={bufferingInner}>
            <Text style={bufferingText}>{"正在缓冲..."}</Text>
          </View>
        </View>
      )}

      {/* 滑动时间浮层 */}
      {seeking && (
        <View style={seekOverlay}>
          <View style={seekOverlayInner}>
            <Text style={seekOverlayText}>{fmt(seekTime)}/{fmt(duration)}</Text>
          </View>
        </View>
      )}

      {/* 控件覆盖层 */}
      <Animated.View style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: opacityAnim, zIndex: 10, justifyContent: "space-between" }, showControls ? {} : { display: "none" }]} pointerEvents="box-none">
        {/* 顶部栏 */}
        <LinearGradient colors={["rgba(0,0,0,0.5)", "transparent"]} style={[topBar, isFullscreen && {
          paddingTop: Math.max(insets.top, 8),
          paddingLeft: Math.max(insets.left, 12),
          paddingRight: Math.max(insets.right, 12)
        }]}>
          <Pressable style={backBtn} onPress={handleBackPress}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="#f8fafc">
              <Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </Svg>
          </Pressable>
          <Text style={topTitle} numberOfLines={1}>{title}</Text>
          <View style={{ width: 60 }} />
        </LinearGradient>

        {/* 底部栏 */}
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.5)"]} style={[bottomBar, isFullscreen && {
          paddingBottom: Math.max(insets.bottom, 10),
          paddingLeft: Math.max(insets.left, 10),
          paddingRight: Math.max(insets.right, 10)
        }]}>
          <View style={ctrlRow}>
            <Pressable onPress={togglePlay} style={iconBtn}>
              {isPlaying ? (
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="#f8fafc">
                  <Path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
                </Svg>
              ) : (
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="#f8fafc">
                  <Path d="M8 5v14l11-7z"/>
                </Svg>
              )}
            </Pressable>

            {/* 进度条 */}
            <View style={progWrap}>
              <View
                style={progTrack}
                onLayout={handleProgressLayout}
                onStartShouldSetResponder={function () { return true; }}
                onResponderGrant={function (e) { handleSeekStart(e.nativeEvent.pageX); }}
                onResponderMove={function (e) { handleSeekMove(e.nativeEvent.pageX); }}
                onResponderRelease={function () { handleSeekEnd(); }}
              >
                <Animated.View style={[progFill, { width: progWidth }]} />
                <Animated.View
                  style={[progDot, { left: progWidth }]}
                  {...dotPan.panHandlers}
                />
              </View>
            </View>

            {/* 时间 */}
            <Text style={timeText}>{fmt(currentTime)}/{fmt(duration)}</Text>

            {/* 倍速 */}
            <Pressable ref={speedBtnRef} onPress={function () { setShowSpeed(function (v) { return !v; }); }} style={speedBtn}>
              <Text style={speedBtnText}>{speed}x</Text>
            </Pressable>

            {/* 全屏切换按钮（普通模式→全屏，全屏模式下→退出） */}
            <Pressable onPress={onFullscreenToggle} style={iconBtn}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="#f8fafc">
                {fullscreenMode === "normal" ? (
                  <Path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                ) : (
                  <Path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                )}
              </Svg>
            </Pressable>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* 倍速选项列（root 层渲染） */}
      {showSpeed && speedOptPos && (
        <View style={[speedOptionsRow, { position: "absolute", right: speedOptPos.right, bottom: speedOptPos.bottom }]}>
          {SPEEDS.map(function (s) {
            var a = s === speed;
            return (
              <Pressable key={s} onPress={function () { selectSpeed(s); }} style={[speedOpt, a && speedOptActive]}>
                <Text style={[speedOptText, a && speedOptTextActive]}>{s}x</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* 隐藏时的底部细进度条（仅普通模式显示） */}
      {!showControls && fullscreenMode === "normal" && (
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, zIndex: 5 }}>
          <Animated.View style={{ height: "100%", width: progWidth, backgroundColor: "#38bdf8" }} />
        </View>
      )}
    </View>
  );
}

function fmt(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  var m = Math.floor(sec / 60);
  var s = Math.floor(sec % 60);
  return m + ":" + (s < 10 ? "0" + s : String(s));
}

// ─── 样式 ───
var bufferingContainer = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", zIndex: 20, pointerEvents: "none" };
var bufferingInner = { backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 18, paddingVertical: 6, borderRadius: 8 };
var bufferingText = { color: "#f8fafc", fontSize: 16, fontWeight: "700" };

var seekOverlay = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", zIndex: 20, pointerEvents: "none" };
var seekOverlayInner = { backgroundColor: "rgba(0,0,0,0.65)", paddingHorizontal: 18, paddingVertical: 6, borderRadius: 8 };
var seekOverlayText = { color: "#f8fafc", fontSize: 16, fontWeight: "700" };

var topBar = { paddingTop: 8, paddingHorizontal: 12, paddingBottom: 14, flexDirection: "row", alignItems: "center" };
var backBtn = { paddingVertical: 6, paddingRight: 8 };
var topTitle = { flex: 1, color: "#f8fafc", fontSize: 15, fontWeight: "700" };

var bottomBar = { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10 };
var ctrlRow = { flexDirection: "row", alignItems: "center", gap: 8 };

var iconBtn = { padding: 4 };

var progWrap = { flex: 1 };
var progTrack = { height: 6, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 3, position: "relative", justifyContent: "center" };
var progFill = { height: "100%", backgroundColor: "#38bdf8", borderRadius: 2 };
var progDot = { position: "absolute", top: "50%", width: 14, height: 14, borderRadius: 7, backgroundColor: "#38bdf8", transform: [{ translateX: -7 }, { translateY: -7 }] };

var timeText = { width: 65, textAlign: "right", color: "#9ca3af", fontSize: 11, fontWeight: "600", letterSpacing: -0.3 };

var speedBtn = { width: 45, paddingVertical: 2, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center" };
var speedBtnText = { color: "#f8fafc", fontSize: 12, fontWeight: "700" };
var speedOptionsRow = { flexDirection: "column", gap: 2, zIndex: 40 };
var speedOpt = { paddingHorizontal: 5, paddingVertical: 3, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.06)" };
var speedOptActive = { backgroundColor: "rgba(56,189,248,0.2)" };
var speedOptText = { color: "#9ca3af", fontSize: 11, fontWeight: "600" };
var speedOptTextActive = { color: "#38bdf8", fontWeight: "700" };
