import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../src/context/AuthContext";
import { ticketsApi, Ticket } from "../../../src/api/tickets";
import { usersApi } from "../../../src/api/users";
import { Card } from "../../../src/components/ui/Card";
import { Badge } from "../../../src/components/ui/Badge";
import { Button } from "../../../src/components/ui/Button";
import { Select } from "../../../src/components/ui/Select";
import { LoadingScreen } from "../../../src/components/ui/LoadingScreen";
import { colors, getStatusColor, getPriorityColor } from "../../../src/utils/colors";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

const PRIORITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAgent } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editAssignee, setEditAssignee] = useState<number | undefined>();

  const { data: ticket, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => ticketsApi.getById(Number(id)),
    enabled: !!id,
  });

  const { data: agents } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.getAll,
    enabled: isAgent,
    select: (users) => users.filter((u) => u.role === "agent" || u.role === "admin"),
  });

  const commentMutation = useMutation({
    mutationFn: () => ticketsApi.addComment(Number(id), comment, isInternal),
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
    },
    onError: () => Alert.alert("Error", "Failed to add comment"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof ticketsApi.update>[1]) =>
      ticketsApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setEditMode(false);
      Alert.alert("Success", "Ticket updated");
    },
    onError: () => Alert.alert("Error", "Failed to update ticket"),
  });

  const handleSaveEdit = () => {
    const updates: Parameters<typeof ticketsApi.update>[1] = {};
    if (editStatus) updates.status = editStatus as any;
    if (editPriority) updates.priority = editPriority as any;
    if (editAssignee !== undefined) updates.assignedToId = editAssignee;
    if (Object.keys(updates).length === 0) { setEditMode(false); return; }
    updateMutation.mutate(updates);
  };

  const handleStartEdit = () => {
    if (!ticket) return;
    setEditStatus(ticket.status);
    setEditPriority(ticket.priority);
    setEditAssignee(ticket.assignedToId);
    setEditMode(true);
  };

  if (isLoading) return <LoadingScreen />;
  if (!ticket) return (
    <View style={styles.error}>
      <Text>Ticket not found</Text>
      <Button title="Go Back" onPress={() => router.back()} />
    </View>
  );

  const agentOptions = [
    { label: "Unassigned", value: 0 },
    ...(agents || []).map((a) => ({ label: a.name, value: a.id })),
  ];

  const comments = ticket.comments || [];
  const canEdit = isAgent || ticket.createdById === user?.id;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          #{ticket.id}
        </Text>
        {isAgent && !editMode && (
          <TouchableOpacity onPress={handleStartEdit} style={styles.editBtn}>
            <Ionicons name="create-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        {editMode && (
          <TouchableOpacity onPress={() => setEditMode(false)} style={styles.editBtn}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        >
          <Card>
            <Text style={styles.ticketTitle}>{ticket.title}</Text>

            <View style={styles.badgeRow}>
              <Badge label={ticket.status} color={getStatusColor(ticket.status)} />
              <Badge label={ticket.priority} color={getPriorityColor(ticket.priority)} />
              {ticket.category && (
                <Badge label={ticket.category.name} color={colors.info} />
              )}
            </View>

            <View style={styles.meta}>
              <MetaRow icon="person-outline" label="Created by" value={ticket.createdBy?.name || "Unknown"} />
              {ticket.assignedTo && (
                <MetaRow icon="person-circle-outline" label="Assigned to" value={ticket.assignedTo.name} />
              )}
              <MetaRow
                icon="calendar-outline"
                label="Created"
                value={format(new Date(ticket.createdAt), "MMM d, yyyy")}
              />
              {ticket.supportType && (
                <MetaRow icon="build-outline" label="Support type" value={ticket.supportType} />
              )}
              {ticket.companyName && (
                <MetaRow icon="business-outline" label="Company" value={ticket.companyName} />
              )}
            </View>

            <View style={styles.divider} />
            <Text style={styles.descLabel}>Description</Text>
            <Text style={styles.description}>{ticket.description}</Text>
          </Card>

          {editMode && (
            <Card style={styles.editCard}>
              <Text style={styles.editTitle}>Edit Ticket</Text>
              <Select
                label="Status"
                value={editStatus}
                onValueChange={(v) => setEditStatus(String(v))}
                options={STATUS_OPTIONS}
              />
              <Select
                label="Priority"
                value={editPriority}
                onValueChange={(v) => setEditPriority(String(v))}
                options={PRIORITY_OPTIONS}
              />
              <Select
                label="Assigned To"
                value={editAssignee || 0}
                onValueChange={(v) => setEditAssignee(Number(v) || undefined)}
                options={agentOptions}
              />
              <Button
                title="Save Changes"
                onPress={handleSaveEdit}
                loading={updateMutation.isPending}
              />
            </Card>
          )}

          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>
              Comments ({comments.length})
            </Text>

            {comments.map((c) => (
              <Card key={c.id} style={[styles.commentCard, c.isInternal && styles.internalComment]}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{c.user?.name || "User"}</Text>
                  {c.isInternal && (
                    <View style={styles.internalBadge}>
                      <Text style={styles.internalText}>INTERNAL</Text>
                    </View>
                  )}
                  <Text style={styles.commentDate}>
                    {format(new Date(c.createdAt), "MMM d, HH:mm")}
                  </Text>
                </View>
                <Text style={styles.commentContent}>{c.content}</Text>
              </Card>
            ))}

            {canEdit && (
              <Card style={styles.addCommentCard}>
                <Text style={styles.addCommentTitle}>Add Comment</Text>
                {isAgent && (
                  <TouchableOpacity
                    style={styles.internalToggle}
                    onPress={() => setIsInternal(!isInternal)}
                  >
                    <Ionicons
                      name={isInternal ? "checkbox" : "square-outline"}
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={styles.internalToggleText}>Internal comment (agents only)</Text>
                  </TouchableOpacity>
                )}
                <TextInput
                  style={styles.commentInput}
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Write a comment..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
                <Button
                  title="Post Comment"
                  onPress={() => {
                    if (!comment.trim()) return;
                    commentMutation.mutate();
                  }}
                  loading={commentMutation.isPending}
                  disabled={!comment.trim()}
                  size="sm"
                />
              </Card>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MetaRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={14} color={colors.textMuted} />
      <Text style={styles.metaLabel}>{label}:</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff", flex: 1, marginHorizontal: 12 },
  editBtn: { padding: 4 },
  content: { padding: 16, paddingBottom: 40 },
  ticketTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 12 },
  badgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  meta: { gap: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaLabel: { fontSize: 13, color: colors.textMuted, fontWeight: "500" },
  metaValue: { fontSize: 13, color: colors.text, fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  descLabel: { fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 8 },
  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  editCard: { marginTop: 12, borderLeftWidth: 3, borderLeftColor: colors.warning },
  editTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 16 },
  commentsSection: { marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 },
  commentCard: { marginBottom: 8, padding: 12 },
  internalComment: { borderLeftWidth: 3, borderLeftColor: colors.warning, backgroundColor: "#fffbeb" },
  commentHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  commentAuthor: { fontSize: 13, fontWeight: "700", color: colors.text, flex: 1 },
  internalBadge: {
    backgroundColor: colors.warning + "20",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  internalText: { fontSize: 9, fontWeight: "800", color: colors.warning },
  commentDate: { fontSize: 11, color: colors.textMuted },
  commentContent: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  addCommentCard: { marginTop: 4 },
  addCommentTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 12 },
  internalToggle: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  internalToggleText: { fontSize: 13, color: colors.text },
  commentInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  error: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
});
