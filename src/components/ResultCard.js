import { Image, Pressable, Text, View } from "react-native";
import { styles } from "../styles/result-card";

export function ResultCard({ item, onOpen }) {
  return (
    <Pressable style={styles.resultCard} onPress={() => onOpen(item)}>
      {item.poster ? (
        <Image source={{ uri: item.poster }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.posterFallback]}>
          <Text style={styles.posterFallbackText}>LibreTV</Text>
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
  );
}
