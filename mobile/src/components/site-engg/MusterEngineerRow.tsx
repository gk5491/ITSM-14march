import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MusterRecord } from "../../types";
import { Card } from "../ui/Card";
import { colors } from "../../utils/colors";

interface MusterEngineerRowProps {
  record: MusterRecord;
  totalWorkingDays?: number;
}

function StatPill({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.statPill, { borderColor: color + "40" }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function MusterEngineerRow({ record, totalWorkingDays }: MusterEngineerRowProps) {
  const attendanceRate =
    totalWorkingDays && totalWorkingDays > 0
      ? Math.round((record.daysPresent / totalWorkingDays) * 100)
      : 0;

  const initials = record.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{record.name}</Text>
          {record.department && (
            <Text style={styles.department}>{record.department}</Text>
          )}
        </View>
        <View style={styles.attendanceRate}>
          <Text
            style={[
              styles.rateNumber,
              {
                color:
                  attendanceRate >= 80
                    ? colors.success
                    : attendanceRate >= 60
                    ? colors.warning
                    : colors.danger,
              },
            ]}
          >
            {attendanceRate}%
          </Text>
          <Text style={styles.rateLabel}>Attendance</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${attendanceRate}%`,
              backgroundColor:
                attendanceRate >= 80
                  ? colors.success
                  : attendanceRate >= 60
                  ? colors.warning
                  : colors.danger,
            },
          ]}
        />
      </View>

      <View style={styles.stats}>
        <StatPill
          value={record.daysPresent}
          label="Present"
          color={colors.success}
        />
        <StatPill
          value={record.daysAbsent}
          label="Absent"
          color={colors.danger}
        />
        <StatPill
          value={record.leavesApproved}
          label="Leaves"
          color={colors.warning}
        />
        <StatPill
          value={record.lateCheckIns}
          label="Late"
          color={colors.info}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  department: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  attendanceRate: {
    alignItems: "center",
  },
  rateNumber: {
    fontSize: 22,
    fontWeight: "900",
  },
  rateLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "500",
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 14,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    minWidth: 4,
  },
  stats: {
    flexDirection: "row",
    gap: 8,
  },
  statPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: colors.background,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
    marginTop: 2,
  },
});
