import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LeaveRequest, LeaveStatus } from "../../types";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { colors } from "../../utils/colors";
import { format, differenceInCalendarDays } from "date-fns";

const LEAVE_TYPE_LABELS: Record<string, string> = {
  sick: "Sick Leave",
  casual: "Casual Leave",
  earned: "Earned Leave",
  emergency: "Emergency Leave",
  other: "Other Leave",
};

const STATUS_CONFIG: Record<
  LeaveStatus,
  { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  pending: {
    label: "Pending",
    color: colors.warning,
    icon: "time-outline",
  },
  approved: {
    label: "Approved",
    color: colors.success,
    icon: "checkmark-circle-outline",
  },
  rejected: {
    label: "Rejected",
    color: colors.danger,
    icon: "close-circle-outline",
  },
};

interface LeaveCardProps {
  leave: LeaveRequest;
  canApprove?: boolean;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}

export function LeaveCard({
  leave,
  canApprove = false,
  onApprove,
  onReject,
}: LeaveCardProps) {
  const statusConfig = STATUS_CONFIG[leave.status];
  const days =
    differenceInCalendarDays(
      new Date(leave.endDate),
      new Date(leave.startDate)
    ) + 1;

  return (
    <Card
      style={[
        styles.card,
        { borderLeftColor: statusConfig.color },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.typeSection}>
          <Text style={styles.leaveType}>
            {LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType}
          </Text>
          {leave.engineerName && (
            <Text style={styles.engineerName}>{leave.engineerName}</Text>
          )}
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: statusConfig.color + "15" },
          ]}
        >
          <Ionicons
            name={statusConfig.icon}
            size={13}
            color={statusConfig.color}
          />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      <View style={styles.datesRow}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>FROM</Text>
          <Text style={styles.dateValue}>
            {format(new Date(leave.startDate), "MMM d, yyyy")}
          </Text>
          <Text style={styles.dayName}>
            {format(new Date(leave.startDate), "EEEE")}
          </Text>
        </View>

        <View style={styles.durationBadge}>
          <Text style={styles.durationNumber}>{days}</Text>
          <Text style={styles.durationLabel}>{days === 1 ? "Day" : "Days"}</Text>
        </View>

        <View style={[styles.dateBlock, styles.dateBlockRight]}>
          <Text style={styles.dateLabel}>TO</Text>
          <Text style={styles.dateValue}>
            {format(new Date(leave.endDate), "MMM d, yyyy")}
          </Text>
          <Text style={styles.dayName}>
            {format(new Date(leave.endDate), "EEEE")}
          </Text>
        </View>
      </View>

      <View style={styles.reasonSection}>
        <Ionicons name="chatbox-outline" size={14} color={colors.textMuted} />
        <Text style={styles.reason}>{leave.reason}</Text>
      </View>

      {canApprove && leave.status === "pending" && (
        <View style={styles.actions}>
          <Button
            title="Approve"
            size="sm"
            onPress={() => onApprove?.(leave.id)}
            style={[styles.actionBtn, { backgroundColor: colors.success }]}
          />
          <Button
            title="Reject"
            variant="danger"
            size="sm"
            onPress={() => onReject?.(leave.id)}
            style={styles.actionBtn}
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  typeSection: {
    flex: 1,
    marginRight: 8,
  },
  leaveType: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 2,
  },
  engineerName: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  datesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
  },
  dateBlock: {},
  dateBlockRight: {
    alignItems: "flex-end",
  },
  dateLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  dayName: {
    fontSize: 11,
    color: colors.textMuted,
  },
  durationBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  durationNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
  },
  durationLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
  },
  reasonSection: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    marginBottom: 12,
  },
  reason: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
  },
});
