import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/utils/colors";

const SECTIONS = [
  {
    id: "overview",
    title: "System Overview",
    icon: "grid-outline" as const,
    content: "The ITSM Helpdesk Portal is a comprehensive IT service management system designed for Cybaemtech. It provides ticket tracking, user management, knowledge base, and site engineering modules to streamline IT support operations.",
  },
  {
    id: "login",
    title: "Getting Started / Login",
    icon: "log-in-outline" as const,
    content: "1. Open the app and enter your username and password.\n2. Tap Sign In to access your dashboard.\n3. Your role (Admin, Agent, HR, or User) determines what features you can access.\n\nDemo Accounts:\n• admin / admin123 (Admin access)\n• agent / agent123 (Agent access)\n• user / user123 (User access)",
  },
  {
    id: "tickets",
    title: "Tickets",
    icon: "ticket-outline" as const,
    content: "Creating a Ticket:\n1. Go to the Tickets tab.\n2. Tap the + button to create a new ticket.\n3. Fill in the title, description, priority, and category.\n4. Submit the ticket.\n\nViewing Tickets:\n• Users see their own tickets.\n• Agents see tickets assigned to them.\n• Admins see all tickets.\n\nUpdating Status:\n• Open a ticket and use the edit controls to change status, priority, or assignee.\n• Add comments to communicate with the support team.",
  },
  {
    id: "site-engg",
    title: "Site Engineering",
    icon: "construct-outline" as const,
    content: "The Site Engineering module handles field operations:\n\n• Attendance: Check in/out with GPS location verification. View your attendance history.\n\n• Daily Reports: Submit work summaries, hours worked, and associated clients for each day.\n\n• Leave Management: Apply for Sick, Casual, Earned, or Emergency leave. Admins and HR can approve or reject requests.\n\n• Muster Roll (Admin/HR): View monthly attendance overview for all engineers.",
  },
  {
    id: "knowledge-base",
    title: "Knowledge Base",
    icon: "help-circle-outline" as const,
    content: "The Knowledge Base contains FAQs and how-to articles:\n\n1. Navigate to the KB tab.\n2. Search for keywords or browse by category.\n3. Tap any article to read the full answer.\n\nAdmins can create and manage KB articles from the web application.",
  },
  {
    id: "admin",
    title: "Admin Features",
    icon: "settings-outline" as const,
    content: "Admin-only features accessible from the tabs:\n\n• Users: Create, edit, and delete user accounts. Assign roles (Admin, Agent, HR, User).\n\n• Categories: Manage ticket categories and subcategories.\n\n• Reports: View system-wide analytics — ticket counts, resolution rates, agent performance.\n\n• Bug Reports: Track and manage system bug reports submitted by users.",
  },
  {
    id: "profile",
    title: "Profile & Settings",
    icon: "person-outline" as const,
    content: "From the Profile tab you can:\n\n• View your account details — name, email, role, company, and department.\n\n• Change Password: Enter your new password and confirm to update your credentials.\n\n• Sign Out: Tap Logout to securely end your session.",
  },
];

export default function DocumentationScreen() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Documentation</Text>
        <Text style={styles.headerSub}>ITSM Helpdesk Portal — User Guide v1.0</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.introText}>
            This guide covers all features of the ITSM Helpdesk mobile app. Tap a section to expand it.
          </Text>
        </View>

        {SECTIONS.map((section) => {
          const isOpen = expanded === section.id;
          return (
            <View key={section.id} style={styles.section}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggle(section.id)} activeOpacity={0.7}>
                <View style={styles.sectionIconWrap}>
                  <Ionicons name={section.icon} size={20} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Ionicons
                  name={isOpen ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
              {isOpen && (
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionText}>{section.content}</Text>
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Cybaemtech ITSM Helpdesk Portal · Version 1.0</Text>
          <Text style={styles.footerText}>Last updated: January 2025</Text>
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
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  content: { padding: 16, paddingBottom: 40, gap: 10 },
  intro: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.primary + "10",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  introText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 20 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.text },
  sectionContent: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
    backgroundColor: colors.background,
  },
  sectionText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  footer: {
    alignItems: "center",
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  footerText: { fontSize: 12, color: colors.textMuted },
});
