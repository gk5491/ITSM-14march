import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkReport } from "../../types";
import { Card } from "../ui/Card";
import { colors } from "../../utils/colors";
import { format } from "date-fns";

interface ReportCardProps {
  report: WorkReport;
  onPress?: () => void;
}

export function ReportCard({ report, onPress }: ReportCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.dateSection}>
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
            <Text style={styles.date}>
              {format(new Date(report.reportDate), "EEE, MMM d yyyy")}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            <Text style={styles.statusText}>Submitted</Text>
          </View>
        </View>

        {report.engineerName && (
          <View style={styles.engineerRow}>
            <Ionicons name="person-outline" size={13} color={colors.textMuted} />
            <Text style={styles.engineerName}>{report.engineerName}</Text>
          </View>
        )}

        {report.clientName && (
          <View style={styles.clientRow}>
            <Ionicons name="business-outline" size={13} color={colors.textMuted} />
            <Text style={styles.clientName}>{report.clientName}</Text>
            {report.siteName && (
              <>
                <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                <Text style={styles.siteName}>{report.siteName}</Text>
              </>
            )}
          </View>
        )}

        <Text
          style={styles.summary}
          numberOfLines={expanded ? undefined : 3}
        >
          {report.workSummary}
        </Text>

        {report.workSummary.length > 100 && (
          <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.expandBtn}>
            <Text style={styles.expandText}>
              {expanded ? "Show less" : "Read more"}
            </Text>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={14}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}

        {report.hoursWorked !== undefined && (
          <View style={styles.footer}>
            <View style={styles.hoursChip}>
              <Ionicons name="time-outline" size={13} color={colors.info} />
              <Text style={styles.hoursText}>
                {report.hoursWorked} {report.hoursWorked === 1 ? "hour" : "hours"} worked
              </Text>
            </View>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dateSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  date: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.success + "15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.success,
  },
  engineerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  engineerName: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  clientName: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  siteName: {
    fontSize: 13,
    color: colors.textMuted,
  },
  summary: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: 8,
  },
  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  expandText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  hoursChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.info + "15",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  hoursText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.info,
  },
});
