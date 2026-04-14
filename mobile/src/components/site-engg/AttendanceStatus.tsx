import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CheckIn } from "../../types";
import { Card } from "../ui/Card";
import { colors } from "../../utils/colors";
import { format, differenceInHours, differenceInMinutes } from "date-fns";

interface AttendanceStatusProps {
  checkIn: CheckIn | null;
  isLoading?: boolean;
}

function WorkDuration({ checkIn }: { checkIn: CheckIn }) {
  const start = new Date(checkIn.checkInTime);
  const end = checkIn.checkOutTime ? new Date(checkIn.checkOutTime) : new Date();
  const totalMinutes = differenceInMinutes(end, start);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <Text style={styles.duration}>
      {hours}h {minutes}m {checkIn.checkOutTime ? "worked" : "so far"}
    </Text>
  );
}

export function AttendanceStatus({ checkIn, isLoading }: AttendanceStatusProps) {
  if (isLoading) {
    return (
      <Card style={styles.card}>
        <Text style={styles.loadingText}>Checking attendance...</Text>
      </Card>
    );
  }

  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  if (!checkIn) {
    return (
      <Card style={[styles.card, styles.notCheckedIn]}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: colors.textMuted }]} />
          <Text style={styles.statusText}>Not Checked In</Text>
        </View>
        <Text style={styles.dateText}>{today}</Text>
        <Text style={styles.hintText}>
          Tap "Check In Now" below to record your attendance
        </Text>
      </Card>
    );
  }

  const isCheckedIn = !checkIn.checkOutTime;
  const isComplete = !!checkIn.checkOutTime;

  return (
    <Card style={[styles.card, isComplete ? styles.complete : styles.active]}>
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isComplete ? colors.success : colors.warning },
          ]}
        />
        <Text style={styles.statusText}>
          {isComplete ? "Attendance Complete" : "Checked In"}
        </Text>
        {isCheckedIn && (
          <View style={styles.livePill}>
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      <Text style={styles.dateText}>{today}</Text>

      <View style={styles.timesRow}>
        <View style={styles.timeBlock}>
          <View style={styles.timeIcon}>
            <Ionicons name="log-in-outline" size={18} color={colors.success} />
          </View>
          <View>
            <Text style={styles.timeLabel}>Check In</Text>
            <Text style={styles.timeValue}>
              {format(new Date(checkIn.checkInTime), "hh:mm a")}
            </Text>
          </View>
        </View>

        <View style={styles.timeSeparator}>
          <View style={styles.timeLine} />
        </View>

        {checkIn.checkOutTime ? (
          <View style={styles.timeBlock}>
            <View style={styles.timeIcon}>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            </View>
            <View>
              <Text style={styles.timeLabel}>Check Out</Text>
              <Text style={styles.timeValue}>
                {format(new Date(checkIn.checkOutTime), "hh:mm a")}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.timeBlock}>
            <View style={[styles.timeIcon, { backgroundColor: colors.textMuted + "20" }]}>
              <Ionicons name="hourglass-outline" size={18} color={colors.textMuted} />
            </View>
            <View>
              <Text style={styles.timeLabel}>Check Out</Text>
              <Text style={[styles.timeValue, { color: colors.textMuted }]}>
                Pending
              </Text>
            </View>
          </View>
        )}
      </View>

      <WorkDuration checkIn={checkIn} />

      {checkIn.address && (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={colors.textMuted} />
          <Text style={styles.locationText} numberOfLines={1}>
            {checkIn.address}
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  notCheckedIn: {
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  active: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  complete: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    backgroundColor: colors.success + "05",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    flex: 1,
  },
  livePill: {
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
  },
  dateText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  hintText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
    lineHeight: 18,
  },
  timesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 0,
  },
  timeBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  timeLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
  },
  timeValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  timeSeparator: {
    width: 24,
    alignItems: "center",
  },
  timeLine: {
    width: 16,
    height: 1.5,
    backgroundColor: colors.border,
  },
  duration: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
  },
});
