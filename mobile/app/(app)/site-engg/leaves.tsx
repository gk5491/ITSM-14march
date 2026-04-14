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
import { useAuth } from "../../../src/context/AuthContext";
import { siteEnggApi, LeaveRequest } from "../../../src/api/site-engg";
import { Card } from "../../../src/components/ui/Card";
import { Button } from "../../../src/components/ui/Button";
import { Input } from "../../../src/components/ui/Input";
import { Select } from "../../../src/components/ui/Select";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { LoadingScreen } from "../../../src/components/ui/LoadingScreen";
import { colors } from "../../../src/utils/colors";
import { format } from "date-fns";

const LEAVE_TYPES = [
  { label: "Sick Leave", value: "sick" },
  { label: "Casual Leave", value: "casual" },
  { label: "Earned Leave", value: "earned" },
  { label: "Emergency Leave", value: "emergency" },
  { label: "Other", value: "other" },
];

const getLeaveStatusColor = (status: string) => {
  switch (status) {
    case "approved": return colors.success;
    case "rejected": return colors.danger;
    default: return colors.warning;
  }
};

function ApplyLeaveModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [leaveType, setLeaveType] = useState("sick");

  const mutation = useMutation({
    mutationFn: siteEnggApi.submitLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-engg-leaves"] });
      Alert.alert("Success", "Leave application submitted!");
      setStartDate(""); setEndDate(""); setReason(""); setLeaveType("sick");
      onClose();
    },
    onError: (e: any) => Alert.alert("Error", e?.response?.data?.message || "Failed to submit leave"),
  });

  const handleSubmit = () => {
    if (!startDate || !endDate || !reason.trim()) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      Alert.alert("Error", "End date must be after start date");
      return;
    }
    mutation.mutate({ startDate, endDate, reason: reason.trim(), leaveType });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Apply for Leave</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Select
              label="Leave Type"
              value={leaveType}
              onValueChange={(v) => setLeaveType(String(v))}
              options={LEAVE_TYPES}
            />
            <Input
              label="Start Date (YYYY-MM-DD)"
              value={startDate}
              onChangeText={setStartDate}
              placeholder="e.g. 2024-12-25"
              keyboardType="default"
            />
            <Input
              label="End Date (YYYY-MM-DD)"
              value={endDate}
              onChangeText={setEndDate}
              placeholder="e.g. 2024-12-27"
              keyboardType="default"
            />
            <Input
              label="Reason *"
              value={reason}
              onChangeText={setReason}
              placeholder="Explain the reason for your leave..."
              multiline
              numberOfLines={4}
            />
            <Button
              title="Submit Application"
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

export default function LeavesScreen() {
  const router = useRouter();
  const { isHR, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: leaves, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["site-engg-leaves"],
    queryFn: () => siteEnggApi.getLeaves(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "approved" | "rejected" }) =>
      siteEnggApi.updateLeaveStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["site-engg-leaves"] }),
    onError: () => Alert.alert("Error", "Failed to update leave status"),
  });

  const handleApprove = (id: number, name: string) => {
    Alert.alert("Approve Leave", `Approve leave for ${name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Approve", onPress: () => updateMutation.mutate({ id, status: "approved" }) },
    ]);
  };

  const handleReject = (id: number, name: string) => {
    Alert.alert("Reject Leave", `Reject leave for ${name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: () => updateMutation.mutate({ id, status: "rejected" }) },
    ]);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Management</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={leaves || []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const statusColor = getLeaveStatusColor(item.status);
          return (
            <Card style={styles.leaveCard}>
              <View style={styles.leaveHeader}>
                <View>
                  {item.engineerName && (
                    <Text style={styles.engineerName}>{item.engineerName}</Text>
                  )}
                  <Text style={styles.leaveType}>
                    {LEAVE_TYPES.find((t) => t.value === item.leaveType)?.label || item.leaveType}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.datesRow}>
                <View style={styles.dateBlock}>
                  <Text style={styles.dateLabel}>From</Text>
                  <Text style={styles.dateValue}>
                    {format(new Date(item.startDate), "MMM d, yyyy")}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
                <View style={styles.dateBlock}>
                  <Text style={styles.dateLabel}>To</Text>
                  <Text style={styles.dateValue}>
                    {format(new Date(item.endDate), "MMM d, yyyy")}
                  </Text>
                </View>
              </View>

              <Text style={styles.reason}>{item.reason}</Text>

              {(isHR || isAdmin) && item.status === "pending" && (
                <View style={styles.actions}>
                  <Button
                    title="Approve"
                    size="sm"
                    onPress={() => handleApprove(item.id, item.engineerName || "Engineer")}
                    style={[styles.actionBtn, { backgroundColor: colors.success }]}
                  />
                  <Button
                    title="Reject"
                    variant="danger"
                    size="sm"
                    onPress={() => handleReject(item.id, item.engineerName || "Engineer")}
                    style={styles.actionBtn}
                  />
                </View>
              )}
            </Card>
          );
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="No leave requests"
            message="Apply for a leave to get started"
          />
        }
      />

      <ApplyLeaveModal visible={showModal} onClose={() => setShowModal(false)} />
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
  list: { padding: 16, paddingBottom: 20 },
  leaveCard: { marginBottom: 10 },
  leaveHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  engineerName: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 2 },
  leaveType: { fontSize: 13, color: colors.textSecondary, fontWeight: "500" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: "800" },
  datesRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  dateBlock: {},
  dateLabel: { fontSize: 11, color: colors.textMuted },
  dateValue: { fontSize: 14, fontWeight: "600", color: colors.text },
  reason: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 8 },
  actions: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: { flex: 1 },
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
});
