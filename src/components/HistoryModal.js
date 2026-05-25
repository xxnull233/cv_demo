import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { styles as modalStyles } from "../styles/modal";
import { styles as sharedStyles } from "../styles/shared";
const styles = { ...sharedStyles, ...modalStyles };

export function HistoryModal({ visible, history, onClose, onClear, onOpen }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>观看历史</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeText}>关闭</Text>
            </Pressable>
          </View>
          {history.length === 0 ? (
            <View style={styles.centerState}>
              <Text style={styles.centerText}>暂无历史记录</Text>
            </View>
          ) : (
            <ScrollView>
              {history.map((item) => (
                <Pressable
                  key={`${item.sourceKey}-${item.id}`}
                  style={styles.historyRow}
                  onPress={() => onOpen(item)}
                >
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.resultMeta}>
                    {item.sourceName}
                    {item.lineName ? ` · ${item.lineName}` : ""}
                    {" · "}
                    {item.episodeTitle || `${item.episodeCount || 0} 集`}
                  </Text>
                </Pressable>
              ))}
              <Pressable style={styles.clearButton} onPress={onClear}>
                <Text style={styles.clearButtonText}>清空历史</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
