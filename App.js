// Ensure expo-modules-core web globals (globalThis.expo) are registered early
// Required by expo-video on web platform
import "expo-modules-core";

import { Platform } from "react-native";
import { useEffect } from "react";

import { AppProviders } from "./src/context/AppProviders";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

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
  useEffect(() => {
    cleanupHlsCache();
    if (Platform.OS === "ios") {
      import("expo-video-cache").then(({ startServer }) => {
        startServer().catch((err) => {
          Toast.show({
            type: "error",
            text1: "视频缓存服务启动失败",
            text2: "播放不受影响，但加载速度可能变慢",
            visibilityTime: 4000,
            position: "bottom"
          });
        });
      });
    }
  }, []);

  return (
    <SafeAreaProvider>
    <ErrorBoundary>
    <AppProviders>
      <RootNavigator />
    </AppProviders>
    </ErrorBoundary>
    <Toast />
    </SafeAreaProvider>
  );
}

