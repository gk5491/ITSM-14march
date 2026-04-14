export const colors = {
  primary: "#1e40af",
  primaryLight: "#3b82f6",
  primaryDark: "#1e3a8a",
  secondary: "#64748b",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  background: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",

  statusOpen: "#3b82f6",
  statusInProgress: "#f59e0b",
  statusResolved: "#22c55e",
  statusClosed: "#64748b",

  priorityLow: "#22c55e",
  priorityMedium: "#f59e0b",
  priorityHigh: "#ef4444",

  roleAdmin: "#7c3aed",
  roleAgent: "#2563eb",
  roleUser: "#0891b2",
  roleHR: "#059669",
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "open": return colors.statusOpen;
    case "in_progress": return colors.statusInProgress;
    case "resolved": return colors.statusResolved;
    case "closed": return colors.statusClosed;
    default: return colors.secondary;
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "low": return colors.priorityLow;
    case "medium": return colors.priorityMedium;
    case "high": return colors.priorityHigh;
    default: return colors.secondary;
  }
};

export const getRoleColor = (role: string) => {
  switch (role) {
    case "admin": return colors.roleAdmin;
    case "agent": return colors.roleAgent;
    case "user": return colors.roleUser;
    case "hr": return colors.roleHR;
    default: return colors.secondary;
  }
};
