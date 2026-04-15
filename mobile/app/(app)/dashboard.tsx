import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { ticketsApi } from "../../src/api/tickets";
import { Card } from "../../src/components/ui/Card";
import { colors, getStatusColor, getPriorityColor } from "../../src/utils/colors";

function StatCard({
  icon,
  label,
  value,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | string;
  color: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.statIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.actionIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { user, isAdmin, isAgent } = useAuth();
  const router = useRouter();

  const { data: stats, isLoading: statsLoading, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: ticketsApi.getDashboard,
  });

  const { data: myTickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["tickets", "my"],
    queryFn: ticketsApi.getMy,
  });

  const { data: assignedTickets } = useQuery({
    queryKey: ["tickets", "assigned"],
    queryFn: ticketsApi.getAssigned,
    enabled: isAgent || isAdmin,
  });

  const recentTickets = (myTickets || []).slice(0, 5);
  const pendingAssigned = (assignedTickets || []).filter(
    (t) => t.status === "open" || t.status === "in_progress"
  ).length;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.name || user?.username}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.rolePill, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Ionicons name="shield-checkmark-outline" size={12} color="#fff" />
            <Text style={styles.rolePillText}>{user?.role?.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {user?.companyName && (
          <View style={styles.companyBanner}>
            <Ionicons name="business-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.companyText}>{user.companyName}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Ticket Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="folder-open-outline"
            label="Open"
            value={stats?.open ?? 0}
            color={colors.statusOpen}
            onPress={() => router.push("/(app)/tickets")}
          />
          <StatCard
            icon="time-outline"
            label="In Progress"
            value={stats?.inProgress ?? 0}
            color={colors.statusInProgress}
            onPress={() => router.push("/(app)/tickets")}
          />
          <StatCard
            icon="checkmark-circle-outline"
            label="Resolved"
            value={stats?.resolved ?? 0}
            color={colors.statusResolved}
            onPress={() => router.push("/(app)/tickets")}
          />
          <StatCard
            icon="lock-closed-outline"
            label="Closed"
            value={stats?.closed ?? 0}
            color={colors.statusClosed}
            onPress={() => router.push("/(app)/tickets")}
          />
          {(isAgent || isAdmin) && (
            <StatCard
              icon="person-outline"
              label="Assigned to Me"
              value={pendingAssigned}
              color={colors.primary}
              onPress={() => router.push("/(app)/tickets")}
            />
          )}
          <StatCard
            icon="receipt-outline"
            label="My Tickets"
            value={(myTickets || []).length}
            color="#8b5cf6"
            onPress={() => router.push("/(app)/tickets")}
          />
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickAction
            icon="add-circle-outline"
            label="New Ticket"
            color={colors.primary}
            onPress={() => router.push("/(app)/tickets/new")}
          />
          <QuickAction
            icon="ticket-outline"
            label="My Tickets"
            color="#0ea5e9"
            onPress={() => router.push("/(app)/tickets")}
          />
          <QuickAction
            icon="help-circle-outline"
            label="Knowledge Base"
            color="#10b981"
            onPress={() => router.push("/(app)/knowledge-base")}
          />
          <QuickAction
            icon="chatbubble-ellipses-outline"
            label="AI Chat"
            color="#0ea5e9"
            onPress={() => router.push("/(app)/chatbot")}
          />
          <QuickAction
            icon="construct-outline"
            label="Site-Engg"
            color="#6366f1"
            onPress={() => router.push("/(app)/site-engg")}
          />
          {(isAdmin || isAgent) && (
            <QuickAction
              icon="people-outline"
              label="All Tickets"
              color="#f59e0b"
              onPress={() => router.push("/(app)/tickets")}
            />
          )}
          {isAdmin && (
            <QuickAction
              icon="bar-chart-outline"
              label="Reports"
              color="#14b8a6"
              onPress={() => router.push("/(app)/admin/reports")}
            />
          )}
        </View>

        {recentTickets.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Tickets</Text>
              <TouchableOpacity onPress={() => router.push("/(app)/tickets")}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            {recentTickets.map((ticket) => (
              <TouchableOpacity
                key={ticket.id}
                onPress={() => router.push(`/(app)/tickets/${ticket.id}`)}
                activeOpacity={0.8}
              >
                <Card style={styles.ticketCard}>
                  <View style={styles.ticketRow}>
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: getPriorityColor(ticket.priority) },
                      ]}
                    />
                    <Text style={styles.ticketTitle} numberOfLines={1}>
                      {ticket.title}
                    </Text>
                  </View>
                  <View style={styles.ticketMeta}>
                    <Text style={[styles.ticketStatus, { color: getStatusColor(ticket.status) }]}>
                      {ticket.status.replace("_", " ").toUpperCase()}
                    </Text>
                    <View style={styles.ticketRight}>
                      {ticket.assignedTo && (
                        <Text style={styles.assigneeText}>{ticket.assignedTo.name}</Text>
                      )}
                      <Text style={styles.ticketId}>#{ticket.id}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {assignedTickets && assignedTickets.length > 0 && (isAgent || isAdmin) && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Assigned to Me</Text>
              <TouchableOpacity onPress={() => router.push("/(app)/tickets")}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            {assignedTickets.slice(0, 3).map((ticket) => (
              <TouchableOpacity
                key={ticket.id}
                onPress={() => router.push(`/(app)/tickets/${ticket.id}`)}
                activeOpacity={0.8}
              >
                <Card style={[styles.ticketCard, styles.assignedCard]}>
                  <View style={styles.ticketRow}>
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: getPriorityColor(ticket.priority) },
                      ]}
                    />
                    <Text style={styles.ticketTitle} numberOfLines={1}>
                      {ticket.title}
                    </Text>
                  </View>
                  <View style={styles.ticketMeta}>
                    <Text style={[styles.ticketStatus, { color: getStatusColor(ticket.status) }]}>
                      {ticket.status.replace("_", " ").toUpperCase()}
                    </Text>
                    <Text style={styles.ticketId}>#{ticket.id}</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.primary,
  },
  greeting: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  name: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerRight: { alignItems: "flex-end" },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  rolePillText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  companyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  companyText: { fontSize: 13, color: colors.textSecondary, fontWeight: "500" },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 4,
  },
  seeAll: { color: colors.primary, fontSize: 13, fontWeight: "600" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderLeftWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: { fontSize: 22, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2, textAlign: "center" },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    width: "22%",
    alignItems: "center",
    gap: 6,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: 10,
    color: colors.text,
    fontWeight: "600",
    textAlign: "center",
  },
  ticketCard: { marginBottom: 8, padding: 12 },
  assignedCard: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  ticketRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  ticketTitle: { fontSize: 14, fontWeight: "600", color: colors.text, flex: 1 },
  ticketMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ticketStatus: { fontSize: 11, fontWeight: "700" },
  ticketRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  assigneeText: { fontSize: 11, color: colors.textMuted },
  ticketId: { fontSize: 12, color: colors.textMuted },
});
