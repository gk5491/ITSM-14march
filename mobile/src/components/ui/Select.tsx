import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../utils/colors";

interface Option {
  label: string;
  value: string | number;
}

interface SelectProps {
  label?: string;
  value: string | number | undefined;
  onValueChange: (value: string | number) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
}

export function Select({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Select option...",
  error,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[styles.select, !!error && styles.errorBorder]}
        activeOpacity={0.8}
      >
        <Text style={[styles.selectText, !selected && styles.placeholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{label || "Select"}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onValueChange(item.value);
                    setOpen(false);
                  }}
                  style={[
                    styles.option,
                    item.value === value && styles.optionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.optionSelectedText,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
  },
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorBorder: { borderColor: colors.danger },
  selectText: { fontSize: 15, color: colors.text, flex: 1 },
  placeholder: { color: colors.textMuted },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: "100%",
    maxHeight: "60%",
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "50",
  },
  optionSelected: { backgroundColor: colors.primary + "10" },
  optionText: { fontSize: 15, color: colors.text },
  optionSelectedText: { color: colors.primary, fontWeight: "600" },
});
