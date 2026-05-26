import { Platform } from "react-native";
import { PROXY_BASE_URL } from "./sites";

/**
 * 带超时的 AbortController 封装
 */
export function withTimeout(ms) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  return { controller, timeoutId };
}

/**
 * 移除 API base URL 末尾的斜杠
 */
export function normalizeApiBase(url) {
  return url.replace(/\/+$/, "");
}

/**
 * 在 Web 平台通过本地代理转发，绕过 CORS 限制
 */
export function resolveUrl(targetUrl) {
  if (Platform.OS === "web") {
    return `${PROXY_BASE_URL}?url=${encodeURIComponent(targetUrl)}`;
  }
  return targetUrl;
}
