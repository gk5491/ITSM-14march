import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { ticketsApi } from "../api/tickets";
import { TicketFilters, CreateTicketPayload, UpdateTicketPayload } from "../types";
import { useAuth } from "../context/AuthContext";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: ticketsApi.getDashboard,
    staleTime: 60000,
  });
}

export function useTickets(filters?: TicketFilters) {
  const { isAgent } = useAuth();
  return useQuery({
    queryKey: ["tickets", "all", filters],
    queryFn: () => ticketsApi.getAll(filters),
    enabled: isAgent,
  });
}

export function useMyTickets() {
  return useQuery({
    queryKey: ["tickets", "my"],
    queryFn: ticketsApi.getMy,
    staleTime: 30000,
  });
}

export function useTicket(id: number | undefined) {
  return useQuery({
    queryKey: ["ticket", id],
    queryFn: () => ticketsApi.getById(id!),
    enabled: !!id,
    staleTime: 15000,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => ticketsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.response?.data?.message || "Failed to create ticket");
    },
  });
}

export function useUpdateTicket(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTicketPayload) => ticketsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.response?.data?.message || "Failed to update ticket");
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ticketsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => {
      Alert.alert("Error", "Failed to delete ticket");
    },
  });
}

export function useAddComment(ticketId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ content, isInternal }: { content: string; isInternal?: boolean }) =>
      ticketsApi.addComment(ticketId, content, isInternal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
    },
    onError: () => {
      Alert.alert("Error", "Failed to post comment");
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: ticketsApi.getCategories,
    staleTime: 300000,
  });
}
