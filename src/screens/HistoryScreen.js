import { useCallback } from "react";
import {
  Pressable,  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

import { useHistory } from "../context/HistoryContext";
import { useOpenResult } from "../hooks/useOpenResult";

export function HistoryScreen() {
  const navigation = useNavigation();
  const { history, clearAllHistory } = useHistory();
  const { openResult, detailLoading } = useOpenResult();

  async function handleOpen(item) {
    await openResult(item);
  }

  async function handleClear() {
    await clearAllHistory();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" backgroundColor="#050505" translucent={false} />
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Text style={styles.iconButtonText}>返回</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>观看历史</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.content}>
        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无历史记录</Text>
          </View>
        ) : (
          <View style={styles.historyWrapper}>
            <ScrollView contentContainerStyle={styles.listContent}>
              {history.map((item) => (
                <Pressable
                  key={`${item.sourceKey}-${item.id}`}
                  style={styles.historyRow}
                  onPress={() => handleOpen(item)}
                >
                  <Text style={styles.historyTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {item.sourceName}
                    {item.lineName ? " · " + item.lineName : ""}
                    {" · "}
                    {item.episodeTitle || (item.episodeCount ? item.episodeCount + " 集" : "")}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>清空历史</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505"
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a"
  },
  headerTitle: {
    flex: 1,
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginHorizontal: 8
  },
  headerSpacer: { width: 72 },
  iconButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#0f0f0f"
  },
  iconButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5
  },
  content: { flex: 1 },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 32
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32
  },
  emptyText: {
    color: "#8a8a8a",
    fontSize: 16,
    fontWeight: "600"
  },
  historyWrapper: {
    flex: 1
  },
  historyRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#202020",
    paddingVertical: 14,
    paddingHorizontal: 4
  },
  historyTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4
  },
  historyMeta: {
    color: "#9ca3af",
    fontSize: 13
  },
  clearButton: {
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 24,
    borderRadius: 10,
    paddingVertical: 14,
    backgroundColor: "#2a1212",
    borderWidth: 1,
    borderColor: "#5a2020"
  },
  clearButtonText: {
    color: "#fecaca",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 14
  }
});
