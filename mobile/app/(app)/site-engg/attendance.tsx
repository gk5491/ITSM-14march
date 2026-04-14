import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { siteEnggApi, CheckIn } from "../../../src/api/site-engg";
import { Card } from "../../../src/components/ui/Card";
import { Button } from "../../../src/components/ui/Button";
import { colors } from "../../../src/utils/colors";
import { format } from "date-fns";

export default function AttendanceScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [locationStatus, setLocationStatus] = useState<string>("idle");
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);

  const { data: todayCheckIn, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["checkIn", "today"],
    queryFn: siteEnggApi.getTodayCheckIn,
  });

  const { data: history } = useQuery({
    queryKey: ["checkIns"],
    queryFn: () => siteEnggApi.getCheckIns(),
  });

  const checkInMutation = useMutation({
    mutationFn: siteEnggApi.checkIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkIn"] });
      queryClient.invalidateQueries({ queryKey: ["checkIns"] });
      Alert.alert("Checked In!", "Your attendance has been recorded successfully.");
    },
    onError: (e: any) => Alert.alert("Error", e?.response?.data?.message || "Failed to check in"),
  });

  const checkOutMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; latitude?: number; longitude?: number; address?: string }) =>
      siteEnggApi.checkOut(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkIn"] });
      queryClient.invalidateQueries({ queryKey: ["checkIns"] });
      Alert.alert("Checked Out!", "See you tomorrow!");
    },
    onError: (e: any) => Alert.alert("Error", e?.response?.data?.message || "Failed to check out"),
  });

  const getLocation = async () => {
    setLocationStatus("requesting");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationStatus("denied");
        Alert.alert(
          "Permission Denied",
          "Location permission is required for attendance verification. You can still check in without GPS."
        );
        return null;
      }
      setLocationStatus("fetching");
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

      let address = "";
      try {
        const [geo] = await Location.reverseGeocodeAsync(loc.coords);
        address = [geo.street, geo.city, geo.region].filter(Boolean).join(", ");
      } catch {}

      const result = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        address,
      };
      setCurrentLocation(result);
      setLocationStatus("ready");
      return result;
    } catch (err) {
      setLocationStatus("error");
      return null;
    }
  };

  const handleCheckIn = async () => {
    const loc = await getLocation();
    checkInMutation.mutate(loc || {});
  };

  const handleCheckOut = async () => {
    if (!todayCheckIn) return;
    const loc = await getLocation();
    checkOutMutation.mutate({ id: todayCheckIn.id, ...(loc || {}) });
  };

  const isCheckedIn = !!todayCheckIn && !todayCheckIn.checkOutTime;
  const isLoading2 = checkInMutation.isPending || checkOutMutation.isPending;

  const recentHistory = (history || []).slice(0, 10);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isCheckedIn ? colors.success : colors.textMuted }]} />
            <Text style={styles.statusText}>
              {isCheckedIn ? "Checked In" : "Not Checked In"}
            </Text>
          </View>

          <Text style={styles.dateText}>
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </Text>

          {todayCheckIn && (
            <View style={styles.timeInfo}>
              <View style={styles.timeBlock}>
                <Ionicons name="log-in-outline" size={18} color={colors.success} />
                <View>
                  <Text style={styles.timeLabel}>Check In</Text>
                  <Text style={styles.timeValue}>
                    {format(new Date(todayCheckIn.checkInTime), "HH:mm a")}
                  </Text>
                </View>
              </View>
              {todayCheckIn.checkOutTime && (
                <View style={styles.timeBlock}>
                  <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                  <View>
                    <Text style={styles.timeLabel}>Check Out</Text>
                    <Text style={styles.timeValue}>
                      {format(new Date(todayCheckIn.checkOutTime), "HH:mm a")}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {todayCheckIn?.address && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.locationText}>{todayCheckIn.address}</Text>
            </View>
          )}
        </Card>

        {locationStatus === "fetching" || locationStatus === "requesting" ? (
          <Card style={styles.locationCard}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.locationStatus}>Getting your location...</Text>
          </Card>
        ) : currentLocation ? (
          <Card style={styles.locationCard}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.locationStatus}>Location obtained</Text>
            {currentLocation.address && (
              <Text style={styles.locationAddr}>{currentLocation.address}</Text>
            )}
          </Card>
        ) : null}

        {!todayCheckIn && (
          <Button
            title="Check In Now"
            onPress={handleCheckIn}
            loading={isLoading2}
            size="lg"
            style={styles.actionBtn}
          />
        )}

        {isCheckedIn && (
          <Button
            title="Check Out"
            onPress={handleCheckOut}
            loading={isLoading2}
            variant="danger"
            size="lg"
            style={styles.actionBtn}
          />
        )}

        {todayCheckIn?.checkOutTime && (
          <Card style={styles.completeCard}>
            <Ionicons name="checkmark-circle" size={28} color={colors.success} />
            <Text style={styles.completeText}>Attendance Complete for Today</Text>
          </Card>
        )}

        {recentHistory.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Recent History</Text>
            {recentHistory.map((item) => (
              <Card key={item.id} style={styles.historyCard}>
                <View style={styles.historyRow}>
                  <Text style={styles.historyDate}>
                    {format(new Date(item.checkInTime), "EEE, MMM d")}
                  </Text>
                  <View style={[styles.historyStatus, { backgroundColor: item.checkOutTime ? colors.success + "20" : colors.warning + "20" }]}>
                    <Text style={[styles.historyStatusText, { color: item.checkOutTime ? colors.success : colors.warning }]}>
                      {item.checkOutTime ? "Complete" : "Incomplete"}
                    </Text>
                  </View>
                </View>
                <View style={styles.historyTimes}>
                  <Text style={styles.historyTime}>
                    In: {format(new Date(item.checkInTime), "HH:mm")}
                  </Text>
                  {item.checkOutTime && (
                    <Text style={styles.historyTime}>
                      Out: {format(new Date(item.checkOutTime), "HH:mm")}
                    </Text>
                  )}
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  content: { padding: 16, paddingBottom: 40 },
  statusCard: { marginBottom: 16 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 16, fontWeight: "700", color: colors.text },
  dateText: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
  timeInfo: { flexDirection: "row", gap: 24, marginBottom: 12 },
  timeBlock: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeLabel: { fontSize: 11, color: colors.textMuted },
  timeValue: { fontSize: 16, fontWeight: "700", color: colors.text },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationText: { fontSize: 12, color: colors.textMuted, flex: 1 },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    paddingVertical: 12,
  },
  locationStatus: { fontSize: 14, color: colors.text, fontWeight: "600" },
  locationAddr: { fontSize: 12, color: colors.textMuted, flex: 1 },
  actionBtn: { marginBottom: 16 },
  completeCard: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 24,
    marginBottom: 16,
    backgroundColor: colors.success + "08",
    borderWidth: 1.5,
    borderColor: colors.success + "40",
  },
  completeText: { fontSize: 16, fontWeight: "700", color: colors.success },
  historySection: { marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 },
  historyCard: { marginBottom: 8, padding: 12 },
  historyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  historyDate: { fontSize: 14, fontWeight: "600", color: colors.text },
  historyStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  historyStatusText: { fontSize: 11, fontWeight: "700" },
  historyTimes: { flexDirection: "row", gap: 16 },
  historyTime: { fontSize: 13, color: colors.textSecondary },
});
