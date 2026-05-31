/**
 * CV 本地代理服务器
 * 用于 web 调试时绕过 CORS 限制 + m3u8 广告过滤
 *
 * 启动方式: node scripts/proxy-server.mjs
 * 默认端口: 19001
 *
 * 请求格式:
 *   GET /proxy?url=...           → 代理 JSON/文本请求（API 用）
 *   GET /m3u8?url=...            → 代理 m3u8 + 广告过滤
 *   GET /health                  → 健康检查
 */

import http from "node:http";
import https from "node:https";
import { URL } from "node:url";
import { resolveUrl, getPathDir, detectAdSegments, parseMasterPlaylist, parseM3u8Segments, generateCleanPlaylist } from "../src/utils/m3u8Parser.js";

const PORT = parseInt(process.env.PROXY_PORT || "19001", 10);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

const DEFAULT_HEADERS = {
  "Accept": "application/json,text/plain,*/*",
  "User-Agent": "CV-Proxy/0.1.0",
};

// ─── HTTP fetch helper ────────────────────────────────────────────

function fetchTarget(targetUrl, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const httpMod = parsed.protocol === "https:" ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: "GET",
      headers: { ...DEFAULT_HEADERS },
      timeout,
    };

    const req = httpMod.request(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const body = Buffer.concat(chunks);
        const contentType = res.headers["content-type"] || "";
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
          isJson: contentType.includes("json"),
        });
      });
    });

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out after " + timeout + "ms"));
    });
    req.end();
  });
}

// ─── m3u8 parsing & playlist 重建（由 m3u8Parser.js 提供）

// ─── 下载 + 过滤 m3u8 ────────────────────────────────────────────

async function fetchAndFilterM3u8(m3u8Url) {
  const result = await fetchTarget(m3u8Url);
  const text = result.body.toString("utf-8");

  if (text.includes("#EXT-X-STREAM-INF")) {
    const streams = parseMasterPlaylist(text, m3u8Url);
    streams.sort((a, b) => b.bandwidth - a.bandwidth);
    if (streams.length === 0) {
      return { error: "No streams in master playlist" };
    }
    return await fetchAndFilterM3u8(streams[0].url);
  }

  const { segments, hasDiscontinuity } = parseM3u8Segments(text);

  if (segments.length === 0) {
    return { clean: text, adCount: 0, totalCount: 0 };
  }

  const baseUrl = m3u8Url;
  const adIndices = detectAdSegments(segments, baseUrl);

  const adInfo = generateCleanPlaylist(segments, adIndices, baseUrl);

  if (adInfo.clean === null) {
    return { error: "All segments filtered as ads" };
  }

  return {
    clean: adInfo.clean,
    adCount: adInfo.adCount,
    totalCount: segments.length,
  };
}

// ─── Query parsing ────────────────────────────────────────────────

function parseQuery(url) {
  const idx = url.indexOf("?");
  if (idx === -1) return {};
  const search = url.slice(idx + 1);
  const params = {};
  for (const part of search.split("&")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = decodeURIComponent(part.slice(0, eq));
    const val = decodeURIComponent(part.slice(eq + 1));
    if (key) params[key] = val;
  }
  return params;
}

// ─── HTTP server ──────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const urlPath = req.url || "/";

  // Health check
  if (urlPath === "/health") {
    res.writeHead(200, { "Content-Type": "application/json", ...CORS_HEADERS });
    res.end(JSON.stringify({ status: "ok", port: PORT }));
    return;
  }

  const query = parseQuery(urlPath);

  // ── m3u8 proxy + ad filter ──
  if (urlPath.startsWith("/m3u8")) {
    const targetUrl = query.url;
    if (!targetUrl) {
      res.writeHead(400, { "Content-Type": "application/json", ...CORS_HEADERS });
      res.end(JSON.stringify({ error: "Missing ?url= parameter" }));
      return;
    }

    try {
      const result = await fetchAndFilterM3u8(targetUrl);

      if (result.error) {
        res.writeHead(502, { "Content-Type": "application/json", ...CORS_HEADERS });
        res.end(JSON.stringify({ error: result.error }));
        return;
      }

      res.writeHead(200, {
        "Content-Type": "application/vnd.apple.mpegurl",
        ...CORS_HEADERS,
        "Cache-Control": "no-cache",
      });
      res.end(result.clean, "utf-8");
    } catch (err) {
      res.writeHead(502, { "Content-Type": "application/json", ...CORS_HEADERS });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // ── Generic proxy (API requests) ──
  if (urlPath.startsWith("/proxy")) {
    const targetUrl = query.url;
    if (!targetUrl) {
      res.writeHead(400, { "Content-Type": "application/json", ...CORS_HEADERS });
      res.end(JSON.stringify({ error: "Missing ?url= parameter" }));
      return;
    }

    try {
      const result = await fetchTarget(targetUrl);
      const responseHeaders = {
        ...CORS_HEADERS,
        "Content-Type": result.isJson ? "application/json" : "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      };
      res.writeHead(result.status, responseHeaders);
      res.end(result.body);
    } catch (err) {
      res.writeHead(502, { "Content-Type": "application/json", ...CORS_HEADERS });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain", ...CORS_HEADERS });
  res.end("Not Found");
});

function startServer(port) {
  server.listen(port, () => {
    console.log("✅ CV 代理服务器已启动: http://localhost:" + port);
    console.log("   ─ API 代理:     /proxy?url=...");
    console.log("   ─ m3u8 过滤:   /m3u8?url=...");
    console.log("   ─ 健康检查:    /health");


  });
}

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    const nextPort = port + 1;
    if (nextPort > PORT + 10) {
      console.error("❌ 端口 " + PORT + "~" + (PORT + 10) + " 均被占用，无法启动代理");
      process.exit(1);
    }
    console.warn("⚠️  端口 " + port + " 被占用，尝试端口 " + nextPort + "...");
    port = nextPort;
    server.close();
    startServer(port);
  } else {
    console.error("❌ 代理服务器启动失败:", err.message);
    process.exit(1);
  }
});

let port = PORT;
startServer(port);
