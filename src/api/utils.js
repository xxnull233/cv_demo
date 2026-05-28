import { Platform } from "react-native";
import { PROXY_BASE } from "../constants/app";

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
    return `${PROXY_BASE}/proxy?url=${encodeURIComponent(targetUrl)}`;
  }
  return targetUrl;
}

/**
 * 简单并发限制器 - 控制同时运行的任务数
 * @param {number} concurrency - 最大并发数
 * @returns {function} 包装函数，接受 async 函数并返回带限制的版本
 */
export function pLimit(concurrency) {
  const queue = [];
  let active = 0;

  async function next() {
    if (active >= concurrency || queue.length === 0) return;
    const { fn, resolve, reject } = queue.shift();
    active++;
    try {
      const result = await fn();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      active--;
      next();
    }
  }

  return function (fn) {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      next();
    });
  };
}
