import { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/utils/colors";
import { LoadingScreen } from "../../src/components/ui/LoadingScreen";

export default function AppLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/(auth)/login");
    }
  }, [user, isLoading]);

  if (isLoading) return <LoadingScreen />;
  if (!user) return null;

  const isAdminOrAgent = user.role === "admin" || user.role === "agent";
  const isAdmin = user.role === "admin";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700", fontSize: 18 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tickets/index"
        options={{
          title: "Tickets",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ticket-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tickets/new"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="tickets/[id]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="site-engg/index"
        options={{
          title: "Site-Engg",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="site-engg/attendance"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="site-engg/reports"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="site-engg/leaves"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="site-engg/muster"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="knowledge-base"
        options={{
          title: "KB",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="help-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="documentation"
        options={{
          title: "Docs",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin/users"
        options={{
          title: "Users",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
          href: isAdmin ? "/(app)/admin/users" : null,
        }}
      />
      <Tabs.Screen
        name="admin/categories"
        options={{
          title: "Categories",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag-outline" size={size} color={color} />
          ),
          href: isAdmin ? "/(app)/admin/categories" : null,
        }}
      />
      <Tabs.Screen
        name="admin/bug-reports"
        options={{
          title: "Bugs",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bug-outline" size={size} color={color} />
          ),
          href: isAdmin ? "/(app)/admin/bug-reports" : null,
        }}
      />
      <Tabs.Screen
        name="admin/reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
          href: isAdmin ? "/(app)/admin/reports" : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
