import { createContext, useContext, useEffect, useState } from "react";

import { clearHistory, loadHistory, saveHistoryItem, updateHistoryProgress } from "../storage";

const HistoryContext = createContext(null);

export function HistoryProvider({ children }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let cancelled = false;
    loadHistory().then((data) => {
      if (!cancelled) setHistory(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function addHistoryItem(item) {
    const next = await saveHistoryItem(item);
    setHistory(next);
    return next;
  }

  async function updateProgress(id, sourceKey, progress) {
    const next = await updateHistoryProgress(id, sourceKey, progress);
    setHistory(next);
    return next;
  }

  async function clearAllHistory() {
    await clearHistory();
    setHistory([]);
  }

  return (
    <HistoryContext.Provider value={{ history, addHistoryItem, updateProgress, clearAllHistory }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistory must be used within HistoryProvider");
  }
  return context;
}
