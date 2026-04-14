import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { ticketsApi } from "../../../src/api/tickets";
import { Input } from "../../../src/components/ui/Input";
import { Button } from "../../../src/components/ui/Button";
import { Select } from "../../../src/components/ui/Select";
import { colors } from "../../../src/utils/colors";

const PRIORITIES = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const SUPPORT_TYPES = [
  { label: "Remote", value: "remote" },
  { label: "Onsite", value: "onsite" },
  { label: "Hybrid", value: "hybrid" },
];

export default function NewTicketScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("medium");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [supportType, setSupportType] = useState<string>("remote");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: ticketsApi.getCategories,
  });

  const categoryOptions = (categories || [])
    .filter((c) => !c.parentId)
    .map((c) => ({ label: c.name, value: c.id }));

  const mutation = useMutation({
    mutationFn: ticketsApi.create,
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      Alert.alert("Success", "Ticket created successfully!", [
        { text: "View Ticket", onPress: () => router.replace(`/(app)/tickets/${ticket.id}`) },
        { text: "Create Another", onPress: () => {
          setTitle(""); setDescription(""); setPriority("medium"); setCategoryId(undefined);
        }},
      ]);
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.response?.data?.message || "Failed to create ticket");
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (title.trim().length < 5) newErrors.title = "Title must be at least 5 characters";
    if (!description.trim()) newErrors.description = "Description is required";
    if (description.trim().length < 10) newErrors.description = "Please provide more details";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    mutation.mutate({
      title: title.trim(),
      description: description.trim(),
      priority,
      categoryId,
      supportType,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Ticket</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="Ticket Title *"
            value={title}
            onChangeText={setTitle}
            placeholder="Brief summary of the issue"
            error={errors.title}
          />

          <Input
            label="Description *"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue in detail..."
            multiline
            numberOfLines={5}
            error={errors.description}
          />

          <Select
            label="Priority"
            value={priority}
            onValueChange={(v) => setPriority(String(v))}
            options={PRIORITIES}
          />

          <Select
            label="Support Type"
            value={supportType}
            onValueChange={(v) => setSupportType(String(v))}
            options={SUPPORT_TYPES}
          />

          {categoryOptions.length > 0 && (
            <Select
              label="Category"
              value={categoryId}
              onValueChange={(v) => setCategoryId(Number(v))}
              options={[{ label: "No Category", value: "" }, ...categoryOptions]}
              placeholder="Select category (optional)"
            />
          )}

          <Button
            title="Submit Ticket"
            onPress={handleSubmit}
            loading={mutation.isPending}
            style={styles.submitBtn}
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  content: { padding: 20, paddingBottom: 40 },
  submitBtn: { marginTop: 8 },
});
