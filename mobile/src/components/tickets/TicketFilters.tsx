import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { TicketStatus, TicketPriority } from "../../types";
import { colors, getStatusColor, getPriorityColor } from "../../utils/colors";

interface TicketFiltersProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  priorityFilter?: string;
  onPriorityChange?: (priority: string) => void;
  showPriority?: boolean;
}

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

const PRIORITY_OPTIONS = [
  { label: "All", value: "all" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

function FilterChip({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        active && styles.chipActive,
        active && color ? { backgroundColor: color, borderColor: color } : {},
      ]}
      activeOpacity={0.7}
    >
      {color && !active && (
        <View style={[styles.dot, { backgroundColor: color }]} />
      )}
      <Text
        style={[
          styles.chipText,
          active && styles.chipTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function TicketFilters({
  statusFilter,
  onStatusChange,
  priorityFilter = "all",
  onPriorityChange,
  showPriority = false,
}: TicketFiltersProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {STATUS_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            active={statusFilter === opt.value}
            color={opt.value !== "all" ? getStatusColor(opt.value) : undefined}
            onPress={() => onStatusChange(opt.value)}
          />
        ))}
      </ScrollView>

      {showPriority && onPriorityChange && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.row, styles.secondRow]}
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              active={priorityFilter === opt.value}
              color={opt.value !== "all" ? getPriorityColor(opt.value) : undefined}
              onPress={() => onPriorityChange(opt.value)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 8 },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  secondRow: {
    paddingTop: 0,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 5,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#fff",
  },
});
