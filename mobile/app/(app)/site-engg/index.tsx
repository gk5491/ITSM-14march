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
import { useAuth } from "../../../src/context/AuthContext";
import { Card } from "../../../src/components/ui/Card";
import { colors } from "../../../src/utils/colors";

function ModuleCard({
  icon,
  title,
  description,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.moduleCard}>
        <View style={[styles.moduleIcon, { backgroundColor: color + "15" }]}>
          <Ionicons name={icon} size={28} color={color} />
        </View>
        <View style={styles.moduleContent}>
          <Text style={styles.moduleTitle}>{title}</Text>
          <Text style={styles.moduleDesc}>{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Card>
    </TouchableOpacity>
  );
}

export default function SiteEnggIndexScreen() {
  const { user, isHR, isAdmin, isAgent } = useAuth();
  const router = useRouter();

  const isEngineer = user?.role === "agent" || user?.role === "user";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Site Engineering</Text>
        <Text style={styles.headerSub}>Field Operations Module</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.roleTag}>
          <Ionicons name="person-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.roleTagText}>
            {user?.name} · {user?.role?.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>MY ACTIONS</Text>

        <ModuleCard
          icon="location-outline"
          title="Attendance"
          description="Check in/out with GPS verification"
          color={colors.success}
          onPress={() => router.push("/(app)/site-engg/attendance")}
        />

        <ModuleCard
          icon="document-text-outline"
          title="Daily Reports"
          description="Submit and view work progress reports"
          color={colors.info}
          onPress={() => router.push("/(app)/site-engg/reports")}
        />

        <ModuleCard
          icon="calendar-outline"
          title="Leave Management"
          description="Apply for leaves and track approvals"
          color={colors.warning}
          onPress={() => router.push("/(app)/site-engg/leaves")}
        />

        {(isHR || isAdmin) && (
          <>
            <Text style={styles.sectionLabel}>HR / ADMIN</Text>
            <ModuleCard
              icon="grid-outline"
              title="Muster Roll"
              description="Monthly attendance tracking for all engineers"
              color={colors.primary}
              onPress={() => router.push("/(app)/site-engg/muster")}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  content: { padding: 16, paddingBottom: 40 },
  roleTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary + "10",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  roleTagText: { fontSize: 13, fontWeight: "600", color: colors.primary },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  moduleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 10,
    paddingVertical: 18,
  },
  moduleIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  moduleContent: { flex: 1 },
  moduleTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  moduleDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
