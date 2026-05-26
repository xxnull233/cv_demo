import { FavoritesProvider } from "./FavoritesContext";
import { HistoryProvider } from "./HistoryContext";
import { PlayerProvider } from "./PlayerContext";
import { SearchProvider } from "./SearchContext";
import { SourceProvider } from "./SourceContext";

export function AppProviders({ children }) {
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
