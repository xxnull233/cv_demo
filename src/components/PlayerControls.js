import { useEvent } from "expo";
import { useEffect, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, StatusBar, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ScreenOrientation from "expo-screen-orientation";
import Svg, { Path } from "react-native-svg";

/**
 * 播放器控制覆盖层 — 与 Web 端全功能同步
 */
export function PlayerControls({ player, title, onBack, style, onFullscreenChange }) {
  // ── 状态 ──
  const [isPlaying, setIsPlaying] = useState(player?.playing ?? false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSpeed, setShowSpeed] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [buffering, setBuffering] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState("normal");
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
  const gestureStartX = useRef(0);
  const gestureSwiping = useRef(false);
  const seekTimeRef = useRef(0);
  const fullscreenModeRef = useRef("normal");
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const playerRef = useRef(player);

  // ── 轮询播放状态和时间 ──
  useEffect(() => {
    if (!player) return;
    function tick() {
      try {
        setIsPlaying(player.playing);
        var t = player.currentTime || 0;
        var d = player.duration || 0;
        setCurrentTime(t);
        setDuration(d);
        currentTimeRef.current = t;
        durationRef.current = d;
      } catch {}
    }
    tick();
    var interval = setInterval(tick, 250);
    return function () { clearInterval(interval); };
  }, [player]);

  useEffect(() => { playerRef.current = player; }, [player]);

  // ── 挂载时锁定竖屏，脱离时解锁 —— 不跟随系统自动旋转 ──
  useEffect(function () {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(function () {});
    return function () { ScreenOrientation.unlockAsync().catch(function () {}); };
  }, []);

  // ── 缓冲状态 —— 事件驱动，取代轮询 ──
  var statusEvent = useEvent(player, "statusChange", {
    status: player?.status,
  });
  var currentPlayerStatus = statusEvent?.status || player?.status;
  useEffect(() => {
    setBuffering(currentPlayerStatus === "loading");
  }, [currentPlayerStatus]);

  // ── 自动隐藏 ──
  useEffect(() => {
    if (!isPlaying || ended) return;
    if (!showControls) return;
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(function () { fadeOut(); }, 5000);
    return function () { clearTimeout(hideTimer.current); };
  }, [showControls, isPlaying, currentTime]);

  function fadeOut() {
    Animated.timing(opacityAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(function () {
      setShowControls(false);
    });
  }
  function fadeIn() {
    setShowControls(true);
    Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }

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

  // ── 全屏切换 ──
  function enterPortraitFS() {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(function () {});
    StatusBar.setHidden(true);
    setFullscreenMode("portrait");
    fullscreenModeRef.current = "portrait";
    onFullscreenChange?.("portrait");
  }
  function enterLandscapeFS() {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(function () {});
    StatusBar.setHidden(true);
    setFullscreenMode("landscape");
    fullscreenModeRef.current = "landscape";
    onFullscreenChange?.("landscape");
  }
  function exitFS() {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(function () {});
    StatusBar.setHidden(false);
    setFullscreenMode("normal");
    fullscreenModeRef.current = "normal";
    onFullscreenChange?.("normal");
  }
  function handleBackPress() {
    if (fullscreenModeRef.current !== "normal") {
      exitFS();
    } else {
      onBack();
    }
  }

  // ── 进度条 ──
  function handleProgressLayout(e) { barWidthRef.current = e.nativeEvent.layout.width; }
  function handleProgressTap(e) {
    if (!duration || duration <= 0 || !barWidthRef.current) return;
    var ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / barWidthRef.current));
    player.currentTime = ratio * duration;
  }

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
  }
  function handleSeekEnd() {
    if (!seekingRef.current) return;
    var target = seekTimeRef.current;
    seekingRef.current = false;
    setSeeking(false);
    setCurrentTime(target);
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

  var progressRatio = duration > 0 ? (seeking ? seekTime / duration : currentTime / duration) : 0;
  var ended = duration > 0 && currentTime >= duration - 0.5;
  var displayPct = (progressRatio * 100).toFixed(1);

  return (
    <View style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, style]} pointerEvents="box-none">
      {/* 点击处理 —— Pressable，不争夺子元素触摸 */}
      <Pressable
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        onPress={handleTap}
      />
      {/* 滑动处理 —— 仅在移动时认领手势 */}
      <View
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        onStartShouldSetResponder={() => false}
        onMoveShouldSetResponder={(e) => {
          return Math.abs(e.nativeEvent.pageX - gestureStartX.current) > 5;
        }}
        onResponderGrant={(e) => {
          gestureSwiping.current = true;
          setShowSpeed(false);
          setSeeking(true);
          setShowControls(true);
          seekStartX.current = e.nativeEvent.pageX;
          seekStartTime.current = currentTime;
          seekingRef.current = true;
          setSeekTime(currentTime);
        }}
        onResponderMove={(e) => {
          var x = e.nativeEvent.pageX;
          var dx = x - seekStartX.current;
          if (duration > 0) {
            var ratio = dx / (barWidthRef.current || 300);
            var computed = Math.max(0, Math.min(duration, seekStartTime.current + ratio * duration));
            setSeekTime(computed);
            seekTimeRef.current = computed;
          }
        }}
        onResponderRelease={() => {
          var target = seekTimeRef.current;
          seekingRef.current = false;
          setSeeking(false);
          setCurrentTime(target);
          if (player) player.currentTime = target;
        }}
        onTouchStart={(e) => {
          gestureStartX.current = e.nativeEvent.pageX;
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
        <LinearGradient colors={["rgba(0,0,0,0.5)", "transparent"]} style={topBar}>
          <Pressable style={backBtn} onPress={handleBackPress}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="#f8fafc">
              <Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </Svg>
          </Pressable>
          <Text style={topTitle} numberOfLines={1}>{title}</Text>
          <View style={{ width: 60 }} />
        </LinearGradient>

        {/* 底部栏 */}
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.5)"]} style={bottomBar}>
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
                <View style={[progFill, { width: displayPct + "%" }]} />
                <View
                  style={[progDot, { left: displayPct + "%" }]}
                  {...dotPan.panHandlers}
                />
              </View>
            </View>

            {/* 时间 */}
            <Text style={timeText}>{fmt(currentTime)}/{fmt(duration)}</Text>

            {/* 倍速 */}
            <View style={{ position: "relative" }}>
              <Pressable onPress={function () { setShowSpeed(function (v) { return !v; }); }} style={speedBtn}>
                <Text style={speedBtnText}>{speed}x</Text>
              </Pressable>
              {showSpeed && (
                <View style={speedPopup}>
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
            </View>

            {/* 全屏模式切换 */}
            {fullscreenMode !== "normal" ? (
              <Pressable onPress={exitFS} style={iconBtn}>
                <Svg width="20" height="20" viewBox="0 -960 960 960" fill="#f8fafc">
                  <Path d="m136-80-56-56 264-264H160v-80h320v320h-80v-184L136-80Zm344-400v-320h80v184l264-264 56 56-264 264h184v80H480Z"/>
                </Svg>
              </Pressable>
            ) : (
              <>
                <Pressable onPress={enterPortraitFS} style={iconBtn}>
                  <Svg width="20" height="20" viewBox="0 -960 960 960" fill="#f8fafc">
                    <Path d="M200-680v-120q0-33 23.5-56.5T280-880h120v80H280v120h-80Zm80 600q-33 0-56.5-23.5T200-160v-120h80v120h120v80H280Zm400-600v-120H560v-80h120q33 0 56.5 23.5T760-800v120h-80ZM560-80v-80h120v-120h80v120q0 33-23.5 56.5T680-80H560Z"/>
                  </Svg>
                </Pressable>
                <Pressable onPress={enterLandscapeFS} style={iconBtn}>
                  <Svg width="20" height="20" viewBox="0 -960 960 960" fill="#f8fafc">
                    <Path d="M800-560v-120H680v-80h120q33 0 56.5 23.5T880-680v120h-80Zm-720 0v-120q0-33 23.5-56.5T160-760h120v80H160v120H80Zm600 360v-80h120v-120h80v120q0 33-23.5 56.5T800-200H680Zm-520 0q-33 0-56.5-23.5T80-280v-120h80v120h120v80H160Z"/>
                  </Svg>
                </Pressable>
              </>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* 隐藏时的底部细进度条（仅普通模式显示） */}
      {!showControls && fullscreenMode === "normal" && (
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, zIndex: 5 }}>
          <View style={{ height: "100%", width: displayPct + "%", backgroundColor: "#38bdf8" }} />
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
var bufferingContainer = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", zIndex: 30, pointerEvents: "none" };
var bufferingInner = { backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 18, paddingVertical: 6, borderRadius: 8 };
var bufferingText = { color: "#f8fafc", fontSize: 20, fontWeight: "700" };

var seekOverlay = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", zIndex: 30, pointerEvents: "none" };
var seekOverlayInner = { backgroundColor: "rgba(0,0,0,0.65)", paddingHorizontal: 18, paddingVertical: 6, borderRadius: 8 };
var seekOverlayText = { color: "#f8fafc", fontSize: 20, fontWeight: "700" };

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

var timeText = { color: "#9ca3af", fontSize: 11, fontWeight: "600", letterSpacing: -0.3 };

var speedBtn = { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.08)" };
var speedBtnText = { color: "#f8fafc", fontSize: 12, fontWeight: "700" };
var speedPopup = { position: "absolute", bottom: 28, right: 0, backgroundColor: "rgba(15,15,15,0.96)", borderRadius: 8, overflow: "hidden", zIndex: 40 };
var speedOpt = { paddingHorizontal: 16, paddingVertical: 8 };
var speedOptActive = { backgroundColor: "rgba(56,189,248,0.15)" };
var speedOptText = { color: "#f8fafc", fontSize: 13, fontWeight: "400" };
var speedOptTextActive = { color: "#38bdf8", fontWeight: "700" };
