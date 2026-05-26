import { createContext, useContext, useMemo, useState } from "react";

import { searchManySources } from "../api/client";
import { useSources } from "./SourceContext";

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const { sourceMap, sourceKeysForSearch } = useSources();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const resultCountLabel = useMemo(
    () => (results.length > 0 ? `${results.length} 个结果` : ""),
    [results.length]
  );

  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setResults([]);
    try {
      const merged = await searchManySources(sourceKeysForSearch, trimmed, sourceMap);
      setResults(merged);
    } catch (error) {
      console.warn("Search error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        results,
        loading,
        resultCountLabel,
        handleSearch
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within SearchProvider");
  }
  return context;
}
