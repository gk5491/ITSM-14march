import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { siteEnggApi } from "../api/site-engg";
import { LeaveStatus } from "../types";

export function useTodayCheckIn() {
  return useQuery({
    queryKey: ["checkIn", "today"],
    queryFn: siteEnggApi.getTodayCheckIn,
    staleTime: 30000,
  });
}

export function useCheckInHistory(params?: { date?: string; engineerId?: number }) {
  return useQuery({
    queryKey: ["checkIns", params],
    queryFn: () => siteEnggApi.getCheckIns(params),
    staleTime: 60000,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { latitude?: number; longitude?: number; address?: string }) =>
      siteEnggApi.checkIn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkIn"] });
      queryClient.invalidateQueries({ queryKey: ["checkIns"] });
    },
    onError: (err: any) => {
      Alert.alert("Check-In Failed", err?.response?.data?.message || "Failed to record check-in");
    },
  });
}

export function useCheckOut(checkInId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { latitude?: number; longitude?: number; address?: string }) =>
      siteEnggApi.checkOut(checkInId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkIn"] });
      queryClient.invalidateQueries({ queryKey: ["checkIns"] });
    },
    onError: (err: any) => {
      Alert.alert("Check-Out Failed", err?.response?.data?.message || "Failed to record check-out");
    },
  });
}

export function useWorkReports(params?: { date?: string; engineerId?: number }) {
  return useQuery({
    queryKey: ["site-engg-reports", params],
    queryFn: () => siteEnggApi.getReports(params),
    staleTime: 60000,
  });
}

export function useSubmitReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      reportDate: string;
      workSummary: string;
      hoursWorked?: number;
      clientId?: number;
      siteId?: number;
    }) => siteEnggApi.submitReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-engg-reports"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.response?.data?.message || "Failed to submit report");
    },
  });
}

export function useLeaves(params?: { engineerId?: number }) {
  return useQuery({
    queryKey: ["site-engg-leaves", params],
    queryFn: () => siteEnggApi.getLeaves(params),
    staleTime: 60000,
  });
}

export function useSubmitLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      startDate: string;
      endDate: string;
      reason: string;
      leaveType: string;
    }) => siteEnggApi.submitLeave(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-engg-leaves"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.response?.data?.message || "Failed to submit leave request");
    },
  });
}

export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "approved" | "rejected" }) =>
      siteEnggApi.updateLeaveStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-engg-leaves"] });
    },
    onError: () => {
      Alert.alert("Error", "Failed to update leave status");
    },
  });
}

export function useEngineers() {
  return useQuery({
    queryKey: ["site-engg-engineers"],
    queryFn: siteEnggApi.getEngineers,
    staleTime: 300000,
  });
}

export function useClients() {
  return useQuery({
    queryKey: ["site-engg-clients"],
    queryFn: siteEnggApi.getClients,
    staleTime: 300000,
  });
}

export function useSites() {
  return useQuery({
    queryKey: ["site-engg-sites"],
    queryFn: siteEnggApi.getSites,
    staleTime: 300000,
  });
}

export function useAssignments(params?: { engineerId?: number }) {
  return useQuery({
    queryKey: ["site-engg-assignments", params],
    queryFn: () => siteEnggApi.getAssignments(params),
    staleTime: 60000,
  });
}

export function useMusterRoll(month: number, year: number) {
  return useQuery({
    queryKey: ["muster-roll", month, year],
    queryFn: () => siteEnggApi.getMusterRoll({ month, year }),
    staleTime: 60000,
  });
}
