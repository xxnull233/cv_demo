import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { styles } from "../styles/modal";

const EMPTY_FORM = {
  name: "",
  api: "",
  detail: ""
};

export function SettingsModal({
  visible,
  selectedSources,
  sourceEntries,
  onClose,
  onToggle,
  onSelectAll,
  onResetDefault,
  onSaveCustomSource,
  onDeleteCustomSource
}) {
  const [editingKey, setEditingKey] = useState("");
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!visible) {
      setEditingKey("");
      setFormVisible(false);
      setForm(EMPTY_FORM);
    }
  }, [visible]);

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
      detail: site.detail || ""
    });
    setFormVisible(true);
  }

  async function handleSave() {
    const saved = await onSaveCustomSource(form, editingKey);
    if (!saved) return;
    setEditingKey("");
    setFormVisible(false);
    setForm(EMPTY_FORM);
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>数据源设置</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeText}>完成</Text>
            </Pressable>
          </View>
          <View style={styles.settingsActions}>
            <Pressable style={styles.smallButton} onPress={startAdd}>
              <Text style={styles.smallButtonText}>添加源</Text>
            </Pressable>
            <Pressable style={styles.smallButton} onPress={onSelectAll}>
              <Text style={styles.smallButtonText}>全选</Text>
            </Pressable>
            <Pressable style={styles.smallButton} onPress={onResetDefault}>
              <Text style={styles.smallButtonText}>默认</Text>
            </Pressable>
          </View>
          <ScrollView>
            {sourceEntries.map(([key, site]) => {
              const active = selectedSources.includes(key);
              return (
                <View
                  key={key}
                  style={[styles.sourceRow, active && styles.sourceRowActive]}
                >
                  <Pressable style={styles.sourceInfo} onPress={() => onToggle(key)}>
                    <Text style={styles.sourceName}>{site.name}</Text>
                    <Text style={styles.sourceUrl} numberOfLines={1}>
                      {site.api}
                    </Text>
                    {!!site.detail && (
                      <Text style={styles.sourceUrl} numberOfLines={1}>
                        {site.detail}
                      </Text>
                    )}
                  </Pressable>
                  <View style={styles.sourceControls}>
                    <Pressable onPress={() => onToggle(key)}>
                      <Text style={[styles.sourceCheck, active && styles.sourceCheckActive]}>
                        {active ? "开启" : "关闭"}
                      </Text>
                    </Pressable>
                    {site.isCustom && (
                      <>
                        <Pressable onPress={() => startEdit(key, site)}>
                          <Text style={styles.sourceActionText}>编辑</Text>
                        </Pressable>
                        <Pressable onPress={() => onDeleteCustomSource(key)}>
                          <Text style={styles.sourceDangerText}>删除</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {formVisible && (
            <View style={styles.sourceForm}>
              <Text style={styles.formTitle}>{editingKey ? "编辑自定义源" : "添加自定义源"}</Text>
              <TextInput
                value={form.name}
                onChangeText={(value) => updateForm("name", value)}
                placeholder="站点名称"
                placeholderTextColor="#737373"
                style={styles.formInput}
              />
              <TextInput
                value={form.api}
                onChangeText={(value) => updateForm("api", value)}
                placeholder="API 地址，例如 https://example.com/api.php/provide/vod"
                placeholderTextColor="#737373"
                autoCapitalize="none"
                style={styles.formInput}
              />
              <TextInput
                value={form.detail}
                onChangeText={(value) => updateForm("detail", value)}
                placeholder="详情站地址，可选"
                placeholderTextColor="#737373"
                autoCapitalize="none"
                style={styles.formInput}
              />
              <View style={styles.formActions}>
                <Pressable
                  style={[styles.smallButton, styles.formButton]}
                  onPress={() => {
                    setEditingKey("");
                    setFormVisible(false);
                    setForm(EMPTY_FORM);
                  }}
                >
                  <Text style={styles.smallButtonText}>取消</Text>
                </Pressable>
                <Pressable
                  style={[styles.smallButton, styles.formButton, styles.primaryButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.primaryButtonText}>保存</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
