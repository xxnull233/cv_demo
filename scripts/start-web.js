import { spawn, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const PROXY_PORT = parseInt(process.env.PROXY_PORT || "19001", 10);

// ─── 清理上次残留的代理进程 ─────────────────────────────────────

function killProcessOnPort(port) {
  try {
    const stdout = execSync(
      'netstat -ano | findstr ":' + port + '" | findstr LISTENING',
      { encoding: "utf8", timeout: 3000 }
    );
    const lines = stdout.trim().split("\n");
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(parseInt(pid))) {
        try {
          execSync("taskkill /PID " + pid + " /F", { timeout: 2000 });
          console.log("  ✓ 已清理端口 " + port + " 上的旧进程 (PID " + pid + ")");
        } catch {}
      }
    }
  } catch {
    // 端口未被占用或 netstat 查询失败，忽略
  }
}

// ─── 进程启动 ────────────────────────────────────────────────────

function startProcess(command, args, label, env) {
  const proc = spawn(command, args, {
    stdio: "inherit",
    shell: true,
    cwd: root,
    env: { ...process.env, ...env },
  });
  proc.on("error", (err) => console.error("[" + label + "] Error:", err.message));
  proc.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.log("[" + label + "] Exited with code " + code);
    }
  });
  return proc;
}

// ─── 主流程 ───────────────────────────────────────────────────────

// 先释放端口，再启动代理
killProcessOnPort(PROXY_PORT);

const proxy = startProcess(
  "node",
  ["scripts/proxy-server.mjs"],
  "proxy",
  { PROXY_PORT: String(PROXY_PORT) }
);

// 等待代理就绪后启动 Expo
setTimeout(function () {
  startProcess("npx", ["expo", "start", "--web"], "expo", {});
}, 800);

function cleanup() {
  proxy.kill();
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
