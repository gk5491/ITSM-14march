import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import apiClient from "../../src/api/client";
import { colors } from "../../src/utils/colors";
import { format } from "date-fns";

interface ChatMessage {
  id: number;
  message?: string;
  content?: string;
  role?: "user" | "assistant";
  isFromBot?: boolean;
  isBot?: boolean;
  ticketCreated?: boolean;
  createdAt?: string;
  timestamp?: string;
}

const chatApi = {
  getMessages: async (): Promise<ChatMessage[]> => {
    const res = await apiClient.get("/api/chat");
    return res.data;
  },
  sendMessage: async (message: string): Promise<ChatMessage[]> => {
    const res = await apiClient.post("/api/chat", { message });
    return res.data;
  },
};

export default function ChatbotScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat"],
    queryFn: chatApi.getMessages,
  });

  const sendMutation = useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chat"] });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    },
    onError: () => Alert.alert("Error", "Failed to send message. Please try again."),
  });

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMutation.mutate(text);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.messageRow, isBotMessage(item) ? styles.botRow : styles.userRow]}>
      {isBotMessage(item) && (
        <View style={styles.botAvatar}>
          <Ionicons name="hardware-chip-outline" size={16} color="#fff" />
        </View>
      )}
      <View style={[styles.bubble, isBotMessage(item) ? styles.botBubble : styles.userBubble]}>
        <Text style={[styles.messageText, isBotMessage(item) ? styles.botText : styles.userText]}>
          {item.message || item.content}
        </Text>
        {item.ticketCreated && (
          <View style={styles.ticketCreatedBadge}>
            <Ionicons name="checkmark-circle" size={13} color={colors.success} />
            <Text style={styles.ticketCreatedText}>Ticket created automatically</Text>
          </View>
        )}
        <Text style={[styles.timeText, isBotMessage(item) ? styles.botTime : styles.userTime]}>
          {format(new Date(item.createdAt || item.timestamp || Date.now()), "HH:mm")}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.botIconSmall}>
            <Ionicons name="hardware-chip-outline" size={16} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <Text style={styles.headerSub}>Powered by Claude AI</Text>
          </View>
        </View>
        <View style={styles.onlineDot} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading chat history...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.messageList}
            ListHeaderComponent={
              messages.length === 0 ? (
                <View style={styles.welcomeContainer}>
                  <View style={styles.welcomeIcon}>
                    <Ionicons name="hardware-chip-outline" size={40} color={colors.primary} />
                  </View>
                  <Text style={styles.welcomeTitle}>Hi! I'm your IT Assistant</Text>
                  <Text style={styles.welcomeText}>
                    I can help you with support tickets, answer questions about IT issues, or guide you through the helpdesk portal.
                  </Text>
                  <View style={styles.suggestionList}>
                    {[
                      "How do I create a ticket?",
                      "My computer won't start",
                      "I can't access my email",
                      "Request software installation",
                    ].map((suggestion) => (
                      <TouchableOpacity
                        key={suggestion}
                        style={styles.suggestion}
                        onPress={() => {
                          setInput(suggestion);
                        }}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                        <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : null
            }
            renderItem={renderMessage}
          />
        )}

        {sendMutation.isPending && (
          <View style={styles.typingIndicator}>
            <View style={styles.botAvatarSmall}>
              <Ionicons name="hardware-chip-outline" size={12} color="#fff" />
            </View>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.typingText}>AI is typing...</Text>
            </View>
          </View>
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything about IT support..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sendMutation.isPending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function isBotMessage(message: ChatMessage) {
  return message.isBot || message.isFromBot || message.role === "assistant";
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  botIconSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.7)" },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ade80",
  },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: colors.textSecondary, fontSize: 14 },
  messageList: { padding: 16, paddingBottom: 8 },
  welcomeContainer: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 8 },
  welcomeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary + "30",
  },
  welcomeTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 8 },
  welcomeText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  suggestionList: { width: "100%", gap: 8 },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionText: { fontSize: 13, color: colors.text, fontWeight: "500", flex: 1 },
  messageRow: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end" },
  botRow: { justifyContent: "flex-start" },
  userRow: { justifyContent: "flex-end" },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 12,
  },
  botBubble: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
  },
  messageText: { fontSize: 14, lineHeight: 20 },
  botText: { color: colors.text },
  userText: { color: "#fff" },
  ticketCreatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ticketCreatedText: { fontSize: 11, color: colors.success, fontWeight: "600" },
  timeText: { fontSize: 10, marginTop: 4 },
  botTime: { color: colors.textMuted },
  userTime: { color: "rgba(255,255,255,0.6)" },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  botAvatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typingText: { fontSize: 13, color: colors.textSecondary, fontStyle: "italic" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 10 : 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    maxHeight: 100,
    backgroundColor: colors.background,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
});
