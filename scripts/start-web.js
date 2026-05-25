import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function startProcess(command, args, label) {
  const proc = spawn(command, args, {
    stdio: "inherit",
    shell: true,
    cwd: root,
  });
  proc.on("error", (err) => console.error(`[${label}] Error:`, err.message));
  proc.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.log(`[${label}] Exited with code ${code}`);
    }
  });
  return proc;
}

const proxy = startProcess("node", ["scripts/proxy-server.mjs"], "proxy");

// Give the proxy a moment to bind, then start Expo
setTimeout(() => {
  startProcess("npx", ["expo", "start", "--web"], "expo");
}, 500);

function cleanup() {
  proxy.kill();
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
