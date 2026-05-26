import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";

import { usePlayer } from "../context/PlayerContext";

export function useOpenResult() {
  const navigation = useNavigation();
  const { openResult, detailLoading } = usePlayer();

  const openResultAndPlay = useCallback(
    async (result) => {
      const ok = await openResult(result);
      if (ok) {
        const root = navigation.getParent();
        if (root) {
          root.navigate("Player");
        } else {
          navigation.navigate("Player");
        }
      }
    },
    [navigation, openResult]
  );

  return { openResult: openResultAndPlay, detailLoading };
}
