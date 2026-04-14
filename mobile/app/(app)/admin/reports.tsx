import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../src/context/AuthContext";
import { ticketsApi } from "../../../src/api/tickets";
import { usersApi } from "../../../src/api/users";
import { Card } from "../../../src/components/ui/Card";
import { LoadingScreen } from "../../../src/components/ui/LoadingScreen";
import { colors, getStatusColor, getPriorityColor } from "../../../src/utils/colors";

export default function ReportsScreen() {
  const { isAdmin, isAgent } = useAuth();

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: ticketsApi.getDashboard,
    enabled: isAdmin || isAgent,
  });

  const { data: agentPerformance } = useQuery({
    queryKey: ["agent-performance"],
    queryFn: usersApi.getAgentPerformance,
    enabled: isAdmin || isAgent,
  });

  if (isLoading) return <LoadingScreen />;

  const total = (stats?.open || 0) + (stats?.inProgress || 0) + (stats?.resolved || 0) + (stats?.closed || 0);
  const resolutionRate = total > 0 ? Math.round(((stats?.resolved || 0) + (stats?.closed || 0)) / total * 100) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Ticket Overview</Text>
          <View style={styles.kpiRow}>
            <KPI label="Total" value={total} color={colors.primary} />
            <KPI label="Resolution Rate" value={`${resolutionRate}%`} color={colors.success} />
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Status Breakdown</Text>
          {[
            { label: "Open", value: stats?.open || 0, status: "open" },
            { label: "In Progress", value: stats?.inProgress || 0, status: "in_progress" },
            { label: "Resolved", value: stats?.resolved || 0, status: "resolved" },
            { label: "Closed", value: stats?.closed || 0, status: "closed" },
          ].map((item) => (
            <View key={item.status} style={styles.barItem}>
              <Text style={styles.barLabel}>{item.label}</Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: total > 0 ? `${(item.value / total) * 100}%` : "0%",
                      backgroundColor: getStatusColor(item.status),
                    },
                  ]}
                />
              </View>
              <Text style={[styles.barCount, { color: getStatusColor(item.status) }]}>
                {item.value}
              </Text>
            </View>
          ))}
        </Card>

        {agentPerformance && Array.isArray(agentPerformance) && agentPerformance.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Agent Performance</Text>
            {agentPerformance.map((agent: any, i: number) => (
              <View key={i} style={styles.agentRow}>
                <View style={styles.agentAvatar}>
                  <Text style={styles.agentAvatarText}>
                    {(agent.name || "A").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.agentInfo}>
                  <Text style={styles.agentName}>{agent.name}</Text>
                  <Text style={styles.agentStats}>
                    {agent.resolved || 0} resolved · {agent.inProgress || 0} in progress
                  </Text>
                </View>
                <View style={styles.agentScore}>
                  <Text style={styles.agentScoreText}>
                    {agent.totalTickets || 0}
                  </Text>
                  <Text style={styles.agentScoreLabel}>tickets</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        <Card>
          <Text style={styles.sectionTitle}>Priority Distribution</Text>
          {[
            { label: "High Priority", value: stats?.highPriority || 0, color: colors.priorityHigh },
            { label: "Medium Priority", value: stats?.mediumPriority || 0, color: colors.priorityMedium },
            { label: "Low Priority", value: stats?.lowPriority || 0, color: colors.priorityLow },
          ].map((item) => (
            <View key={item.label} style={styles.priorityRow}>
              <View style={[styles.priorityDot, { backgroundColor: item.color }]} />
              <Text style={styles.priorityLabel}>{item.label}</Text>
              <Text style={[styles.priorityCount, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function KPI({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View style={[styles.kpi, { borderColor: color + "40" }]}>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  summaryCard: {},
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 16 },
  kpiRow: { flexDirection: "row", gap: 12 },
  kpi: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  kpiValue: { fontSize: 28, fontWeight: "900" },
  kpiLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  barItem: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  barLabel: { fontSize: 13, color: colors.text, width: 85 },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: { height: "100%", borderRadius: 4, minWidth: 4 },
  barCount: { fontSize: 13, fontWeight: "700", width: 30, textAlign: "right" },
  agentRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  agentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  agentAvatarText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  agentInfo: { flex: 1 },
  agentName: { fontSize: 14, fontWeight: "700", color: colors.text },
  agentStats: { fontSize: 12, color: colors.textSecondary },
  agentScore: { alignItems: "center" },
  agentScoreText: { fontSize: 20, fontWeight: "900", color: colors.primary },
  agentScoreLabel: { fontSize: 10, color: colors.textMuted },
  priorityRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  priorityDot: { width: 12, height: 12, borderRadius: 6 },
  priorityLabel: { fontSize: 14, color: colors.text, flex: 1 },
  priorityCount: { fontSize: 16, fontWeight: "700" },
});
