import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { API_SITES } from "../api/sites";
import {
  loadCustomSources,
  loadSelectedSources,
  saveCustomSources,
  saveSelectedSources
} from "../storage";

const SOURCE_ENTRIES = Object.entries(API_SITES);
const SourceContext = createContext(null);

export function SourceProvider({ children }) {
  const [selectedSources, setSelectedSources] = useState([]);
  const [customSources, setCustomSources] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadSelectedSources(), loadCustomSources()]).then(([selected, custom]) => {
      if (!cancelled) {
        setSelectedSources(selected);
        setCustomSources(custom);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const sourceMap = useMemo(() => {
    const map = { ...API_SITES };
    for (const cs of customSources) {
      map[cs.key] = cs;
    }
    return map;
  }, [customSources]);

  const sourceEntries = useMemo(
    () => [...SOURCE_ENTRIES, ...customSources.map((cs) => [cs.key, cs])],
    [customSources]
  );

  const sourceKeysForSearch = useMemo(
    () => [...selectedSources, ...customSources.map((cs) => cs.key)],
    [selectedSources, customSources]
  );

  async function toggleSource(sourceKey) {
    const next = selectedSources.includes(sourceKey)
      ? selectedSources.filter((key) => key !== sourceKey)
      : [...selectedSources, sourceKey];
    setSelectedSources(next);
    await saveSelectedSources(next);
  }

  async function selectAllSources() {
    const allKeys = [...SOURCE_ENTRIES.map(([key]) => key), ...customSources.map((cs) => cs.key)];
    setSelectedSources(allKeys);
    await saveSelectedSources(allKeys);
  }

  async function resetDefaultSources() {
    const defaultKeys = SOURCE_ENTRIES.map(([key]) => key);
    setSelectedSources(defaultKeys);
    await saveSelectedSources(defaultKeys);
  }

  async function saveCustomSource(source, editingKey) {
    const isApiDuplicate = [...SOURCE_ENTRIES, ...customSources].some(
      ([k, s]) => (!editingKey || k !== editingKey) && s.api === source.api
    );
    if (isApiDuplicate) {
      alert("该 API 地址已存在，请勿重复添加");
      return false;
    }

    const key = editingKey || Math.random().toString(36).substring(2, 10);
    const newSource = { ...source, key, isCustom: true };

    let updated;
    if (editingKey) {
      updated = customSources.map((cs) => (cs.key === editingKey ? newSource : cs));
    } else {
      updated = [...customSources, newSource];
    }

    setCustomSources(updated);
    await saveCustomSources(updated);

    if (!editingKey && !selectedSources.includes(key)) {
      const newSelected = [...selectedSources, key];
      setSelectedSources(newSelected);
      await saveSelectedSources(newSelected);
    }
    return true;
  }

  async function deleteCustomSource(key) {
    const updated = customSources.filter((cs) => cs.key !== key);
    setCustomSources(updated);
    await saveCustomSources(updated);
    if (selectedSources.includes(key)) {
      const newSelected = selectedSources.filter((k) => k !== key);
      setSelectedSources(newSelected);
      await saveSelectedSources(newSelected);
    }
  }

  const value = {
    selectedSources,
    customSources,
    sourceMap,
    sourceEntries,
    sourceKeysForSearch,
    toggleSource,
    selectAllSources,
    resetDefaultSources,
    saveCustomSource,
    deleteCustomSource
  };

  return <SourceContext.Provider value={value}>{children}</SourceContext.Provider>;
}

export function useSources() {
  const context = useContext(SourceContext);
  if (!context) {
    throw new Error("useSources must be used within SourceProvider");
  }
  return context;
}
