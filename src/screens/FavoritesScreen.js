import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

import { styles as favStyles } from '../styles/favorites';
import { styles as sharedStyles } from '../styles/shared';
import { useFavorites } from '../context/FavoritesContext';
import { useOpenResult } from '../hooks/useOpenResult';

const styles = { ...sharedStyles, ...favStyles };

const EMPTY_PLACEHOLDER = 'https://via.placeholder.com/300x400/1a1a2e/737373?text=无封';

export function FavoritesScreen() {
  const navigation = useNavigation();
  const { favorites, createFolder, deleteFolder, removeFromFolder } = useFavorites();
  const { openResult, detailLoading } = useOpenResult();
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const activeFolder = activeFolderId
    ? favorites.folders.find((f) => f.id === activeFolderId)
    : null;
  const activeVideos = activeFolder?.videos ?? [];

  const handleCreateFolder = useCallback(() => {
    const name = newFolderName.trim();
    if (!name) return;
    setCreateLoading(true);
    createFolder(name).then((updated) => {
      const created = updated.folders[updated.folders.length - 1];
      if (created) setActiveFolderId(created.id);
      setCreateLoading(false);
      setNewFolderName('');
      setShowCreateModal(false);
    });
  }, [newFolderName, createFolder]);

  const handleDeleteFolder = useCallback(
    (folderId) => {
      deleteFolder(folderId).then(() => {
        if (activeFolderId === folderId) setActiveFolderId(null);
      });
    },
    [activeFolderId, deleteFolder]
  );

  const handleRemoveFavorite = useCallback(
    (video) => {
      removeFromFolder(video.id, video.sourceKey);
    },
    [removeFromFolder]
  );

  function renderFolderList() {
    if (favorites.folders.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无收藏夹</Text>
          <Pressable style={styles.createButton} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.createButtonText}>新建收藏夹</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.listContainer}>
        {favorites.folders.map((folder) => (
          <View key={folder.id} style={styles.folderItem}>
            <Pressable
              style={styles.folderInfoPressable}
              onPress={() => setActiveFolderId(folder.id)}
            >
              <View style={styles.folderInfo}>
                <Text style={styles.folderName}>{folder.name}</Text>
                <Text style={styles.folderCount}>
                  {(folder.videos ?? []).length} 部视频
                </Text>
              </View>
            </Pressable>
            {folder.id !== 'default0' && (
            <Pressable
              style={styles.folderDeleteBtn}
              onPress={() => handleDeleteFolder(folder.id)}
            >
              <Text style={styles.folderDeleteText}>删除</Text>
            </Pressable>
            )}
          </View>
        ))}
      </ScrollView>
    );
  }

  function renderFolderVideos() {
    if (!activeFolder || activeVideos.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无收藏视频</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content} contentContainerStyle={styles.listContainer}>
        <View style={styles.cardGrid}>
          {activeVideos.map((item) => (
            <View key={`${item.sourceKey}-${item.id}`} style={styles.card}>
              <Pressable onPress={() => openResult(item)}>
                <Image
                  source={{ uri: item.poster || EMPTY_PLACEHOLDER }}
                  style={styles.cardImage}
                  resizeMode='cover'
                />
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title || '未知视频'}
                </Text>
              </Pressable>
              <View style={styles.cardOverlay}>
                <Pressable
                  style={styles.cardRemoveBtn}
                  onPress={() => handleRemoveFavorite(item)}
                >
                  <Text style={styles.cardRemoveText}>✔</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style='light' backgroundColor='#050505' translucent={false} />
      <View style={styles.header}>
        <Pressable
          style={styles.iconButton}
          onPress={activeFolderId ? () => setActiveFolderId(null) : () => navigation.goBack()}
        >
          <Text style={styles.iconButtonText}>返回</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {activeFolderId ? (activeFolder?.name || '收藏夹') : '收藏夹'}
        </Text>
        {!activeFolderId ? (
          <Pressable style={styles.iconButton} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.iconButtonText}>+ 新建</Text>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <View style={styles.content}>
        {activeFolderId ? renderFolderVideos() : renderFolderList()}
      </View>

      <Modal visible={showCreateModal} transparent animationType='fade'>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>新建收藏夹</Text>
            <TextInput
              style={styles.modalInput}
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder='输入收藏夹名称'
              placeholderTextColor='#737373'
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewFolderName('');
                }}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmBtn, (!newFolderName.trim() || createLoading) && styles.modalBtnDisabled]}
                onPress={handleCreateFolder}
                disabled={!newFolderName.trim() || createLoading}
              >
                {createLoading ? (
                  <ActivityIndicator size='small' color='#fff' />
                ) : (
                  <Text style={styles.modalConfirmText}>确定</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {detailLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size='large' color='#e11d48' />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

