import { useEffect, useRef } from "react";
import Hls from "hls.js";

/**
 * Web 端 HLS 播放组件
 * Chrome/Firefox → hls.js；Safari → 原生 HLS
 * Mobile 平台不使用此组件。
 */
export function HlsVideo({
  uri,
  style,
  contentFit = "contain",
  onError,
  onTimeUpdate,
  onFirstFrameRender,
  initialTime = 0,
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const firstFrameDone = useRef(false);

  useEffect(() => {
    if (!uri) return;

    const video = videoRef.current;
    if (!video) return;

    let hls = null;

    if (Hls.isSupported()) {
      // Chrome / Firefox / Edge — hls.js
      hls = new Hls();
      hlsRef.current = hls;

      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(uri);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (initialTime > 0) {
          video.currentTime = initialTime;
        }
        video.play();
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          onError?.(true);
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari 原生 HLS
      video.src = uri;
      if (initialTime > 0) {
        video.addEventListener(
          "loadedmetadata",
          () => {
            video.currentTime = initialTime;
            video.play();
          },
          { once: true }
        );
      } else {
        video.play();
      }
    }

    // ── 事件绑定 ──

    const onTime = () => onTimeUpdate?.(video.currentTime);
    video.addEventListener("timeupdate", onTime);

    const onFirstFrame = () => {
      if (!firstFrameDone.current) {
        firstFrameDone.current = true;
        onFirstFrameRender?.();
      }
    };
    video.addEventListener("loadeddata", onFirstFrame);

    const onVideoError = () => onError?.(true);
    video.addEventListener("error", onVideoError);

    // ── 清理 ──
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadeddata", onFirstFrame);
      video.removeEventListener("error", onVideoError);
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      } else {
        video.removeAttribute("src");
        video.load();
      }
      firstFrameDone.current = false;
    };
  }, [uri]);

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      style={{
        width: "100%",
        height: "100%",
        objectFit: contentFit,
        ...(style || {}),
      }}
    />
  );
}
