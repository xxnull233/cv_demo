import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505"
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a"
  },
  headerSpacer: {
    flex: 1
  },

  ghostButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#111"
  },
  ghostButtonText: {
    color: "#f8fafc",
    fontWeight: "700",
    fontSize: 13
  },

  // ── 源切换标签 ──
  sourceTabScroll: {
    maxWidth: 360,
    flexGrow: 1
  },
  sourceTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 6
  },
  sourceTabActive: { backgroundColor: "#f8fafc" },
  sourceTabInactive: { backgroundColor: "#1a1a1a" },
  sourceTabText: { fontSize: 12 },
  sourceTabTextActive: { color: "#050505", fontWeight: "700" },
  sourceTabTextInactive: { color: "#a0a0a0", fontWeight: "500" },

  // ── 分类标签 ──
  categoryBar: {
    height: 36,
    justifyContent: "center",
    marginLeft: 16,
    marginTop: 4,
    marginBottom: 2
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8
  },
  categoryTabActive: { backgroundColor: "#f8fafc" },
  categoryTabInactive: { backgroundColor: "#1a1a1a" },
  categoryTabText: { fontSize: 14 },
  categoryTabTextActive: { color: "#050505", fontWeight: "700" },
  categoryTabTextInactive: { color: "#a0a0a0", fontWeight: "500" },

  // ── 错误状态 ──
  errorRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13
  },
  retryBtn: {
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#38bdf8"
  },
  retryText: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "600"
  },

  // ── 空/加载状态 ──
  emptyInfoText: {
    color: "#8a8a8a",
    fontSize: 13
  },
  loadingText: {
    color: "#8a8a8a",
    fontSize: 13,
    marginTop: 10
  },

  // ── FlatList footer ──
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center"
  },
  footerEnd: {
    paddingVertical: 16,
    alignItems: "center"
  },
  footerEndText: {
    color: "#5f5f5f",
    fontSize: 12
  },

  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 32
  },

  centerState: {
    flex: 1,
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32
  },
  centerTitle: {
    color: "#a0a0a0",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8
  },
  centerText: {
    color: "#8a8a8a",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,5,5,0.7)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10
  },
  overlayText: {
    color: "#f8fafc",
    fontSize: 14,
    marginTop: 12
  }
});
