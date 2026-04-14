import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Comment } from "../../types";
import { Card } from "../ui/Card";
import { colors } from "../../utils/colors";
import { format } from "date-fns";

interface CommentItemProps {
  comment: Comment;
}

export function CommentItem({ comment }: CommentItemProps) {
  const isInternal = comment.isInternal;

  return (
    <Card
      style={[
        styles.card,
        isInternal && styles.internalCard,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.authorSection}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: isInternal
                  ? colors.warning + "30"
                  : colors.primary + "20",
              },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                { color: isInternal ? colors.warning : colors.primary },
              ]}
            >
              {(comment.user?.name || "U").charAt(0).toUpperCase()}
            </Text>
          </View>

          <View>
            <View style={styles.nameRow}>
              <Text style={styles.authorName}>
                {comment.user?.name || "User"}
              </Text>
              {comment.user?.role && (
                <View style={styles.rolePill}>
                  <Text style={styles.roleText}>
                    {comment.user.role.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.date}>
              {format(new Date(comment.createdAt), "MMM d, yyyy · HH:mm")}
            </Text>
          </View>
        </View>

        {isInternal && (
          <View style={styles.internalBadge}>
            <Ionicons name="lock-closed" size={10} color={colors.warning} />
            <Text style={styles.internalText}>Internal</Text>
          </View>
        )}
      </View>

      <Text style={styles.content}>{comment.content}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    padding: 14,
  },
  internalCard: {
    backgroundColor: "#fffbeb",
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  authorSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "800",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  authorName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  rolePill: {
    backgroundColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 9,
    fontWeight: "800",
    color: colors.textMuted,
  },
  date: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  internalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.warning + "20",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  internalText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.warning,
  },
  content: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
});
