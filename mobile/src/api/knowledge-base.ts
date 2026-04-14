import apiClient from "./client";

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  categoryId?: number;
  createdAt: string;
  updatedAt?: string;
  category?: { id: number; name: string };
}

export const knowledgeBaseApi = {
  getFaqs: async (params?: { search?: string; categoryId?: number }): Promise<FAQ[]> => {
    const res = await apiClient.get("/api/faqs", { params });
    return res.data;
  },

  getFaqById: async (id: number): Promise<FAQ> => {
    const res = await apiClient.get(`/api/faqs/${id}`);
    return res.data;
  },

  createFaq: async (data: { question: string; answer: string; categoryId?: number; isPublished?: boolean }): Promise<FAQ> => {
    const res = await apiClient.post("/api/faqs", data);
    return res.data;
  },

  updateFaq: async (id: number, data: Partial<FAQ>): Promise<FAQ> => {
    const res = await apiClient.patch(`/api/faqs/${id}`, data);
    return res.data;
  },
};
