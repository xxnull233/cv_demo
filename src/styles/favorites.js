import { Platform, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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
  headerSpacer: {
    width: 72
  },
  content: {
    flex: 1,
    backgroundColor: "#050505"
  },
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
  listContainer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 32
  },
  folderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#1f1f1f"
  },
  folderInfoPressable: {
    flex: 1
  },
  folderInfo: {
    flex: 1,
    paddingRight: 12
  },
  folderName: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4
  },
  folderCount: {
    color: "#8a8a8a",
    fontSize: 13
  },
  folderDeleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#271010"
  },
  folderDeleteText: {
    color: "#f87171",
    fontSize: 12,
    fontWeight: "600"
  },
  createButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#6366f1"
  },
  createButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700"
  },
  emptyContainer: {
    flex: 1,
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32
  },
  emptyText: {
    color: "#8a8a8a",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  card: {
    width: "33.333%",
    paddingHorizontal: 4,
    marginBottom: 14,
    ...(Platform.OS === "web" ? { boxSizing: "border-box" } : null)
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%"
  },
  cardImage: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 8,
    backgroundColor: "#1a1a1a"
  },
  cardOverlay: {
    position: "absolute",
    top: 6,
    right: 6
  },
  cardRemoveBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center"
  },
  cardRemoveText: {
    color: "#f87171",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16
  },
  cardTitle: {
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
    lineHeight: 16
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,5,5,0.7)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10
  },
  loadingText: {
    color: "#f8fafc",
    fontSize: 14,
    marginTop: 12
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#171717",
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a"
  },
  modalTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center"
  },
  modalInput: {
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#f8fafc",
    fontSize: 15,
    marginBottom: 16
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#222"
  },
  modalCancelText: {
    color: "#8a8a8a",
    fontSize: 14,
    fontWeight: "600"
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#6366f1"
  },
  modalBtnDisabled: {
    backgroundColor: "#333",
    opacity: 0.5
  },
  modalConfirmText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700"
  }
});
