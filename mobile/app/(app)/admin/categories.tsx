import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { categoriesAdminApi } from "../../../src/api/categories-admin";
import { Category } from "../../../src/api/tickets";
import { Card } from "../../../src/components/ui/Card";
import { Button } from "../../../src/components/ui/Button";
import { Input } from "../../../src/components/ui/Input";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { LoadingScreen } from "../../../src/components/ui/LoadingScreen";
import { colors } from "../../../src/utils/colors";

function CategoryFormModal({
  visible,
  onClose,
  editCategory,
  categories,
}: {
  visible: boolean;
  onClose: () => void;
  editCategory: Category | null;
  categories: Category[];
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(editCategory?.name || "");

  React.useEffect(() => {
    setName(editCategory?.name || "");
  }, [editCategory, visible]);

  const createMutation = useMutation({
    mutationFn: () => categoriesAdminApi.create({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onClose();
    },
    onError: () => Alert.alert("Error", "Failed to create category"),
  });

  const updateMutation = useMutation({
    mutationFn: () => categoriesAdminApi.update(editCategory!.id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onClose();
    },
    onError: () => Alert.alert("Error", "Failed to update category"),
  });

  const handleSave = () => {
    if (!name.trim()) return Alert.alert("Validation", "Category name is required");
    if (editCategory) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{editCategory ? "Edit Category" : "New Category"}</Text>
          <TouchableOpacity onPress={handleSave} disabled={isLoading}>
            <Text style={[styles.saveText, isLoading && styles.saveTextDisabled]}>
              {isLoading ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.form}>
          <Text style={styles.label}>Category Name</Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. Hardware, Software, Network"
            autoFocus
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default function CategoriesScreen() {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  const { data: categories, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesAdminApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesAdminApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
    onError: () => Alert.alert("Error", "Failed to delete category. It may be in use by tickets."),
  });

  const handleDelete = (cat: Category) => {
    Alert.alert("Delete Category", `Delete "${cat.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(cat.id) },
    ]);
  };

  const openCreate = () => {
    setEditCategory(null);
    setModalVisible(true);
  };

  const openEdit = (cat: Category) => {
    setEditCategory(cat);
    setModalVisible(true);
  };

  if (isLoading) return <LoadingScreen />;

  const topLevel = (categories || []).filter((c) => !c.parentId);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {topLevel.length === 0 ? (
        <EmptyState
          icon="pricetag-outline"
          title="No categories yet"
          subtitle="Create categories to help organize tickets"
          actionLabel="Create Category"
          onAction={openCreate}
        />
      ) : (
        <FlatList
          data={topLevel}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          renderItem={({ item }) => {
            const subs = (categories || []).filter((c) => c.parentId === item.id);
            return (
              <Card style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="pricetag" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    {subs.length > 0 && (
                      <Text style={styles.cardSub}>{subs.length} subcategory{subs.length > 1 ? "ies" : "y"}</Text>
                    )}
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => openEdit(item)}>
                      <Ionicons name="pencil-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => handleDelete(item)}>
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
                {subs.map((sub) => (
                  <View key={sub.id} style={styles.subRow}>
                    <Ionicons name="return-down-forward-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.subName}>{sub.name}</Text>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity style={styles.actionIcon} onPress={() => openEdit(sub)}>
                      <Ionicons name="pencil-outline" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIcon} onPress={() => handleDelete(sub)}>
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </Card>
            );
          }}
        />
      )}

      <CategoryFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        editCategory={editCategory}
        categories={categories || []}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  list: { padding: 16, paddingBottom: 32, gap: 10 },
  card: { padding: 14 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: "700", color: colors.text },
  cardSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  actions: { flexDirection: "row", gap: 4 },
  actionIcon: { padding: 6 },
  subRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, paddingLeft: 16 },
  subName: { fontSize: 13, color: colors.textSecondary },
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  cancelText: { fontSize: 15, color: colors.textMuted },
  saveText: { fontSize: 15, fontWeight: "700", color: colors.primary },
  saveTextDisabled: { opacity: 0.5 },
  form: { padding: 20, gap: 8 },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 4 },
});
