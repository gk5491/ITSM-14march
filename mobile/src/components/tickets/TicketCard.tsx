import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Ticket } from "../../types";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { colors, getStatusColor, getPriorityColor } from "../../utils/colors";
import { format } from "date-fns";

interface TicketCardProps {
  ticket: Ticket;
  onPress: () => void;
  showAssignee?: boolean;
  compact?: boolean;
}

export function TicketCard({ ticket, onPress, showAssignee = true, compact = false }: TicketCardProps) {
  const priorityColor = getPriorityColor(ticket.priority);
  const statusColor = getStatusColor(ticket.status);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={[styles.card, compact && styles.compact]}>
        <View style={styles.topRow}>
          <View style={[styles.priorityStrip, { backgroundColor: priorityColor }]} />
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.id}>#{ticket.id}</Text>
              {ticket.category && (
                <Text style={styles.category} numberOfLines={1}>
                  {ticket.category.name}
                </Text>
              )}
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>

            <Text style={styles.title} numberOfLines={compact ? 1 : 2}>
              {ticket.title}
            </Text>

            {!compact && (
              <Text style={styles.description} numberOfLines={2}>
                {ticket.description}
              </Text>
            )}

            <View style={styles.footer}>
              <View style={styles.badges}>
                <Badge label={ticket.status} color={statusColor} size="sm" />
                <Badge label={ticket.priority} color={priorityColor} size="sm" />
              </View>

              <View style={styles.meta}>
                {showAssignee && ticket.assignedTo ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="person-circle-outline" size={12} color={colors.textMuted} />
                    <Text style={styles.metaText}>{ticket.assignedTo.name}</Text>
                  </View>
                ) : null}
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.metaText}>
                    {format(new Date(ticket.createdAt), "MMM d")}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: "hidden",
    marginBottom: 10,
  },
  compact: {},
  topRow: {
    flexDirection: "row",
  },
  priorityStrip: {
    width: 4,
    borderRadius: 0,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  id: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  category: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    backgroundColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badges: {
    flexDirection: "row",
    gap: 6,
    flex: 1,
    flexWrap: "wrap",
  },
  meta: {
    flexDirection: "row",
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
