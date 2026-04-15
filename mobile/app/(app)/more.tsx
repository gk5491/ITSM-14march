import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/utils/colors";

type NavItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  route: string;
  color: string;
  adminOnly?: boolean;
  agentOrAdminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    icon: "construct-outline",
    label: "Site Engineering",
    description: "Attendance, reports & leaves",
    route: "/(app)/site-engg",
    color: "#6366f1",
  },
  {
    icon: "chatbubble-ellipses-outline",
    label: "AI Assistant",
    description: "Chat with AI support bot",
    route: "/(app)/chatbot",
    color: "#0ea5e9",
  },
  {
    icon: "help-circle-outline",
    label: "Knowledge Base",
    description: "FAQs and help articles",
    route: "/(app)/knowledge-base",
    color: "#10b981",
  },
  {
    icon: "document-text-outline",
    label: "Documentation",
    description: "User guides and manuals",
    route: "/(app)/documentation",
    color: "#f59e0b",
  },
  {
    icon: "settings-outline",
    label: "Settings",
    description: "Profile and account security",
    route: "/(app)/settings",
    color: "#64748b",
  },
  {
    icon: "people-outline",
    label: "User Management",
    description: "Manage system users",
    route: "/(app)/admin/users",
    color: "#f59e0b",
    adminOnly: true,
  },
  {
    icon: "pricetag-outline",
    label: "Categories",
    description: "Ticket categories",
    route: "/(app)/admin/categories",
    color: "#8b5cf6",
    adminOnly: true,
  },
  {
    icon: "bug-outline",
    label: "Bug Reports",
    description: "View and manage bugs",
    route: "/(app)/bug-reports",
    color: "#ef4444",
  },
  {
    icon: "bar-chart-outline",
    label: "Reports",
    description: "Analytics and exports",
    route: "/(app)/admin/reports",
    color: "#14b8a6",
    adminOnly: true,
  },
];

export default function MoreScreen() {
  const { user, isAdmin, isAgent } = useAuth();
  const router = useRouter();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.agentOrAdminOnly && !isAdmin && !isAgent) return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.userBanner}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {(user?.name || user?.username || "U")
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || user?.username}</Text>
            <Text style={styles.userRole}>{user?.role?.toUpperCase()} · {user?.email}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(app)/profile")}
            style={styles.editProfileBtn}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>FEATURES</Text>
        <View style={styles.grid}>
          {visibleItems.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={styles.gridItem}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color + "18" }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.gridLabel}>{item.label}</Text>
              <Text style={styles.gridDesc} numberOfLines={2}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.quickLinks}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push("/(app)/settings")}
            activeOpacity={0.8}
          >
            <View style={[styles.linkIcon, { backgroundColor: colors.primary + "18" }]}>
              <Ionicons name="person-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.linkContent}>
              <Text style={styles.linkLabel}>Settings</Text>
              <Text style={styles.linkDesc}>Update your account details</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  content: { padding: 16, paddingBottom: 40 },
  userBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
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
  userRole: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  editProfileBtn: { padding: 4 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  gridItem: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  gridLabel: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 4 },
  gridDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 16 },
  quickLinks: { gap: 8 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  linkContent: { flex: 1 },
  linkLabel: { fontSize: 14, fontWeight: "600", color: colors.text },
  linkDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
