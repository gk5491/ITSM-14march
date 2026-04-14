import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CheckIn } from "../../types";
import { colors } from "../../utils/colors";

interface CheckInOutButtonProps {
  checkIn: CheckIn | null;
  onCheckIn: () => void;
  onCheckOut: () => void;
  loading?: boolean;
  locationStatus?: string;
}

export function CheckInOutButton({
  checkIn,
  onCheckIn,
  onCheckOut,
  loading = false,
  locationStatus = "idle",
}: CheckInOutButtonProps) {
  const isCheckedIn = checkIn && !checkIn.checkOutTime;
  const isComplete = checkIn && !!checkIn.checkOutTime;

  const isGettingLocation =
    locationStatus === "requesting" || locationStatus === "fetching";

  if (isComplete) {
    return (
      <View style={styles.completeContainer}>
        <Ionicons name="checkmark-circle" size={32} color={colors.success} />
        <Text style={styles.completeTitle}>Attendance Recorded</Text>
        <Text style={styles.completeSubtext}>
          You have completed your attendance for today
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isGettingLocation && (
        <View style={styles.locationStatus}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.locationText}>
            {locationStatus === "requesting"
              ? "Requesting location permission..."
              : "Getting your GPS location..."}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={isCheckedIn ? onCheckOut : onCheckIn}
        disabled={loading || isGettingLocation}
        style={[
          styles.button,
          isCheckedIn ? styles.checkOutButton : styles.checkInButton,
          (loading || isGettingLocation) && styles.buttonDisabled,
        ]}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <>
            <View style={styles.iconContainer}>
              <Ionicons
                name={isCheckedIn ? "log-out-outline" : "log-in-outline"}
                size={36}
                color="#fff"
              />
            </View>
            <Text style={styles.buttonTitle}>
              {isCheckedIn ? "Check Out" : "Check In"}
            </Text>
            <Text style={styles.buttonSubtext}>
              {isCheckedIn
                ? "Tap to record your checkout time"
                : "Tap to record your attendance"}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.gpsInfo}>
        <Ionicons name="location-outline" size={13} color={colors.textMuted} />
        <Text style={styles.gpsText}>
          GPS location will be captured automatically
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  locationStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary + "10",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "500",
    flex: 1,
  },
  button: {
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    gap: 8,
  },
  checkInButton: {
    backgroundColor: colors.success,
  },
  checkOutButton: {
    backgroundColor: colors.danger,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  buttonTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
  },
  buttonSubtext: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
  },
  gpsInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 12,
  },
  gpsText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  completeContainer: {
    alignItems: "center",
    backgroundColor: colors.success + "10",
    borderRadius: 20,
    padding: 32,
    borderWidth: 2,
    borderColor: colors.success + "30",
    marginBottom: 16,
    gap: 8,
  },
  completeTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.success,
  },
  completeSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
