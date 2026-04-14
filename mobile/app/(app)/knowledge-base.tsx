import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { knowledgeBaseApi, FAQ } from "../../src/api/knowledge-base";
import { ticketsApi } from "../../src/api/tickets";
import { Card } from "../../src/components/ui/Card";
import { LoadingScreen } from "../../src/components/ui/LoadingScreen";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { colors } from "../../src/utils/colors";

export default function KnowledgeBaseScreen() {
  const [search, setSearch] = useState("");
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();

  const { data: faqs, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["faqs", search, selectedCategory],
    queryFn: () => knowledgeBaseApi.getFaqs({ search: search || undefined, categoryId: selectedCategory }),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: ticketsApi.getCategories,
  });

  const filtered = faqs || [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Knowledge Base</Text>
        <Text style={styles.headerSub}>Find answers to common questions</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search articles..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {categories && categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryList}>
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(undefined)}
          >
            <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(selectedCategory === cat.id ? undefined : cat.id)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat.id && styles.categoryChipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {isLoading ? (
        <LoadingScreen />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="help-circle-outline"
          title="No articles found"
          subtitle={search ? "Try a different search term" : "No knowledge base articles yet"}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelectedFaq(item)}>
              <Card style={styles.faqCard}>
                <View style={styles.faqHeader}>
                  <Ionicons name="help-circle-outline" size={20} color={colors.primary} style={styles.faqIcon} />
                  <Text style={styles.question} numberOfLines={2}>{item.question}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </View>
                {item.category && (
                  <View style={styles.faqMeta}>
                    <Text style={styles.categoryTag}>{item.category.name}</Text>
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={!!selectedFaq} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedFaq(null)}>
        {selectedFaq && (
          <SafeAreaView style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedFaq(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Article</Text>
              <View style={{ width: 32 }} />
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.questionBadge}>
                <Ionicons name="help-circle" size={16} color={colors.primary} />
                <Text style={styles.questionBadgeText}>Question</Text>
              </View>
              <Text style={styles.modalQuestion}>{selectedFaq.question}</Text>
              <View style={styles.divider} />
              <View style={styles.answerBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.answerBadgeText}>Answer</Text>
              </View>
              <Text style={styles.modalAnswer}>{selectedFaq.answer}</Text>
              {selectedFaq.category && (
                <View style={styles.modalCategoryTag}>
                  <Ionicons name="pricetag-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.modalCategoryText}>{selectedFaq.category.name}</Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: colors.text },
  categoryScroll: { maxHeight: 44 },
  categoryList: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryChipText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  categoryChipTextActive: { color: "#fff" },
  list: { padding: 16, paddingTop: 12, paddingBottom: 32, gap: 10 },
  faqCard: { padding: 14 },
  faqHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  faqIcon: { flexShrink: 0 },
  question: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.text, lineHeight: 20 },
  faqMeta: { marginTop: 8, paddingLeft: 30 },
  categoryTag: { fontSize: 11, color: colors.primary, fontWeight: "600" },
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeBtn: { padding: 4 },
  modalTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  modalContent: { padding: 20, gap: 12 },
  questionBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  questionBadgeText: { fontSize: 12, fontWeight: "700", color: colors.primary, textTransform: "uppercase" },
  modalQuestion: { fontSize: 18, fontWeight: "700", color: colors.text, lineHeight: 26 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  answerBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  answerBadgeText: { fontSize: 12, fontWeight: "700", color: colors.success, textTransform: "uppercase" },
  modalAnswer: { fontSize: 15, color: colors.textSecondary, lineHeight: 24 },
  modalCategoryTag: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  modalCategoryText: { fontSize: 12, color: colors.textMuted },
});
