import { createContext, useContext, useMemo, useRef, useState } from "react";
import { Keyboard } from "react-native";

import { searchManySources } from "../api/client";
import { useSources } from "./SourceContext";

const SearchContext = createContext(null);

// 搜索结果缓存（query -> results, 5 分钟 TTL, 20 条上限）
const SEARCH_CACHE_TTL = 5 * 60 * 1000;
const SEARCH_CACHE_MAX = 20;

export function SearchProvider({ children }) {
  const { sourceMap, sourceKeysForSearch } = useSources();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchedOnce, setSearchedOnce] = useState(false);
  const searchIdRef = useRef(0);
  const searchTimerRef = useRef(null);
  const searchCacheRef = useRef(null);

  const resultCountLabel = useMemo(
    () => (results.length > 0 ? `${results.length} 个结果` : ""),
    [results.length]
  );

  function getSearchCache(trimmed) {
    const cache = searchCacheRef.current;
    if (!cache) return null;
    const entry = cache[trimmed];
    if (entry && Date.now() - entry.timestamp < SEARCH_CACHE_TTL) {
      return entry.results;
    }
    return null;
  }

  function setSearchCache(trimmed, results) {
    let cache = searchCacheRef.current;
    if (!cache) { cache = {}; searchCacheRef.current = cache; }
    cache[trimmed] = { results, timestamp: Date.now() };
    const keys = Object.keys(cache);
    if (keys.length > SEARCH_CACHE_MAX) {
      delete cache[keys[0]];
    }
  }

  async function handleSearch() {
    if (loading) return;
    const trimmed = query.trim();
    if (!trimmed) return;

    // 防抖：清除尚未执行的搜索请求
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }

    Keyboard.dismiss();

    // 检查缓存
    const cached = getSearchCache(trimmed);
    if (cached) {
      setResults(cached);
      setSearchedOnce(true);
      return;
    }

    const currentId = ++searchIdRef.current;
    setLoading(true);
    setResults([]);
    setSearchError("");
    try {
      const merged = await searchManySources(sourceKeysForSearch, trimmed, sourceMap);
      if (currentId !== searchIdRef.current) return;
      if (merged.length === 0) {
        setSearchError("未找到相关结果");
      }
      setResults(merged);
      setSearchCache(trimmed, merged);
      setSearchedOnce(true);
    } catch (error) {
      if (currentId !== searchIdRef.current) return;
      setSearchError(error.message || "搜索请求失败");
    } finally {
      if (currentId === searchIdRef.current) {
        setLoading(false);
      }
    }
  }

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        results,
        loading,
        searchError,
        searchedOnce,
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

