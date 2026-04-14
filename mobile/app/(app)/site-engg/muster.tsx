import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { siteEnggApi } from "../../../src/api/site-engg";
import { Card } from "../../../src/components/ui/Card";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { LoadingScreen } from "../../../src/components/ui/LoadingScreen";
import { colors } from "../../../src/utils/colors";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function MusterRollScreen() {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: muster, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["muster-roll", month, year],
    queryFn: () => siteEnggApi.getMusterRoll({ month, year }),
  });

  const goToPrevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const goToNextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const records: any[] = Array.isArray(muster) ? muster : [];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Muster Roll</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.monthNav}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {MONTHS[month - 1]} {year}
        </Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item, i) => String(item.engineerId || i)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.engineerCard}>
              <View style={styles.engineerHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(item.name || "E").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.engineerInfo}>
                  <Text style={styles.engineerName}>{item.name || "Engineer"}</Text>
                  <Text style={styles.engineerDept}>{item.department || ""}</Text>
                </View>
                <View style={styles.summaryBox}>
                  <Text style={styles.daysPresent}>{item.daysPresent || 0}</Text>
                  <Text style={styles.daysPresentLabel}>Days Present</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <StatBox label="Absent" value={item.daysAbsent || 0} color={colors.danger} />
                <StatBox label="Leaves" value={item.leavesApproved || 0} color={colors.warning} />
                <StatBox label="Late" value={item.lateCheckIns || 0} color={colors.info} />
              </View>
            </Card>
          )}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="grid-outline"
              title="No attendance data"
              message="No records found for this month"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.statBox, { borderColor: color + "40" }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    gap: 24,
  },
  navBtn: { padding: 8 },
  monthLabel: { fontSize: 16, fontWeight: "700", color: colors.text },
  list: { padding: 16, paddingBottom: 20 },
  engineerCard: { marginBottom: 10 },
  engineerHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "800", color: "#fff" },
  engineerInfo: { flex: 1 },
  engineerName: { fontSize: 15, fontWeight: "700", color: colors.text },
  engineerDept: { fontSize: 12, color: colors.textSecondary },
  summaryBox: { alignItems: "center" },
  daysPresent: { fontSize: 24, fontWeight: "900", color: colors.success },
  daysPresentLabel: { fontSize: 10, color: colors.textMuted },
  statsRow: { flexDirection: "row", gap: 8 },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
});
