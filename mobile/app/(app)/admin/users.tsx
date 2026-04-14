import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../src/context/AuthContext";
import { usersApi } from "../../../src/api/users";
import { User } from "../../../src/api/auth";
import { Card } from "../../../src/components/ui/Card";
import { Button } from "../../../src/components/ui/Button";
import { Input } from "../../../src/components/ui/Input";
import { Select } from "../../../src/components/ui/Select";
import { Badge } from "../../../src/components/ui/Badge";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { LoadingScreen } from "../../../src/components/ui/LoadingScreen";
import { colors, getRoleColor } from "../../../src/utils/colors";

const ROLE_OPTIONS = [
  { label: "User", value: "user" },
  { label: "Agent", value: "agent" },
  { label: "Admin", value: "admin" },
  { label: "HR", value: "hr" },
];

function UserFormModal({
  visible,
  onClose,
  editUser,
}: {
  visible: boolean;
  onClose: () => void;
  editUser: User | null;
}) {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState(editUser?.username || "");
  const [name, setName] = useState(editUser?.name || "");
  const [email, setEmail] = useState(editUser?.email || "");
  const [role, setRole] = useState(editUser?.role || "user");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState(editUser?.companyName || "");
  const [department, setDepartment] = useState(editUser?.department || "");

  React.useEffect(() => {
    if (editUser) {
      setUsername(editUser.username);
      setName(editUser.name);
      setEmail(editUser.email);
      setRole(editUser.role);
      setCompanyName(editUser.companyName || "");
      setDepartment(editUser.department || "");
    } else {
      setUsername(""); setName(""); setEmail(""); setRole("user"); setPassword("");
      setCompanyName(""); setDepartment("");
    }
  }, [editUser, visible]);

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      Alert.alert("Success", "User created");
      onClose();
    },
    onError: (e: any) => Alert.alert("Error", e?.response?.data?.message || "Failed"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<User>) => usersApi.update(editUser!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      Alert.alert("Success", "User updated");
      onClose();
    },
    onError: (e: any) => Alert.alert("Error", e?.response?.data?.message || "Failed"),
  });

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert("Error", "Name and email are required");
      return;
    }
    if (editUser) {
      updateMutation.mutate({ name, email, role: role as any, companyName, department });
    } else {
      if (!username.trim() || !password.trim()) {
        Alert.alert("Error", "Username and password are required");
        return;
      }
      createMutation.mutate({ username, name, email, role, password, companyName, department });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {editUser ? "Edit User" : "Create User"}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <Input label="Full Name *" value={name} onChangeText={setName} placeholder="Enter full name" />
          <Input label="Email *" value={email} onChangeText={setEmail} placeholder="Enter email" keyboardType="email-address" autoCapitalize="none" />
          {!editUser && (
            <>
              <Input label="Username *" value={username} onChangeText={setUsername} placeholder="Enter username" autoCapitalize="none" />
              <Input label="Password *" value={password} onChangeText={setPassword} secureTextEntry placeholder="Set password" />
            </>
          )}
          <Select label="Role" value={role} onValueChange={(v) => setRole(String(v))} options={ROLE_OPTIONS} />
          <Input label="Company" value={companyName} onChangeText={setCompanyName} placeholder="Company name (optional)" />
          <Input label="Department" value={department} onChangeText={setDepartment} placeholder="Department (optional)" />
          <Button title={editUser ? "Update User" : "Create User"} onPress={handleSubmit} loading={isPending} size="lg" />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function UsersScreen() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const { data: users, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.getAll,
    enabled: isAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    onError: () => Alert.alert("Error", "Failed to delete user"),
  });

  const handleDelete = (user: User) => {
    Alert.alert("Delete User", `Delete ${user.name}? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(user.id) },
    ]);
  };

  if (!isAdmin) return (
    <View style={styles.forbidden}>
      <Ionicons name="lock-closed" size={48} color={colors.textMuted} />
      <Text style={styles.forbiddenText}>Admin access required</Text>
    </View>
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => { setEditUser(null); setShowModal(true); }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={users || []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.userCard}>
            <View style={styles.userRow}>
              <View style={[styles.avatar, { backgroundColor: getRoleColor(item.role) }]}>
                <Text style={styles.avatarText}>
                  {item.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                <Text style={styles.userUsername}>@{item.username}</Text>
              </View>
              <Badge label={item.role} color={getRoleColor(item.role)} size="sm" />
            </View>

            {(item.companyName || item.department) && (
              <View style={styles.userMeta}>
                {item.companyName && (
                  <Text style={styles.metaText}>
                    <Ionicons name="business-outline" size={11} /> {item.companyName}
                  </Text>
                )}
                {item.department && (
                  <Text style={styles.metaText}>
                    <Ionicons name="briefcase-outline" size={11} /> {item.department}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.userActions}>
              <Button
                title="Edit"
                variant="outline"
                size="sm"
                onPress={() => { setEditUser(item); setShowModal(true); }}
                style={styles.actionBtn}
              />
              <Button
                title="Delete"
                variant="danger"
                size="sm"
                onPress={() => handleDelete(item)}
                style={styles.actionBtn}
              />
            </View>
          </Card>
        )}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        ListEmptyComponent={<EmptyState icon="people-outline" title="No users found" />}
      />

      <UserFormModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        editUser={editUser}
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
  addBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, padding: 6 },
  list: { padding: 16, paddingBottom: 20 },
  userCard: { marginBottom: 10 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: "700", color: colors.text },
  userEmail: { fontSize: 12, color: colors.textSecondary },
  userUsername: { fontSize: 12, color: colors.textMuted },
  userMeta: { flexDirection: "row", gap: 12, marginBottom: 8 },
  metaText: { fontSize: 12, color: colors.textMuted },
  userActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  modalContent: { padding: 20, paddingBottom: 40 },
  forbidden: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  forbiddenText: { fontSize: 16, color: colors.textMuted },
});
