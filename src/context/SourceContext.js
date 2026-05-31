import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { STRATEGY_VALUES } from "../utils/m3u8Strategies";
import {
  loadAllSources,
  saveAllSources,
  importSourcesFromJson,
  importSourcesFromUrl,
  exportSources,
  migrateOldSources
} from "../storage";

const SourceContext = createContext(null);

function generateKey() {
  return Math.random().toString(36).substring(2, 10);
}

export function SourceProvider({ children }) {
  const [sources, setSources] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await migrateOldSources();
      const all = await loadAllSources();
      if (!cancelled) { setSources(all); setLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, []);

  const derived = useMemo(() => {
    const map = {};
    const entries = [];
    const keysForSearch = [];
    for (let i = 0; i < sources.length; i++) {
      const s = sources[i];
      map[s.key] = s;
      entries.push([s.key, s]);
      if (s.enabled) keysForSearch.push(s.key);
    }
    return { map, entries, keysForSearch };
  }, [sources]);

  async function toggleSource(sourceKey) {
    const next = sources.map(function(s) {
      if (s.key === sourceKey) { return { ...s, enabled: !s.enabled }; }
      return s;
    });
    await saveAllSources(next);
    setSources(next);
  }

  async function addSource(name, api, excludeClass, enabled, adStrategy) {
    const source = { key: generateKey(), name: String(name).trim(), api: String(api).trim(), excludeClass: typeof excludeClass === "string" ? excludeClass : "", enabled: enabled !== false, adStrategy: adStrategy || "" };
    const next = sources.concat([source]);
    await saveAllSources(next);
    setSources(next);
    return true;
  }

  async function editSource(key, updates) {
    const next = sources.map(function(s) {
      if (s.key === key) { return { ...s, name: String(updates.name || s.name).trim(), api: String(updates.api || s.api).trim(), excludeClass: typeof updates.excludeClass === "string" ? updates.excludeClass : s.excludeClass }; }
      return s;
    });
    await saveAllSources(next);
    setSources(next);
    return true;
  }

  async function deleteSource(key) {
    var next = sources.filter(function(s) { return s.key !== key; });
    await saveAllSources(next);
    setSources(next);
  }

  async function updateSourceStrategy(key, strategy) {
    if (!STRATEGY_VALUES.includes(strategy)) return;
    const next = sources.map(function(s) {
      if (s.key === key) { return { ...s, adStrategy: strategy }; }
      return s;
    });
    await saveAllSources(next);
    setSources(next);
  }

  async function importFromJson(jsonString) {
    const merged = importSourcesFromJson(jsonString, sources);
    await saveAllSources(merged);
    setSources(merged);
    return merged.length;
  }

  async function importFromUrl(url) {
    const merged = await importSourcesFromUrl(url, sources);
    await saveAllSources(merged);
    setSources(merged);
    return merged.length;
  }

  function exportToJson() {
    return exportSources(sources);
  }

  const value = {
    sources,
    loaded,
    sourceMap: derived.map,
    sourceEntries: derived.entries,
    sourceKeysForSearch: derived.keysForSearch,
    toggleSource,
    addSource,
    editSource,
    deleteSource,
    updateSourceStrategy,
    importFromJson,
    importFromUrl,
    exportToJson
  };

  return <SourceContext.Provider value={value}>{children}</SourceContext.Provider>;
}

export function useSources() {
  const context = useContext(SourceContext);
  if (!context) { throw new Error("useSources must be used within SourceProvider"); }
  return context;
}
