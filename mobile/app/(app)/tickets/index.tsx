import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../src/context/AuthContext";
import { ticketsApi, Ticket } from "../../../src/api/tickets";
import { Card } from "../../../src/components/ui/Card";
import { Badge } from "../../../src/components/ui/Badge";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { LoadingScreen } from "../../../src/components/ui/LoadingScreen";
import { colors, getStatusColor, getPriorityColor } from "../../../src/utils/colors";

const STATUS_FILTERS = ["all", "open", "in_progress", "resolved", "closed"];

type TabKey = "my" | "all" | "assigned";

function TicketCard({ ticket, onPress }: { ticket: Ticket; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.ticketCard}>
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <Text style={styles.ticketTitle} numberOfLines={2}>
              {ticket.title}
            </Text>
            <Text style={styles.ticketId}>#{ticket.id}</Text>
          </View>
          <View
            style={[
              styles.priorityIndicator,
              { backgroundColor: getPriorityColor(ticket.priority) },
            ]}
          />
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {ticket.description}
        </Text>

        <View style={styles.cardBottom}>
          <Badge
            label={ticket.status.replace("_", " ")}
            color={getStatusColor(ticket.status)}
            size="sm"
          />
          <Badge
            label={ticket.priority}
            color={getPriorityColor(ticket.priority)}
            size="sm"
          />
          {ticket.category && (
            <Text style={styles.categoryChip}>{ticket.category.name}</Text>
          )}
        </View>

        <View style={styles.cardFooter}>
          {ticket.createdBy && (
            <View style={styles.metaItem}>
              <Ionicons name="person-circle-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>{ticket.createdBy.name}</Text>
            </View>
          )}
          {ticket.assignedTo && (
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={13} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.primary }]}>
                {ticket.assignedTo.name}
              </Text>
            </View>
          )}
          {!ticket.assignedTo && (
            <Text style={styles.unassignedText}>Unassigned</Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function TicketsScreen() {
  const { user, isAgent, isAdmin } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<TabKey>("my");

  const showAllTab = isAgent || isAdmin;
  const showAssignedTab = isAgent || isAdmin;

  const { data: myTickets, isLoading: loadingMy, refetch: refetchMy, isRefetching: refetchingMy } = useQuery({
    queryKey: ["tickets", "my"],
    queryFn: ticketsApi.getMy,
    enabled: activeTab === "my",
  });

  const { data: allTickets, isLoading: loadingAll, refetch: refetchAll, isRefetching: refetchingAll } = useQuery({
    queryKey: ["tickets", "all"],
    queryFn: ticketsApi.getAll,
    enabled: activeTab === "all",
  });

  const { data: assignedTickets, isLoading: loadingAssigned, refetch: refetchAssigned, isRefetching: refetchingAssigned } = useQuery({
    queryKey: ["tickets", "assigned"],
    queryFn: ticketsApi.getAssigned,
    enabled: activeTab === "assigned" && showAssignedTab,
  });

  const getActiveData = (): Ticket[] => {
    if (activeTab === "all") return allTickets || [];
    if (activeTab === "assigned") return assignedTickets || [];
    return myTickets || [];
  };

  const isLoading = activeTab === "my" ? loadingMy : activeTab === "all" ? loadingAll : loadingAssigned;
  const isRefetching = activeTab === "my" ? refetchingMy : activeTab === "all" ? refetchingAll : refetchingAssigned;
  const doRefetch = activeTab === "my" ? refetchMy : activeTab === "all" ? refetchAll : refetchAssigned;

  const filtered = getActiveData().filter((t) => {
    const matchSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      String(t.id).includes(search);
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: "my", label: "My Tickets", icon: "person-outline" },
    ...(showAllTab ? [{ key: "all" as TabKey, label: "All Tickets", icon: "list-outline" }] : []),
    ...(showAssignedTab ? [{ key: "assigned" as TabKey, label: "Assigned to Me", icon: "checkmark-circle-outline" }] : []),
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tickets</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/(app)/tickets/new")}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {tabs.length > 1 && (
        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            >
              <Ionicons
                name={tab.icon as any}
                size={14}
                color={activeTab === tab.key ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search tickets..."
          placeholderTextColor={colors.textMuted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filtersRow}>
        {STATUS_FILTERS.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatusFilter(s)}
            style={[
              styles.filterChip,
              statusFilter === s && styles.filterChipActive,
            ]}
          >
            <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>
              {s === "all" ? "All" : s.replace("_", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TicketCard
              ticket={item}
              onPress={() => router.push(`/(app)/tickets/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={doRefetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="ticket-outline"
              title="No tickets found"
              message={
                search ? "Try adjusting your search" :
                activeTab === "assigned" ? "No tickets assigned to you" :
                "Create a new ticket to get started"
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  addBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    padding: 6,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  tabTextActive: { color: colors.primary },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  filtersRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: { fontSize: 12, color: colors.textSecondary, fontWeight: "500" },
  filterTextActive: { color: "#fff", fontWeight: "700" },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  ticketCard: { marginBottom: 10 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  cardLeft: { flex: 1, marginRight: 8 },
  ticketTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  ticketId: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  priorityIndicator: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardBottom: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 8 },
  categoryChip: {
    fontSize: 11,
    color: colors.textMuted,
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: colors.textMuted },
  unassignedText: { fontSize: 12, color: colors.textMuted, fontStyle: "italic" },
});
