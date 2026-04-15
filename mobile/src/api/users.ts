import apiClient from "./client";
import { User } from "./auth";

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const res = await apiClient.get("/api/users");
    return res.data;
  },

  create: async (data: {
    username: string;
    password: string;
    name: string;
    email: string;
    role: string;
    companyName?: string;
    department?: string;
    location?: string;
  }): Promise<User> => {
    const res = await apiClient.post("/api/users", data);
    return res.data;
  },

  update: async (id: number, data: Partial<User>): Promise<User> => {
    const res = await apiClient.put(`/api/users/${id}`, data);
    return res.data;
  },

  delete: async (id: number) => {
    const res = await apiClient.delete(`/api/users/${id}`);
    return res.data;
  },

  changePassword: async (id: number, password: string) => {
    const res = await apiClient.put(`/api/users/${id}`, { password });
    return res.data;
  },

  getAgentPerformance: async () => {
    const res = await apiClient.get("/api/reports/agent-performance");
    return res.data;
  },
};
