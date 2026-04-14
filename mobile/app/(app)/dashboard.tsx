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
import { LoadingScreen } from "../../src/components/ui/LoadingScreen";
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
  value: number;
  color: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.statIcon, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { user, logout, isAdmin, isAgent } = useAuth();
  const router = useRouter();

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: ticketsApi.getDashboard,
  });

  const { data: myTickets } = useQuery({
    queryKey: ["tickets", "my"],
    queryFn: ticketsApi.getMy,
  });

  const recentTickets = (myTickets || []).slice(0, 5);

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.name || user?.username}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => logout()}
        >
          <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        <View style={styles.roleBadge}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
          <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
          {user?.companyName && <Text style={styles.companyText}> · {user.companyName}</Text>}
        </View>

        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="folder-open-outline"
            label="Open"
            value={stats?.open || 0}
            color={colors.statusOpen}
            onPress={() => router.push("/(app)/tickets")}
          />
          <StatCard
            icon="time-outline"
            label="In Progress"
            value={stats?.inProgress || 0}
            color={colors.statusInProgress}
            onPress={() => router.push("/(app)/tickets")}
          />
          <StatCard
            icon="checkmark-circle-outline"
            label="Resolved"
            value={stats?.resolved || 0}
            color={colors.statusResolved}
            onPress={() => router.push("/(app)/tickets")}
          />
          <StatCard
            icon="lock-closed-outline"
            label="Closed"
            value={stats?.closed || 0}
            color={colors.statusClosed}
            onPress={() => router.push("/(app)/tickets")}
          />
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push("/(app)/tickets/new")}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionText}>New Ticket</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push("/(app)/tickets")}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.info + "15" }]}>
                <Ionicons name="list-outline" size={24} color={colors.info} />
              </View>
              <Text style={styles.actionText}>My Tickets</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push("/(app)/site-engg")}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.success + "15" }]}>
                <Ionicons name="construct-outline" size={24} color={colors.success} />
              </View>
              <Text style={styles.actionText}>Site-Engg</Text>
            </TouchableOpacity>

            {isAdmin && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push("/(app)/admin/users")}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.warning + "15" }]}>
                  <Ionicons name="people-outline" size={24} color={colors.warning} />
                </View>
                <Text style={styles.actionText}>Users</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {recentTickets.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Tickets</Text>
              <TouchableOpacity onPress={() => router.push("/(app)/tickets")}>
                <Text style={styles.seeAll}>See all</Text>
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
  greeting: { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  name: { fontSize: 20, fontWeight: "800", color: "#fff" },
  logoutBtn: { padding: 8 },
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "15",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 20,
    gap: 4,
  },
  roleText: { fontSize: 12, fontWeight: "700", color: colors.primary },
  companyText: { fontSize: 12, color: colors.textSecondary },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAll: { color: colors.primary, fontSize: 13, fontWeight: "600" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: { fontSize: 24, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  quickActions: { marginBottom: 24 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionBtn: {
    flex: 1,
    minWidth: "22%",
    alignItems: "center",
    gap: 8,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: "600",
    textAlign: "center",
  },
  ticketCard: { marginBottom: 8, padding: 12 },
  ticketRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  ticketTitle: { fontSize: 14, fontWeight: "600", color: colors.text, flex: 1 },
  ticketMeta: { flexDirection: "row", justifyContent: "space-between" },
  ticketStatus: { fontSize: 11, fontWeight: "700" },
  ticketId: { fontSize: 12, color: colors.textMuted },
});
