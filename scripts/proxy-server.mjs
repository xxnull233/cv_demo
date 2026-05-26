/**
 * CV 本地代理服务器
 * 用于 web 调试时绕过 CORS 限制，将请求转发到采集站 API
 * 
 * 启动方式: node scripts/proxy-server.mjs
 * 默认端口: 19001
 * 
 * 请求格式:
 *   GET /proxy?url=https://target.api/...   → 代理 JSON/文本请求
 *   GET /health                              → 健康检查
 */

import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

const PORT = parseInt(process.env.PROXY_PORT || "19001", 10);

// CORS 头，允许 web 端跨域请求
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

// 默认转发请求头
const DEFAULT_HEADERS = {
  "Accept": "application/json,text/plain,*/*",
  "User-Agent": "CV-Proxy/0.1.0",
};

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
      reject(new Error(`Request timed out after ${timeout}ms`));
    });
    req.end();
  });
}

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

const server = http.createServer(async (req, res) => {
  // 处理 OPTIONS 预检请求
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const urlPath = req.url || "/";

  // 健康检查
  if (urlPath === "/health") {
    res.writeHead(200, { "Content-Type": "application/json", ...CORS_HEADERS });
    res.end(JSON.stringify({ status: "ok", port: PORT }));
    return;
  }

  // 代理请求
  if (urlPath.startsWith("/proxy")) {
    const query = parseQuery(urlPath);
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
      console.error(`[proxy] Error fetching ${targetUrl}:`, err.message);
      res.writeHead(502, { "Content-Type": "application/json", ...CORS_HEADERS });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 404
  res.writeHead(404, { "Content-Type": "text/plain", ...CORS_HEADERS });
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`✅ CV 代理服务器已启动: http://localhost:${PORT}`);
  console.log(`   ─ 代理请求: http://localhost:${PORT}/proxy?url=<encoded_target_url>`);
  console.log(`   ─ 健康检查: http://localhost:${PORT}/health`);
  console.log(`   按 Ctrl+C 停止`);
});

server.on("error", (err) => {
  console.error("❌ 代理服务器启动失败:", err.message);
  process.exit(1);
});
