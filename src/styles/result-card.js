import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  resultCard: {
    minHeight: 124,
    borderRadius: 10,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#1f1f1f",
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3
  },
  poster: {
    width: 86,
    minHeight: 124,
    backgroundColor: "#0a0a0a",
    resizeMode: "cover"
  },
  posterFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#121212"
  },
  posterFallbackText: {
    color: "#5f5f5f",
    fontSize: 12,
    fontWeight: "700"
  },
  resultBody: {
    flex: 1,
    padding: 14,
    justifyContent: "center"
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

  resultType: {
    color: "#38bdf8",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6
  },
});
