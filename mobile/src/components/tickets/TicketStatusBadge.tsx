import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TicketStatus, TicketPriority } from "../../types";
import { colors, getStatusColor, getPriorityColor } from "../../utils/colors";

const STATUS_ICONS: Record<TicketStatus, keyof typeof Ionicons.glyphMap> = {
  open: "folder-open-outline",
  in_progress: "reload-circle-outline",
  resolved: "checkmark-circle-outline",
  closed: "lock-closed-outline",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low Priority",
  medium: "Medium Priority",
  high: "High Priority",
};

interface TicketStatusBadgeProps {
  status: TicketStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function TicketStatusBadge({
  status,
  size = "md",
  showIcon = true,
}: TicketStatusBadgeProps) {
  const color = getStatusColor(status);
  const iconName = STATUS_ICONS[status];
  const iconSize = size === "sm" ? 12 : size === "md" ? 14 : 16;
  const fontSize = size === "sm" ? 10 : size === "md" ? 12 : 14;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color + "18",
          borderColor: color + "50",
        },
        styles[size],
      ]}
    >
      {showIcon && (
        <Ionicons name={iconName} size={iconSize} color={color} />
      )}
      <Text style={[styles.text, { color, fontSize }]}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
  size?: "sm" | "md" | "lg";
}

export function TicketPriorityBadge({
  priority,
  size = "md",
}: TicketPriorityBadgeProps) {
  const color = getPriorityColor(priority);
  const fontSize = size === "sm" ? 10 : size === "md" ? 12 : 14;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color + "18",
          borderColor: color + "50",
        },
        styles[size],
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color, fontSize }]}>
        {PRIORITY_LABELS[priority]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  sm: { paddingHorizontal: 8, paddingVertical: 3 },
  md: { paddingHorizontal: 10, paddingVertical: 5 },
  lg: { paddingHorizontal: 14, paddingVertical: 7 },
  text: {
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});
