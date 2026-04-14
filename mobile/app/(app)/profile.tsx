import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { usersApi } from "../../src/api/users";
import { Card } from "../../src/components/ui/Card";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { colors, getRoleColor } from "../../src/utils/colors";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordMutation = useMutation({
    mutationFn: () => usersApi.changePassword(user!.id, newPassword),
    onSuccess: () => {
      Alert.alert("Success", "Password changed successfully");
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: () => Alert.alert("Error", "Failed to change password"),
  });

  const handleChangePassword = () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    passwordMutation.mutate();
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  if (!user) return null;

  const roleColor = getRoleColor(user.role);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: roleColor }]}>
              <Text style={styles.avatarText}>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: roleColor + "20", borderColor: roleColor }]}>
              <Text style={[styles.roleText, { color: roleColor }]}>
                {user.role.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <InfoRow icon="person-outline" label="Full Name" value={user.name} />
          <InfoRow icon="at-outline" label="Username" value={user.username} />
          <InfoRow icon="mail-outline" label="Email" value={user.email} />
          {user.companyName && (
            <InfoRow icon="business-outline" label="Company" value={user.companyName} />
          )}
          {user.department && (
            <InfoRow icon="briefcase-outline" label="Department" value={user.department} />
          )}
          {user.location && (
            <InfoRow icon="location-outline" label="Location" value={user.location} />
          )}
        </Card>

        <Card>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowPasswordForm(!showPasswordForm)}
          >
            <Text style={styles.sectionTitle}>Change Password</Text>
            <Ionicons
              name={showPasswordForm ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          {showPasswordForm && (
            <View style={styles.passwordForm}>
              <Input
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Enter new password"
              />
              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Confirm new password"
              />
              <Button
                title="Update Password"
                onPress={handleChangePassword}
                loading={passwordMutation.isPending}
              />
            </View>
          )}
        </Card>

        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
          style={styles.logoutBtn}
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
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
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  profileCard: { alignItems: "center", paddingVertical: 28 },
  avatarContainer: { alignItems: "center", marginBottom: 16 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: { fontSize: 28, fontWeight: "800", color: "#fff" },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleText: { fontSize: 12, fontWeight: "800" },
  name: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 4 },
  username: { fontSize: 14, color: colors.textMuted, marginBottom: 4 },
  email: { fontSize: 14, color: colors.textSecondary },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: colors.textMuted, fontWeight: "500" },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: "600", marginTop: 2 },
  passwordForm: { marginTop: 16, gap: 4 },
  logoutBtn: { marginTop: 8 },
});
