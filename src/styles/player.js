import { StyleSheet } from "react-native";
import { EPISODE_GRID_GAP } from "../constants/player";

export const styles = StyleSheet.create({
  playerHeader: {

    height: 58,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 14,

    borderBottomWidth: 1,

    borderBottomColor: "#1f1f1f",

    backgroundColor: "#080808"

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

  headerTitle: {

    flex: 1,

    color: "#f8fafc",

    fontWeight: "800",

    fontSize: 16,

    marginLeft: 12

  },

  videoWrapper: {

    position: "relative",

    width: "100%"

  },

  videoWrapperFullscreen: {

    flex: 1

  },

  video: {

    width: "100%",

    aspectRatio: 16 / 9,

    backgroundColor: "#000"

  },

  videoFullscreen: {

    aspectRatio: undefined,

    flex: 1,

    width: "100%",

    height: "100%"

  },

  playerOverlay: {

    ...StyleSheet.absoluteFillObject,

    justifyContent: "center",

    alignItems: "center",

    backgroundColor: "rgba(0,0,0,0.6)",

    gap: 12

  },

  playerOverlayText: {

    color: "#d4d4d4",

    fontSize: 14,

    fontWeight: "600"

  },

  retryButton: {

    borderRadius: 8,

    borderWidth: 1,

    borderColor: "#38bdf8",

    paddingHorizontal: 20,

    paddingVertical: 10

  },

  retryButtonText: {

    color: "#38bdf8",

    fontWeight: "700",

    fontSize: 14

  },

  playerContent: {

    flex: 1,

    paddingHorizontal: 16,

    paddingTop: 16

  },

  nowPlaying: {

    color: "#f8fafc",

    fontSize: 20,

    fontWeight: "800",

    letterSpacing: 0.3

  },

  lineRow: {

    flexDirection: "row",

    flexWrap: "wrap",

    gap: 8,

    marginTop: 14

  },

  lineButton: {

    maxWidth: 120,

    borderRadius: 8,

    borderWidth: 1,

    borderColor: "#2a2a2a",

    backgroundColor: "#0f0f0f",

    paddingHorizontal: 14,

    paddingVertical: 9

  },

  lineButtonActive: {

    backgroundColor: "#38bdf8",

    borderColor: "#38bdf8"

  },

  lineButtonText: {

    color: "#d4d4d4",

    fontWeight: "800",

    fontSize: 13

  },

  lineButtonTextActive: {

    color: "#050505"

  },

  episodeGrid: {

    flexDirection: "row",

    flexWrap: "wrap",

    gap: EPISODE_GRID_GAP,

    marginTop: 18

  },

  episodeButton: {

    borderRadius: 8,

    paddingHorizontal: 12,

    paddingVertical: 10,

    borderWidth: 1,

    borderColor: "#2a2a2a",

    backgroundColor: "#0f0f0f"

  },

  episodeButtonActive: {

    backgroundColor: "#f8fafc",

    borderColor: "#f8fafc"

  },

  episodeButtonText: {

    color: "#d4d4d4",

    textAlign: "center",

    fontWeight: "700",

    fontSize: 13

  },

  episodeButtonTextActive: {

    color: "#050505"

  },

  detailBlock: {

    marginTop: 22,

    marginBottom: 36

  },

  sectionTitle: {

    color: "#f8fafc",

    fontSize: 18,

    fontWeight: "800",

    marginBottom: 8

  },

  description: {

    color: "#b5b5b5",

    lineHeight: 24,

    fontSize: 14

  },

});
