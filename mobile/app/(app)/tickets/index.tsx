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
            label={ticket.status}
            color={getStatusColor(ticket.status)}
            size="sm"
          />
          <Badge
            label={ticket.priority}
            color={getPriorityColor(ticket.priority)}
            size="sm"
          />
          {ticket.category && (
            <Text style={styles.category}>{ticket.category.name}</Text>
          )}
        </View>

        {ticket.assignedTo && (
          <View style={styles.assignee}>
            <Ionicons name="person-outline" size={12} color={colors.textMuted} />
            <Text style={styles.assigneeText}>{ticket.assignedTo.name}</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

export default function TicketsScreen() {
  const { isAgent } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: allTickets, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["tickets", isAgent ? "all" : "my"],
    queryFn: isAgent ? ticketsApi.getAll : ticketsApi.getMy,
  });

  const filtered = (allTickets || []).filter((t) => {
    const matchSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      String(t.id).includes(search);
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isAgent ? "All Tickets" : "My Tickets"}
        </Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/(app)/tickets/new")}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

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

      <View style={styles.filters}>
        {STATUS_FILTERS.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatusFilter(s)}
            style={[
              styles.filterChip,
              statusFilter === s && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                statusFilter === s && styles.filterTextActive,
              ]}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="ticket-outline"
            title="No tickets found"
            message={
              search ? "Try adjusting your search" : "Create a new ticket to get started"
            }
          />
        }
      />
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: { fontSize: 13, color: colors.textSecondary, fontWeight: "500" },
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
  cardBottom: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  category: {
    fontSize: 11,
    color: colors.textMuted,
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  assignee: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  assigneeText: { fontSize: 12, color: colors.textMuted },
});
