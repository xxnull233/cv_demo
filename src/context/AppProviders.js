import { useEffect } from "react";
import { cacheDirectory, readDirectoryAsync, deleteAsync } from "expo-file-system";
import { FavoritesProvider } from "./FavoritesContext";
import { HistoryProvider } from "./HistoryContext";
import { PlayerProvider } from "./PlayerContext";
import { SearchProvider } from "./SearchContext";
import { SourceProvider } from "./SourceContext";

export function AppProviders({ children }) {
  // 启动时清理残留的 m3u8 过滤缓存文件
  useEffect(() => {
    (async () => {
      try {
        if (!cacheDirectory) return;
        const files = await readDirectoryAsync(cacheDirectory);
        const staleFiles = files.filter(function(f) { return f.startsWith("hls_filtered_"); });
        for (const file of staleFiles) {
          try { await deleteAsync(cacheDirectory + file); } catch {}
        }
      } catch {}
    })();
  }, []);

  return (
    <SourceProvider>
      <HistoryProvider>
        <FavoritesProvider>
          <PlayerProvider>
            <SearchProvider>{children}</SearchProvider>
          </PlayerProvider>
        </FavoritesProvider>
      </HistoryProvider>
    </SourceProvider>
  );
}
