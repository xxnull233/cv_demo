import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";

import { usePlayer } from "../context/PlayerContext";

export function useOpenResult() {
  const navigation = useNavigation();
  const { openResult, detailLoading, detailError } = usePlayer();

  const openResultAndPlay = useCallback(
    async (result) => {
      const ok = await openResult(result);
      if (ok) {
        navigation.navigate("Player");
      }
    },
    [navigation, openResult]
  );

  return { openResult: openResultAndPlay, detailLoading, detailError };
}
