import { Image, Pressable, Text, View } from "react-native";
import { APP_NAME } from "../constants/app";
import { styles } from "../styles/result-card";

export function ResultCard({ item, onOpen, onFavorite, isFavorited }) {
  return (
    <View style={styles.resultCard}>
      <Pressable style={styles.resultCardPressable} onPress={() => onOpen(item)}>
        {item.poster ? (
          <Image source={{ uri: item.poster }} style={styles.poster} />
        ) : (
          <View style={[styles.poster, styles.posterFallback]}>
            <Text style={styles.posterFallbackText}>{APP_NAME}</Text>
          </View>
        )}
        <View style={styles.resultBody}>
          <Text style={styles.resultTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.resultMeta} numberOfLines={1}>
            {item.sourceName} {item.remarks ? ` · ${item.remarks}` : ""}
          </Text>
          <Text style={styles.resultType} numberOfLines={1}>
            {item.type || "视频资源"}
          </Text>
        </View>
      </Pressable>
      <View style={styles.favButtonWrapper}>
        {onFavorite && (
          <Pressable
            style={[styles.favButton, isFavorited && styles.favButtonActive]}
            onPress={() => onFavorite(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.favButtonText, isFavorited && styles.favButtonTextActive]}>
              {isFavorited ? "♥" : "♡"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
