import apiClient from "./client";

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: "admin" | "agent" | "user" | "hr" | string;
  companyName?: string;
  department?: string;
  location?: string;
}

export const authApi = {
  login: async (username: string, password: string): Promise<User> => {
    const res = await apiClient.post("/api/login", { username, password });
    return res.data;
  },

  logout: async () => {
    await apiClient.post("/api/logout");
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get("/api/user");
    return res.data;
  },

  register: async (data: {
    username: string;
    password: string;
    name: string;
    email: string;
  }): Promise<User> => {
    const res = await apiClient.post("/api/register", data);
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await apiClient.post("/api/forgot-password", { email });
    return res.data;
  },
};
