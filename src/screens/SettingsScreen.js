import { useState, useEffect } from "react";
import Toast from "react-native-toast-message";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import * as Clipboard from "expo-clipboard";
import { useSources } from "../context/SourceContext";

const EMPTY_FORM = { name: "", api: "", excludeClass: "" };

export function SettingsScreen() {
  const navigation = useNavigation();
  const {
    sourceEntries,
    toggleSource,
    addSource,
    editSource,
    deleteSource,
    importFromUrl,
    importFromJson,
    exportToJson
  } = useSources();

  const [editingKey, setEditingKey] = useState("");
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [importUrl, setImportUrl] = useState("");
  const [importJson, setImportJson] = useState("");
  const [importing, setImporting] = useState(false);
  const [showImportJson, setShowImportJson] = useState(false);
  const [showImportUrl, setShowImportUrl] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportJson, setExportJson] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(function () {
    return function () {
      setEditingKey("");
      setFormVisible(false);
      setForm(EMPTY_FORM);
      setImportUrl("");
      setImportJson("");
      setShowImportJson(false);
      setShowImportUrl(false);
      setShowExport(false);
      setExportJson("");
      setDeleteTarget(null);
    };
  }, []);

  function showToast(msg, type) {
    Toast.show({ type: type || "info", text1: msg, position: "bottom", visibilityTime: 3000 });
  }

  function startAdd() {
    setEditingKey("");
    setForm(EMPTY_FORM);
    setFormVisible(true);
  }

  function startEdit(key, site) {
    setEditingKey(key);
    setForm({
      name: site.name || "",
      api: site.api || "",
      excludeClass: typeof site.excludeClass === "string" ? site.excludeClass : ""
    });
    setFormVisible(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.api.trim()) return;
    if (editingKey) {
      await editSource(editingKey, {
        name: form.name,
        api: form.api,
        excludeClass: form.excludeClass || ""
      });
    } else {
      await addSource(
        form.name,
        form.api,
        form.excludeClass || ""
      );
    }
    setEditingKey("");
    setFormVisible(false);
    setForm(EMPTY_FORM);
  }

  function updateForm(field, value) {
    setForm(function (current) {
      var next = {};
      for (var k in current) next[k] = current[k];
      next[field] = value;
      return next;
    });
  }

  async function handleImportUrl() {
    var url = importUrl.trim();
    if (!url) return;
    setImporting(true);
    try {
      var count = await importFromUrl(url);
      showToast("成功导入 " + count + " 个源", "success");
      setImportUrl("");
      setShowImportUrl(false);
    } catch (e) {
      showToast("导入失败: " + e.message, "error");
    } finally {
      setImporting(false);
    }
  }

  async function handleImportJson() {
    var json = importJson.trim();
    if (!json) return;
    try {
      var count = await importFromJson(json);
      showToast("成功导入 " + count + " 个源", "success");
      setImportJson("");
      setShowImportJson(false);
    } catch (e) {
      showToast("导入失败: " + e.message, "error");
    }
  }

  function handleExport() {
    setExportJson(exportToJson());
    setShowExport(true);
  }

  function closeModal() {
    setFormVisible(false);
    setShowImportUrl(false);
    setShowImportJson(false);
    setShowExport(false);
    setExportJson("");
    setImportUrl("");
    setImportJson("");
    setDeleteTarget(null);
    setEditingKey("");
    setForm(EMPTY_FORM);
  }

  var isModalVisible = formVisible || showImportUrl || showImportJson || showExport || deleteTarget;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" backgroundColor="#050505" translucent={false} />
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Text style={styles.iconButtonText}>返回</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>数据源设置</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.actionBar}>
        <Pressable style={styles.actionBtn} onPress={startAdd}>
          <Text style={styles.actionBtnText}>+ 添加</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={function () { setShowImportUrl(true); }}>
          <Text style={styles.actionBtnText}>网络导入</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={function () { setShowImportJson(true); }}>
          <Text style={styles.actionBtnText}>粘贴导入</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={handleExport}>
          <Text style={styles.actionBtnText}>导出</Text>
        </Pressable>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.listContent}>
        {sourceEntries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无数据源</Text>
            <Text style={styles.emptySubtext}>点击上方"添加"新增数据源</Text>
          </View>
        ) : (
          sourceEntries.map(function (entry) {
            var key = entry[0];
            var site = entry[1];
            var active = site.enabled;
            return (
              <View key={key} style={[styles.sourceRow, active && styles.sourceRowActive]}>
                <Pressable style={styles.sourceInfo} onPress={function () { toggleSource(key); }}>
                  <View style={styles.sourceNameRow}>
                    <Text style={styles.sourceName}>{site.name}</Text>
                    <View style={[styles.badge, active ? styles.badgeOn : styles.badgeOff]}>
                      <Text style={[styles.badgeText, active ? styles.badgeTextOn : styles.badgeTextOff]}>
                        {active ? "启用" : "关闭"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.sourceUrl} numberOfLines={1}>{site.api}</Text>
                  {site.excludeClass && (
                    <Text style={styles.sourceExclude} numberOfLines={1}>
                      排除分类: {site.excludeClass}
                    </Text>
                  )}
                </Pressable>
                <View style={styles.sourceControls}>
                  <Pressable style={styles.sourceActionBtn} onPress={function () { startEdit(key, site); }}>
                    <Text style={styles.sourceActionText}>编辑</Text>
                  </Pressable>
                  <Pressable style={styles.sourceDangerBtn} onPress={function () { setDeleteTarget({ key: key, name: site.name }); }}>
                    <Text style={styles.sourceDangerText}>删除</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* 居中弹窗 */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <Pressable style={styles.modalContent}>
            {formVisible && (
              <>
                <Text style={styles.modalTitle}>{editingKey ? "编辑源" : "添加源"}</Text>
                <TextInput
                  value={form.name}
                  onChangeText={function (v) { updateForm("name", v); }}
                  placeholder="站点名称"
                  placeholderTextColor="#737373"
                  style={styles.formInput}
                />
                <TextInput
                  value={form.api}
                  onChangeText={function (v) { updateForm("api", v); }}
                  placeholder="API 地址"
                  placeholderTextColor="#737373"
                  autoCapitalize="none"
                  style={styles.formInput}
                />
                <TextInput
                  value={form.excludeClass}
                  onChangeText={function (v) { updateForm("excludeClass", v); }}
                  placeholder="排除分类 ID（逗号分隔）"
                  placeholderTextColor="#737373"
                  autoCapitalize="none"
                  style={styles.formInput}
                />
                <View style={styles.panelActions}>
                  <Pressable style={styles.panelCancelBtn} onPress={closeModal}>
                    <Text style={styles.panelCancelText}>取消</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.panelConfirmBtn, (!form.name.trim() || !form.api.trim()) && styles.panelBtnDisabled]}
                    onPress={handleSave}
                    disabled={!form.name.trim() || !form.api.trim()}
                  >
                    <Text style={styles.panelConfirmText}>保存</Text>
                  </Pressable>
                </View>
              </>
            )}

            {showImportUrl && (
              <>
                <Text style={styles.modalTitle}>从网络导入</Text>
                <TextInput
                  value={importUrl}
                  onChangeText={setImportUrl}
                  placeholder="输入 JSON 远程地址"
                  placeholderTextColor="#737373"
                  autoCapitalize="none"
                  multiline
                  style={styles.formInput}
                />
                <View style={styles.panelActions}>
                  <Pressable style={styles.panelCancelBtn} onPress={closeModal}>
                    <Text style={styles.panelCancelText}>取消</Text>
                  </Pressable>
                  <Pressable style={styles.panelConfirmBtn} onPress={handleImportUrl} disabled={importing}>
                    {importing ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <ActivityIndicator size="small" color="#050505" />
                        <Text style={styles.panelConfirmText}>导入中...</Text>
                      </View>
                    ) : (
                      <Text style={styles.panelConfirmText}>导入</Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}

            {showExport && (
              <>
                <Text style={styles.modalTitle}>导出数据源</Text>
                <TextInput
                  value={exportJson}
                  editable={false}
                  multiline
                  style={[styles.formInput, { minHeight: 120, maxHeight: 300 }]} scrollEnabled
                />
                <View style={styles.panelActions}>
                  <Pressable style={styles.panelCancelBtn} onPress={closeModal}>
                    <Text style={styles.panelCancelText}>取消</Text>
                  </Pressable>
                  <Pressable
                    style={styles.panelConfirmBtn}
                    onPress={async function () {
                      await Clipboard.setStringAsync(exportJson);
                      showToast("已复制到剪贴板", "success");
                    }}
                  >
                    <Text style={styles.panelConfirmText}>复制</Text>
                  </Pressable>
                </View>
              </>
            )}

            {showImportJson && (
              <>
                <Text style={styles.modalTitle}>粘贴 JSON 导入</Text>
                <TextInput
                  value={importJson}
                  onChangeText={setImportJson}
                  placeholder="粘贴源列表 JSON"
                  placeholderTextColor="#737373"
                  autoCapitalize="none"
                  multiline
                  style={[styles.formInput, { minHeight: 120, maxHeight: 300 }]} scrollEnabled
                />
                <View style={styles.panelActions}>
                  <Pressable style={styles.panelCancelBtn} onPress={closeModal}>
                    <Text style={styles.panelCancelText}>取消</Text>
                  </Pressable>
                  <Pressable style={styles.panelConfirmBtn} onPress={handleImportJson}>
                    <Text style={styles.panelConfirmText}>导入</Text>
                  </Pressable>
                </View>
              </>
            )}

            {deleteTarget && (
              <>
                <Text style={styles.modalTitle}>确认删除</Text>
                <Text style={styles.confirmText}>
                  确定要删除数据源「{deleteTarget.name}」吗？此操作不可撤销。
                </Text>
                <View style={styles.panelActions}>
                  <Pressable style={styles.panelCancelBtn} onPress={closeModal}>
                    <Text style={styles.panelCancelText}>取消</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.panelConfirmBtn, styles.panelDangerBtn]}
                    onPress={async function () {
                      var target = deleteTarget;
                      setDeleteTarget(null);
                      await deleteSource(target.key);
                    }}
                  >
                    <Text style={styles.panelDangerText}>确认删除</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  content: { flex: 1 },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 32
  },
  actionBar: {
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a"
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#2a2a2a"
  },
  actionBtnText: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "600"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#171717",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    maxHeight: "80%"
  },
  modalTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center"
  },
  sourceRow: {
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
  sourceRowActive: {
    borderColor: "#38bdf8"
  },
  sourceInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12
  },
  sourceNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4
  },
  sourceName: {
    color: "#f8fafc",
    fontWeight: "700",
    fontSize: 15
  },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeOn: { backgroundColor: "#0a2a1a" },
  badgeOff: { backgroundColor: "#1a1a1a" },
  badgeText: { fontSize: 10, fontWeight: "700" },
  badgeTextOn: { color: "#4ade80" },
  badgeTextOff: { color: "#737373" },
  sourceUrl: { color: "#777", fontSize: 12, maxWidth: 280 },
  sourceExclude: { color: "#a07840", fontSize: 11, marginTop: 2 },
  sourceControls: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center"
  },
  sourceActionBtn: {
    backgroundColor: "#1c2a3a",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  sourceActionText: {
    color: "#7bbfff",
    fontSize: 12,
    fontWeight: "700"
  },
  sourceDangerBtn: {
    backgroundColor: "#2a1212",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  sourceDangerText: {
    color: "#ff9b9b",
    fontSize: 12,
    fontWeight: "700"
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 32
  },
  emptyText: {
    color: "#8a8a8a",
    fontSize: 16,
    fontWeight: "600"
  },
  emptySubtext: {
    color: "#5f5f5f",
    fontSize: 13,
    marginTop: 8
  },
  formInput: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#111",
    color: "#f8fafc",
    paddingHorizontal: 14,
    marginBottom: 8,
    fontSize: 14
  },
  panelActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2
  },
  panelCancelBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#121212"
  },
  panelCancelText: {
    color: "#8a8a8a",
    fontSize: 13,
    fontWeight: "700"
  },
  panelConfirmBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: "#f8fafc"
  },
  panelConfirmText: {
    color: "#050505",
    fontSize: 13,
    fontWeight: "800"
  },
  panelDangerBtn: { backgroundColor: "#5a1a1a" },
  panelDangerText: {
    color: "#ff9b9b",
    fontSize: 13,
    fontWeight: "800"
  },
  panelBtnDisabled: {
    backgroundColor: "#333",
    opacity: 0.5
  },
  confirmText: {
    color: "#a0a0a0",
    fontSize: 14,
    marginBottom: 14,
    lineHeight: 20
  }
});