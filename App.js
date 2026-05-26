// Ensure expo-modules-core web globals (globalThis.expo) are registered early
// Required by expo-video on web platform
import "expo-modules-core";

import { Platform } from "react-native";
import { useEffect } from "react";

import { AppProviders } from "./src/context/AppProviders";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { ErrorBoundary } from "./src/components/ErrorBoundary";

// App 启动时清理残留的 hls 过滤缓存文件（防止闪退/强杀后残留）
async function cleanupHlsCache() {
  if (Platform.OS === "web") return;
  try {
    const { File, Paths } = await import("expo-file-system");
    const cacheDir = Paths.cache;
    if (!cacheDir.exists) return;
    const entries = cacheDir.list();
    for (const entry of entries) {
      if (entry instanceof File && entry.name?.startsWith("hls_filtered_")) {
        try { entry.delete(); } catch {}
      }
    }
  } catch {}
}

export default function App() {
  useEffect(() => { cleanupHlsCache(); }, []);

  return (
    <ErrorBoundary>
    <AppProviders>
      <RootNavigator />
    </AppProviders>
    </ErrorBoundary>
  );
}
