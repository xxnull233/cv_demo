import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end"
  },
  modalSheet: {
    maxHeight: "78%",
    minHeight: "48%",
    backgroundColor: "#0b0b0b",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: "#242424",
    padding: 18
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14
  },
  modalTitle: {
    color: "#f8fafc",
    fontWeight: "800",
    fontSize: 20
  },
  closeText: {
    color: "#38bdf8",
    fontWeight: "800",
    fontSize: 15
  },
  settingsActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14
  },
  smallButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#121212",
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  smallButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "800"
  },
  sourceRow: {
    borderWidth: 1,
    borderColor: "#242424",
    backgroundColor: "#0f0f0f",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  sourceInfo: {
    flex: 1,
    minWidth: 0
  },
  sourceRowActive: {
    borderColor: "#38bdf8"
  },
  sourceName: {
    color: "#f8fafc",
    fontWeight: "800",
    marginBottom: 4,
    fontSize: 15
  },
  sourceUrl: {
    color: "#777",
    fontSize: 12,
    maxWidth: 250
  },
  sourceControls: {
    alignItems: "flex-end",
    gap: 8
  },
  sourceCheck: {
    fontWeight: "800",
    fontSize: 13,
    color: "#737373"
  },
  sourceCheckActive: {
    color: "#38bdf8"
  },
  sourceActionText: {
    color: "#d4d4d4",
    fontSize: 12,
    fontWeight: "800"
  },
  sourceDangerText: {
    color: "#fecaca",
    fontSize: 12,
    fontWeight: "800"
  },
  sourceForm: { borderWidth: 1, borderColor: "#242424", borderRadius: 12, padding: 14, marginTop: 14 },
  formTitle: {
    color: "#f8fafc",
    fontWeight: "800",
    marginBottom: 12,
    fontSize: 15
  },
  formInput: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#111",
    color: "#f8fafc",
    paddingHorizontal: 14,
    marginBottom: 10,
    fontSize: 14
  },
  formActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4
  },
  formButton: {
    flex: 1,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#121212",
    paddingVertical: 11
  },
  primaryButton: {
    backgroundColor: "#f8fafc",
    borderColor: "#f8fafc"
  },
  primaryButtonText: {
    color: "#050505",
    fontSize: 13,
    fontWeight: "800"
  },
  historyRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#202020",
    paddingVertical: 14,
    paddingHorizontal: 4
  },
  clearButton: {
    marginTop: 18,
    marginBottom: 28,
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
