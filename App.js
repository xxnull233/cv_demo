// Ensure expo-modules-core web globals (globalThis.expo) are registered early
// Required by expo-video on web platform
import "expo-modules-core";

import { Platform } from "react-native";
import { useEffect } from "react";

import { AppProviders } from "./src/context/AppProviders";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { SafeAreaProvider } from "react-native-safe-area-context";

// App 启动时清理残留的 hls 过滤缓存文件（防止闪退/强杀后残留）
async function cleanupHlsCache() {
  if (Platform.OS === "web") return;
  try {
    const { cacheDirectory, readDirectoryAsync, deleteAsync } = await import("expo-file-system");
    if (!cacheDirectory) return;
    const entries = await readDirectoryAsync(cacheDirectory);
    for (const entry of entries) {
      if (entry.startsWith("hls_filtered_")) {
        try { await deleteAsync(cacheDirectory + entry); } catch {}
      }
    }
  } catch {}
}

export default function App() {
  useEffect(() => { cleanupHlsCache(); }, []);

  return (
    <SafeAreaProvider>
    <ErrorBoundary>
    <AppProviders>
      <RootNavigator />
    </AppProviders>
    </ErrorBoundary>
    </SafeAreaProvider>
  );
}
