import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";

import { styles } from "../styles/modal";

export function FavoriteFolderModal({
  visible,
  video,
  folders,
  lastFolderId,
  currentFolderId,
  onClose,
  onSelectFolder,
  onCreateFolder
}) {
  const [creating, setCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCreating(false);
      setNewFolderName("");
      setSubmitting(false);
    }
  }, [visible]);

  async function handleSelect(folderId) {
    if (!video || submitting) return;
    setSubmitting(true);
    try {
      await onSelectFolder(video, folderId);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreate() {
    const name = newFolderName.trim();
    if (!name || !video || submitting) return;
    setSubmitting(true);
    try {
      const updated = await onCreateFolder(name);
      const created = updated.folders[updated.folders.length - 1];
      if (created) {
        await onSelectFolder(video, created.id);
      }
    } finally {
      setSubmitting(false);
      setCreating(false);
      setNewFolderName("");
    }
  }

  const suggestedFolderId =
    currentFolderId ||
    (folders.some((folder) => folder.id === lastFolderId) ? lastFolderId : folders[0]?.id || "");

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>选择收藏夹</Text>
            <Pressable onPress={onClose} disabled={submitting}>
              <Text style={styles.closeText}>取消</Text>
            </Pressable>
          </View>

          {!!video?.title && (
            <Text style={styles.favoriteVideoTitle} numberOfLines={2}>
              {video.title}
            </Text>
          )}

          <ScrollView keyboardShouldPersistTaps="handled">
            {folders.map((folder) => {
              const isSuggested = folder.id === suggestedFolderId;
              const isCurrent = folder.id === currentFolderId;
              return (
                <Pressable
                  key={folder.id}
                  style={[
                    styles.sourceRow,
                    (isSuggested || isCurrent) && styles.sourceRowActive
                  ]}
                  onPress={() => handleSelect(folder.id)}
                  disabled={submitting}
                >
                  <View style={styles.sourceInfo}>
                    <Text style={styles.sourceName}>{folder.name}</Text>
                    <Text style={styles.sourceUrl}>
                      {(folder.videos ?? []).length} 部视频
                      {isCurrent ? " · 当前所在" : isSuggested ? " · 上次使用" : ""}
                    </Text>
                  </View>
                  <Text style={[styles.sourceCheck, (isSuggested || isCurrent) && styles.sourceCheckActive]}>
                    {isCurrent ? "●" : "›"}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {!creating ? (
            <Pressable style={styles.smallButton} onPress={() => setCreating(true)} disabled={submitting}>
              <Text style={styles.smallButtonText}>+ 新建收藏夹</Text>
            </Pressable>
          ) : (
            <View style={styles.sourceForm}>
              <Text style={styles.formTitle}>新建收藏夹</Text>
              <TextInput
                style={styles.formInput}
                value={newFolderName}
                onChangeText={setNewFolderName}
                placeholder="输入收藏夹名称"
                placeholderTextColor="#737373"
                autoFocus
              />
              <View style={styles.formActions}>
                <Pressable
                  style={styles.formButton}
                  onPress={() => {
                    setCreating(false);
                    setNewFolderName("");
                  }}
                  disabled={submitting}
                >
                  <Text style={styles.smallButtonText}>返回</Text>
                </Pressable>
                <Pressable
                  style={[styles.formButton, styles.primaryButton]}
                  onPress={handleCreate}
                  disabled={!newFolderName.trim() || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#050505" />
                  ) : (
                    <Text style={styles.primaryButtonText}>创建并收藏</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
