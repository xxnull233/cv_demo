import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { Video, ResizeMode } from "expo-av";
import { Pressable, SafeAreaView, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useMemo } from "react";

import {
  EPISODE_GRID_GAP,
  EPISODE_MIN_WIDTH,
  PLAYBACK_RATES,
  PLAYER_HORIZONTAL_PADDING
} from "../constants/player";
import { styles as playerStyles } from "../styles/player";
import { styles as sharedStyles } from "../styles/shared";
const styles = { ...sharedStyles, ...playerStyles };

export function PlayerScreen({
  currentDetail,
  currentEpisodeIndex,
  playbackRate,
  onBack,
  onSelectEpisode,
  onSelectLine,
  onSetPlaybackRate,
  onFullscreenUpdate,
}) {
  const { width: windowWidth } = useWindowDimensions();
  const currentLineIndex = currentDetail.currentLineIndex || 0;
  const currentLine = currentDetail.lines?.[currentLineIndex];
  const episodes = currentLine?.episodes || currentDetail.episodes || [];
  const currentEpisode = episodes[currentEpisodeIndex];
  const lines = currentDetail.lines || [];

  const episodeButtonWidth = useMemo(() => {
    const availableWidth = Math.max(
      0,
      windowWidth - PLAYER_HORIZONTAL_PADDING * 2
    );
    const columns = Math.max(
      2,
      Math.floor((availableWidth + EPISODE_GRID_GAP) / (EPISODE_MIN_WIDTH + EPISODE_GRID_GAP))
    );
    return Math.floor(
      (availableWidth - EPISODE_GRID_GAP * (columns - 1)) / columns
    );
  }, [windowWidth]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" backgroundColor="#050505" translucent={false} />
      <View style={styles.playerHeader}>
        <Pressable style={styles.ghostButton} onPress={onBack}>
          <Text style={styles.ghostButtonText}>返回</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentDetail.title}
        </Text>
      </View>

      <Video
        key={currentEpisode?.url}
        source={{ uri: currentEpisode?.url }}
        style={styles.video}
        useNativeControls
        shouldPlay
        rate={playbackRate}
        resizeMode={ResizeMode.CONTAIN}
        onFullscreenUpdate={onFullscreenUpdate}
      />

      <ScrollView style={styles.playerContent}>
        <Text style={styles.nowPlaying} numberOfLines={2}>
          {currentEpisode?.title || `第 ${currentEpisodeIndex + 1} 集`}
        </Text>
        <Text style={styles.resultMeta}>
          {currentDetail.sourceName} · 共 {episodes.length} 集
        </Text>

        {lines.length > 1 && (
          <View style={styles.lineRow}>
            {lines.map((line, index) => (
              <Pressable
                key={`${line.name}-${index}`}
                style={[
                  styles.lineButton,
                  index === currentLineIndex && styles.lineButtonActive
                ]}
                onPress={() => onSelectLine(index)}
              >
                <Text
                  style={[
                    styles.lineButtonText,
                    index === currentLineIndex && styles.lineButtonTextActive
                  ]}
                  numberOfLines={1}
                >
                  {line.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.rateRow}>
          <Text style={styles.rateLabel}>倍速</Text>
          <View style={styles.rateButtons}>
            {PLAYBACK_RATES.map((rate) => (
              <Pressable
                key={rate}
                style={[
                  styles.rateButton,
                  playbackRate === rate && styles.rateButtonActive
                ]}
                onPress={() => onSetPlaybackRate(rate)}
              >
                <Text
                  style={[
                    styles.rateButtonText,
                    playbackRate === rate && styles.rateButtonTextActive
                  ]}
                >
                  {rate.toFixed(1)}x
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.episodeGrid}>
          {episodes.map((episode, index) => (
            <Pressable
              key={`${episode.url}-${index}`}
              style={[
                styles.episodeButton,
                { width: episodeButtonWidth },
                index === currentEpisodeIndex && styles.episodeButtonActive
              ]}
              onPress={() => onSelectEpisode(index)}
            >
              <Text
                style={[
                  styles.episodeButtonText,
                  index === currentEpisodeIndex && styles.episodeButtonTextActive
                ]}
                numberOfLines={1}
              >
                {episode.title || index + 1}
              </Text>
            </Pressable>
          ))}
        </View>

        {!!currentDetail.desc && (
          <View style={styles.detailBlock}>
            <Text style={styles.sectionTitle}>简介</Text>
            <Text style={styles.description}>{currentDetail.desc}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
