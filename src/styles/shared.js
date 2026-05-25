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
  resultTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22
  },

  resultMeta: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18
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
});
