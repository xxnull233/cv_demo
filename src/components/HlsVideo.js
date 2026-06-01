import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export function HlsVideo({
  uri,
  style,
  contentFit = "contain",
  onError,
  onTimeUpdate,
  onFirstFrameRender,
  onBack,
  initialTime = 0,
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const firstFrameDone = useRef(false);
  const containerRef = useRef(null);
  const hideTimer = useRef(null);
  const progressRef = useRef(null);

  const [paused, setPaused] = useState(true);
  const [ended, setEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSpeed, setShowSpeed] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const seekStartX = useRef(0);
  const seekStartTime = useRef(0);
  const seekingRef = useRef(false);
  const lastClickRef = useRef(0);
  const clickTimer = useRef(null);

  useEffect(() => {
    if (!uri) return;
    const video = videoRef.current;
    if (!video) return;
    let hls = null;
    if (Hls.isSupported()) {
      hls = new Hls();
      hlsRef.current = hls;
      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(uri));
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (initialTime > 0) video.currentTime = initialTime;
        video.play();
      });
      hls.on(Hls.Events.ERROR, (_e, d) => { if (d.fatal) onError?.(true); });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = uri;
      if (initialTime > 0) {
        video.addEventListener("loadedmetadata", () => { video.currentTime = initialTime; video.play(); }, { once: true });
      } else { video.play(); }
    }
    return () => {
      if (hls) { hls.destroy(); hlsRef.current = null; }
      else { video.removeAttribute("src"); video.load(); }
    };
  }, [uri]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    function onPlay() { setPaused(false); setEnded(false); }
    function onPause() { setPaused(true); }
    function onEnded() { setEnded(true); setPaused(true); }
    function onTime() {
      const t = v.currentTime || 0;
      const d = v.duration || 0;
      setCurrentTime(t); setDuration(d);
      onTimeUpdate?.(t);
    }
    function onLoaded() {
      if (!firstFrameDone.current) { firstFrameDone.current = true; onFirstFrameRender?.(); }
    }
    function onErr() { onError?.(true); }
    function onWaiting() { setBuffering(true); }
    function onCanPlay() { setBuffering(false); }
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadeddata", onLoaded);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("error", onErr);
    return () => {
      v.removeEventListener("play", onPlay); v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded); v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadeddata", onLoaded); v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("canplay", onCanPlay); v.removeEventListener("error", onErr);
      firstFrameDone.current = false;
    };
  }, []);

  useEffect(() => {
    if (paused || ended || seeking) return;
    if (!showControls) return;
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 5000);
    return () => clearTimeout(hideTimer.current);
  }, [showControls, paused, ended, seeking]);

  function toggleControls() { setShowControls(function (v) { return !v; }); setShowSpeed(false); }
  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) { v.play(); setEnded(false); } else { v.pause(); }
  }

  function handleProgressTap(e) {
    const el = progressRef.current;
    const v = videoRef.current;
    if (!el || !v || !v.duration) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
  }

  const SPEEDS = [1.0, 1.25, 1.5, 2.0];
  function selectSpeed(val) {
    setSpeed(val);
    if (videoRef.current) videoRef.current.playbackRate = val;
    setShowSpeed(false);
  }

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen();
  }

  useEffect(function () {
    function onChange() { setIsFullscreen(!!document.fullscreenElement); }
    document.addEventListener("fullscreenchange", onChange);
    return function () { document.removeEventListener("fullscreenchange", onChange); };
  });

  function getDur() { try { return videoRef.current?.duration || 0; } catch { return 0; } }
  function handleSeekStart(cx) {
    const d = getDur();
    if (!d) return;
    seekStartX.current = cx;
    seekStartTime.current = (function () { try { return videoRef.current?.currentTime || 0; } catch { return 0; } })();
    setShowSpeed(false);
  }
  function handleSeekMove(cx) {
    if (!containerRef.current) return;
    const dx = cx - seekStartX.current;
    if (!seekingRef.current) {
      if (Math.abs(dx) < 10) return;
      seekingRef.current = true;
      setSeekTime(seekStartTime.current);
      setShowControls(true);
      setSeeking(true);
    }
    const rect = containerRef.current.getBoundingClientRect();
    const nt = Math.max(0, Math.min(getDur(), seekStartTime.current + (dx / rect.width) * getDur()));
    setSeekTime(nt);
  }
  var dragMove = function (e) { handleSeekMove(e.clientX); };
  var dragEnd = function () { handleSeekEnd(); document.removeEventListener("mousemove", dragMove); document.removeEventListener("mouseup", dragEnd); };

  function handleSeekEnd() {
    if (!seekingRef.current) { return; }
    var target = seekTime;
    seekingRef.current = false;
    setSeeking(false);
    setCurrentTime(target);
    if (videoRef.current) videoRef.current.currentTime = target;
  }

  function fmt(sec) {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ":" + String(s).padStart(2, "0");
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayPct = seeking && duration > 0 ? (seekTime / duration) * 100 : progressPct;

  return (
    <div ref={containerRef}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#000", cursor: showControls ? "default" : "none" }}
    >
      <video ref={videoRef} playsInline
        style={{ width: "100%", height: "100%", objectFit: contentFit, ...(style || {}) }}
      />
      {buffering && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 20, color: "#f8fafc", fontSize: 20, fontWeight: "700", background: "rgba(0,0,0,0.55)", padding: "8px 18px", borderRadius: 8, pointerEvents: "none" }}>
          {"正在缓冲..."}
        </div>
      )}
      <div
        onClick={function (e) {
          var now = Date.now();
          var last = lastClickRef.current;
          lastClickRef.current = now;
          if (now - last < 200) {
            if (clickTimer.current) clearTimeout(clickTimer.current);
            clickTimer.current = null;
            e.stopPropagation();
            togglePlay();
            return;
          }
          if (clickTimer.current) clearTimeout(clickTimer.current);
          clickTimer.current = setTimeout(function () {
            toggleControls();
            clickTimer.current = null;
          }, 200);
        }}
        onDoubleClick={function (e) { e.stopPropagation(); togglePlay(); }}
        onTouchStart={function (e) { handleSeekStart(e.touches[0].clientX); }}
        onTouchMove={function (e) { handleSeekMove(e.touches[0].clientX); }}
        onTouchEnd={handleSeekEnd}
        onMouseDown={function (e) {
          handleSeekStart(e.clientX);
          var m = function (ev) { handleSeekMove(ev.clientX); };
          var u = function () { handleSeekEnd(); document.removeEventListener("mousemove", m); document.removeEventListener("mouseup", u); };
          document.addEventListener("mousemove", m);
          document.addEventListener("mouseup", u);
        }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
      />
      {seeking && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "rgba(0,0,0,0.65)", color: "#f8fafc", padding: "6px 18px", borderRadius: 8, fontSize: 20, fontWeight: "700", pointerEvents: "none", zIndex: 20, whiteSpace: "nowrap" }}>
          {fmt(seekTime)} / {fmt(getDur())}
        </div>
      )}
      {showControls && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", zIndex: 10, pointerEvents: "none" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "6px 12px", background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)", pointerEvents: "auto" }}>
            <span onClick={function (e) { e.stopPropagation(); onBack ? onBack() : history.back(); }}
              style={{ cursor: "pointer", padding: "4px 8px", display: "flex", alignItems: "center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#f8fafc">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </span>
          </div>

          <div style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)", padding: "4px 12px 8px", pointerEvents: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span onClick={function (e) { e.stopPropagation(); togglePlay(); }}
                style={{ cursor: "pointer", lineHeight: 1, display: "flex" }}>
                {paused ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#f8fafc">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#f8fafc">
                    <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
                  </svg>
                )}
              </span>
              <div ref={progressRef} onClick={function (e) { e.stopPropagation(); handleProgressTap(e); }}
                style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.25)", borderRadius: 3, cursor: "pointer", position: "relative" }}>
                <div style={{ height: "100%", width: displayPct + "%", background: "#38bdf8", borderRadius: 2 }} />
                <div
                  onMouseDown={function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    handleSeekStart(e.clientX);
                    document.addEventListener("mousemove", dragMove);
                    document.addEventListener("mouseup", dragEnd);
                  }}
                  onClick={function (e) { e.stopPropagation(); }}
                  onTouchStart={function (e) {
                    e.stopPropagation();
                    handleSeekStart(e.touches[0].clientX);
                  }}
                  onTouchMove={function (e) { e.stopPropagation(); handleSeekMove(e.touches[0].clientX); }}
                  onTouchEnd={function (e) { e.stopPropagation(); handleSeekEnd(); }}
                  style={{ position: "absolute", left: displayPct + "%", top: "50%", transform: "translate(-50%, -50%)", width: 14, height: 14, borderRadius: 7, background: "#38bdf8", boxShadow: "0 0 2px rgba(0,0,0,0.5)", cursor: "grab" }} />
              </div>
              <span style={{ color: "#d4d4d4", fontSize: 11, fontWeight: "600", letterSpacing: -0.3 }}>{fmt(currentTime)}/{fmt(duration)}</span>
              <div style={{ position: "relative" }}>
                <span onClick={function (e) { e.stopPropagation(); setShowSpeed(function (v) { return !v; }); }}
                  style={{ color: "#f8fafc", fontSize: 12, fontWeight: "700", cursor: "pointer", padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.08)" }}>{speed}x</span>
                {showSpeed && (
                  <div style={{ position: "absolute", bottom: "100%", right: 0, marginBottom: 4, background: "rgba(15,15,15,0.96)", borderRadius: 8, overflow: "hidden", zIndex: 30 }}>
                    {SPEEDS.map(function (s) { var a = s === speed; return (
                      <div key={s} onClick={function (e) { e.stopPropagation(); selectSpeed(s); }}
                        style={{ padding: "6px 16px", cursor: "pointer", color: a ? "#38bdf8" : "#f8fafc", fontWeight: a ? "700" : "400", fontSize: 13, background: a ? "rgba(56,189,248,0.15)" : "transparent" }}>{s}x</div>); })}
                  </div>
                )}
              </div>
              <span onClick={function (e) { e.stopPropagation(); toggleFullscreen(); }}
                style={{ cursor: "pointer", lineHeight: 1, display: "flex" }}>
                {isFullscreen ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#f8fafc">
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#f8fafc">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                )}
              </span>
            </div>
          </div>
        </div>
      )}
      {!showControls && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, zIndex: 2, pointerEvents: "none" }}>
          <div style={{ height: "100%", width: progressPct + "%", background: "#38bdf8" }} />
        </div>
      )}
    </div>
  );
}
