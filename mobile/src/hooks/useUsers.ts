import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { usersApi } from "../api/users";
import { User } from "../types";
import { useAuth } from "../context/AuthContext";

export function useUsers() {
  const { isAgent } = useAuth();
  return useQuery({
    queryKey: ["users"],
    queryFn: usersApi.getAll,
    enabled: isAgent,
    staleTime: 60000,
  });
}

export function useAgents() {
  const { isAgent } = useAuth();
  return useQuery({
    queryKey: ["users"],
    queryFn: usersApi.getAll,
    enabled: isAgent,
    select: (users) =>
      users.filter((u) => u.role === "agent" || u.role === "admin"),
    staleTime: 60000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      username: string;
      password: string;
      name: string;
      email: string;
      role: string;
      companyName?: string;
      department?: string;
      location?: string;
    }) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.response?.data?.message || "Failed to create user");
    },
  });
}

export function useUpdateUser(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.response?.data?.message || "Failed to update user");
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => {
      Alert.alert("Error", "Failed to delete user");
    },
  });
}

export function useChangePassword(userId: number) {
  return useMutation({
    mutationFn: (password: string) =>
      usersApi.changePassword(userId, password),
    onError: () => {
      Alert.alert("Error", "Failed to change password");
    },
  });
}

export function useAgentPerformance() {
  const { isAgent } = useAuth();
  return useQuery({
    queryKey: ["agent-performance"],
    queryFn: usersApi.getAgentPerformance,
    enabled: isAgent,
    staleTime: 120000,
  });
}
