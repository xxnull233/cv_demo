import { createContext, useContext, useEffect, useState } from "react";

import { FavoriteFolderModal } from "../components/FavoriteFolderModal";
import {
  addFavorite,
  createFavoriteFolder,
  deleteFavoriteFolder,
  findFavoriteFolderId,
  getDefaultFavorites,
  loadFavorites,
  loadLastFavoriteFolderId,
  removeFavorite
} from "../storage";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(getDefaultFavorites);
  const [lastFavoriteFolderId, setLastFavoriteFolderId] = useState("");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerVideo, setPickerVideo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadFavorites().then((data) => {
      if (!cancelled) setFavorites(data);
    });
    loadLastFavoriteFolderId().then((folderId) => {
      if (!cancelled) setLastFavoriteFolderId(folderId);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function checkIsFavorited(video) {
    return favorites.folders.some((folder) =>
      (folder.videos ?? []).some((v) => v.id === video.id && v.sourceKey === video.sourceKey)
    );
  }

  async function handleFavoritePress(video) {
    if (checkIsFavorited(video)) {
      const updated = await removeFavorite(video.id, video.sourceKey);
      setFavorites(updated);
      return;
    }

    if (favorites.folders.length === 0) {
      const created = await createFavoriteFolder("默认收藏夹");
      setFavorites(created);
    }

    setPickerVideo(video);
    setPickerVisible(true);
  }

  async function addToFolder(video, folderId) {
    const updated = await addFavorite(video, folderId);
    setFavorites(updated);
    setLastFavoriteFolderId(folderId);
    setPickerVisible(false);
    setPickerVideo(null);
  }

  function closePicker() {
    setPickerVisible(false);
    setPickerVideo(null);
  }

  async function createFolder(name) {
    const updated = await createFavoriteFolder(name);
    setFavorites(updated);
    return updated;
  }

  async function deleteFolder(folderId) {
    const updated = await deleteFavoriteFolder(folderId);
    setFavorites(updated);
    return updated;
  }

  async function removeFromFolder(videoId, sourceKey) {
    const updated = await removeFavorite(videoId, sourceKey);
    setFavorites(updated);
    return updated;
  }

  const value = {
    favorites,
    checkIsFavorited,
    handleFavoritePress,
    createFolder,
    deleteFolder,
    removeFromFolder
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      {pickerVisible && <FavoriteFolderModal
        visible={pickerVisible}
        video={pickerVideo}
        folders={favorites.folders}
        lastFolderId={lastFavoriteFolderId}
        currentFolderId={
          pickerVideo
            ? findFavoriteFolderId(favorites, pickerVideo.id, pickerVideo.sourceKey)
            : ""
        }
        onClose={closePicker}
        onSelectFolder={addToFolder}
        onCreateFolder={createFolder}
      />}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}


