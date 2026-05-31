import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  brand: {

    color: "#f8fafc",

    fontSize: 32,

    fontWeight: "900",

    letterSpacing: 1

  },

  subtitle: {

    color: "#8a8a8a",

    marginTop: 4,

    fontSize: 12,

    letterSpacing: 0.3

  },

  headerActions: {

    flexDirection: "row",

    gap: 8

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

  searchPanel: {

    marginHorizontal: 18,

    flexDirection: "row",

    gap: 10,

    marginTop: 16,

    marginBottom: 8

  },

  searchInput: {

    flex: 1,

    height: 46,

    color: "#fff",

    backgroundColor: "#111",

    borderRadius: 10,

    borderWidth: 1,

    borderColor: "#2a2a2a",

    paddingHorizontal: 14,

    fontSize: 15

  },

  searchButton: {

    width: 80,

    backgroundColor: "#f8fafc",

    borderRadius: 10,

    alignItems: "center",

    justifyContent: "center"

  },

  searchButtonText: {

    color: "#050505",

    fontWeight: "800",

    fontSize: 14,

    letterSpacing: 0.5

  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 18,
    marginTop: 4,
    marginBottom: 6
  },

  statusText: {

    color: "#8a8a8a",

    fontSize: 12,

    fontWeight: "600"

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

    fontWeight: "700",

    marginTop: 12

  },

  loadingText: {
    color: "#8a8a8a",
    fontSize: 13,
    marginTop: 10
  },

  footerLoader: {
    paddingVertical: 20,
    alignItems: "center"
  },

});
