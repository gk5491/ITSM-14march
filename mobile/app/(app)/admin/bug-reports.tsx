import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "../../../src/api/client";
import { Card } from "../../../src/components/ui/Card";
import { Button } from "../../../src/components/ui/Button";
import { Badge } from "../../../src/components/ui/Badge";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { LoadingScreen } from "../../../src/components/ui/LoadingScreen";
import { colors } from "../../../src/utils/colors";
import { format } from "date-fns";

interface BugReport {
  id: number;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";
  reportedBy?: { id: number; name: string };
  createdAt: string;
  updatedAt?: string;
}

const fetchBugReports = async (): Promise<BugReport[]> => {
  const res = await apiClient.get("/api/project-bug-reports");
  return (res.data || []).map((report: any) => ({
    id: report.id,
    title: `Report #${report.id}`,
    description: report.comment || "",
    severity: report.resolution_status === "resolved" ? "low" : "high",
    status: report.resolution_status === "resolved" ? "resolved" : "open",
    reportedBy: report.created_by ? { id: report.created_by, name: `User #${report.created_by}` } : undefined,
    createdAt: report.created_at,
    updatedAt: report.updated_at,
  }));
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
  critical: "#dc2626",
};

const STATUS_COLORS: Record<string, string> = {
  open: "#3b82f6",
  in_progress: "#f59e0b",
  resolved: "#10b981",
  closed: "#6b7280",
};

export default function BugReportsScreen() {
  const queryClient = useQueryClient();
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);

  const { data: bugs, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["bug-reports"],
    queryFn: fetchBugReports,
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiClient.patch("/api/project-bug-reports", {
        id,
        resolution_status: status === "resolved" || status === "closed" ? "resolved" : "not-resolved",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bug-reports"] });
      setSelectedBug(null);
    },
    onError: () => Alert.alert("Error", "Failed to update bug report"),
  });

  const handleStatusChange = (bug: BugReport, newStatus: string) => {
    Alert.alert("Update Status", `Mark as "${newStatus.replace("_", " ")}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Update", onPress: () => updateMutation.mutate({ id: bug.id, status: newStatus }) },
    ]);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bug Review</Text>
      </View>

      {!bugs || bugs.length === 0 ? (
        <EmptyState
          icon="bug-outline"
          title="No bug reports"
          subtitle="Bug reports submitted by users will appear here"
        />
      ) : (
        <FlatList
          data={bugs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelectedBug(item)}>
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLORS[item.severity] || colors.textMuted }]} />
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + "20" }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                      {item.status.replace("_", " ")}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                <View style={styles.cardMeta}>
                  <View style={[styles.severityChip, { backgroundColor: SEVERITY_COLORS[item.severity] + "18" }]}>
                    <Text style={[styles.severityChipText, { color: SEVERITY_COLORS[item.severity] }]}>
                      {item.severity.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.metaText}>
                    {item.reportedBy ? `${item.reportedBy.name} · ` : ""}
                    {item.createdAt ? format(new Date(item.createdAt), "MMM d, yyyy") : ""}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={!!selectedBug} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedBug(null)}>
        {selectedBug && (
          <SafeAreaView style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedBug(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Bug Report #{selectedBug.id}</Text>
              <View style={{ width: 32 }} />
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalBugTitle}>{selectedBug.title}</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.severityChip, { backgroundColor: SEVERITY_COLORS[selectedBug.severity] + "18" }]}>
                  <Text style={[styles.severityChipText, { color: SEVERITY_COLORS[selectedBug.severity] }]}>
                    {selectedBug.severity.toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[selectedBug.status] + "20" }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[selectedBug.status] }]}>
                    {selectedBug.status.replace("_", " ")}
                  </Text>
                </View>
              </View>
              <Text style={styles.sectionLabel}>Description</Text>
              <Text style={styles.description}>{selectedBug.description}</Text>
              {selectedBug.reportedBy && (
                <>
                  <Text style={styles.sectionLabel}>Reported By</Text>
                  <Text style={styles.description}>{selectedBug.reportedBy.name}</Text>
                </>
              )}
              <Text style={styles.sectionLabel}>Change Status</Text>
              <View style={styles.statusActions}>
                {["open", "resolved"].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.actionBtn, selectedBug.status === s && styles.actionBtnActive, { borderColor: STATUS_COLORS[s] }]}
                    onPress={() => selectedBug.status !== s && handleStatusChange(selectedBug, s)}
                  >
                    <Text style={[styles.actionBtnText, { color: selectedBug.status === s ? "#fff" : STATUS_COLORS[s] }]}>
                      {s.replace("_", " ")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
  list: { padding: 16, paddingBottom: 32, gap: 12 },
  card: { padding: 14 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  severityDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: "700", color: colors.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "700" },
  cardDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  cardMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  severityChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  severityChipText: { fontSize: 10, fontWeight: "800" },
  metaText: { fontSize: 11, color: colors.textMuted },
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
  modalTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  modalContent: { padding: 20, gap: 8 },
  modalBugTitle: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 8 },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", marginTop: 12, marginBottom: 4 },
  description: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  statusActions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  actionBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionBtnText: { fontSize: 13, fontWeight: "700", textTransform: "capitalize" },
});
