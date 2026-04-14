import apiClient from "./client";
import { Category } from "./tickets";

export const categoriesAdminApi = {
  getAll: async (): Promise<Category[]> => {
    const res = await apiClient.get("/api/categories");
    return res.data;
  },

  create: async (data: { name: string; description?: string; parentId?: number }): Promise<Category> => {
    const res = await apiClient.post("/api/categories", data);
    return res.data;
  },

  update: async (id: number, data: { name: string; description?: string; parentId?: number }): Promise<Category> => {
    const res = await apiClient.put(`/api/categories/${id}`, data);
    return res.data;
  },

  delete: async (id: number) => {
    const res = await apiClient.delete(`/api/categories/${id}`);
    return res.data;
  },
};
