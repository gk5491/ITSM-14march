import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  size?: "sm" | "md";
}

export function Badge({ label, color = "#e2e8f0", textColor = "#0f172a", size = "md" }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color + "20", borderColor: color }, size === "sm" && styles.sm]}>
      <Text style={[styles.text, { color }, size === "sm" && styles.smText]}>
        {label.replace("_", " ").toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  sm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  smText: {
    fontSize: 9,
  },
});
