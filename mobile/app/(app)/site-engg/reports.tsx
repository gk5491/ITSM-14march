import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { siteEnggApi } from "../../../src/api/site-engg";
import { Card } from "../../../src/components/ui/Card";
import { Button } from "../../../src/components/ui/Button";
import { Input } from "../../../src/components/ui/Input";
import { Select } from "../../../src/components/ui/Select";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { LoadingScreen } from "../../../src/components/ui/LoadingScreen";
import { colors } from "../../../src/utils/colors";
import { format } from "date-fns";

function NewReportModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [workSummary, setWorkSummary] = useState("");
  const [hoursWorked, setHoursWorked] = useState("8");
  const [clientId, setClientId] = useState<number | undefined>();

  const { data: clients } = useQuery({
    queryKey: ["site-engg-clients"],
    queryFn: siteEnggApi.getClients,
  });

  const clientOptions = [
    { label: "No Client", value: "" },
    ...(clients || []).map((c: any) => ({ label: c.name || c.companyName, value: c.id })),
  ];

  const mutation = useMutation({
    mutationFn: siteEnggApi.submitReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-engg-reports"] });
      Alert.alert("Success", "Report submitted successfully!");
      setWorkSummary("");
      setHoursWorked("8");
      setClientId(undefined);
      onClose();
    },
    onError: (e: any) => Alert.alert("Error", e?.response?.data?.message || "Failed to submit report"),
  });

  const handleSubmit = () => {
    if (!workSummary.trim() || workSummary.length < 20) {
      Alert.alert("Error", "Please provide a detailed work summary (at least 20 characters)");
      return;
    }
    mutation.mutate({
      reportDate: new Date().toISOString().split("T")[0],
      workSummary: workSummary.trim(),
      hoursWorked: Number(hoursWorked) || 8,
      clientId,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Submit Daily Report</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.dateInfo}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.dateText}>{format(new Date(), "EEEE, MMMM d, yyyy")}</Text>
            </View>

            <Input
              label="Work Summary *"
              value={workSummary}
              onChangeText={setWorkSummary}
              placeholder="Describe the work done today in detail..."
              multiline
              numberOfLines={6}
            />

            <Input
              label="Hours Worked"
              value={hoursWorked}
              onChangeText={setHoursWorked}
              keyboardType="numeric"
              placeholder="8"
            />

            {clientOptions.length > 1 && (
              <Select
                label="Client (Optional)"
                value={clientId}
                onValueChange={(v) => setClientId(Number(v) || undefined)}
                options={clientOptions}
                placeholder="Select client..."
              />
            )}

            <Button
              title="Submit Report"
              onPress={handleSubmit}
              loading={mutation.isPending}
              size="lg"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

export default function ReportsScreen() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const { data: reports, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["site-engg-reports"],
    queryFn: () => siteEnggApi.getReports(),
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Reports</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={reports || []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportDate}>
                {format(new Date(item.reportDate), "EEE, MMM d, yyyy")}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.success + "20" }]}>
                <Text style={[styles.statusText, { color: colors.success }]}>SUBMITTED</Text>
              </View>
            </View>
            {item.clientName && (
              <View style={styles.clientRow}>
                <Ionicons name="business-outline" size={13} color={colors.textMuted} />
                <Text style={styles.clientName}>{item.clientName}</Text>
              </View>
            )}
            <Text style={styles.summary} numberOfLines={3}>
              {item.workSummary}
            </Text>
            {item.hoursWorked && (
              <View style={styles.hoursRow}>
                <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                <Text style={styles.hoursText}>{item.hoursWorked} hours</Text>
              </View>
            )}
          </Card>
        )}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="No reports yet"
            message="Submit your first daily report"
          />
        }
      />

      <View style={styles.fab}>
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <NewReportModal visible={showModal} onClose={() => setShowModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  addBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, padding: 6 },
  list: { padding: 16, paddingBottom: 80 },
  reportCard: { marginBottom: 10 },
  reportHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  reportDate: { fontSize: 14, fontWeight: "700", color: colors.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "800" },
  clientRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  clientName: { fontSize: 13, color: colors.textSecondary },
  summary: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 8 },
  hoursRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  hoursText: { fontSize: 13, color: colors.textMuted },
  fab: { position: "absolute", bottom: 20, right: 20 },
  fabBtn: {
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  modalContent: { padding: 20, paddingBottom: 40 },
  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary + "10",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  dateText: { fontSize: 14, fontWeight: "600", color: colors.primary },
});
