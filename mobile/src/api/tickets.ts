import apiClient from "./client";

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  supportType?: string;
  companyName?: string;
  location?: string;
  categoryId?: number;
  createdById: number;
  assignedToId?: number;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  category?: { id: number; name: string };
  createdBy?: { id: number; name: string; email: string };
  assignedTo?: { id: number; name: string; email: string };
  comments?: Comment[];
}

export interface Comment {
  id: number;
  ticketId: number;
  userId: number;
  content: string;
  isInternal: boolean;
  createdAt: string;
  user?: { id: number; name: string; role: string };
}

export interface Category {
  id: number;
  name: string;
  parentId?: number;
}

export const ticketsApi = {
  getAll: async (params?: {
    status?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Ticket[]> => {
    const res = await apiClient.get("/api/tickets", { params });
    return res.data;
  },

  getMy: async (): Promise<Ticket[]> => {
    const res = await apiClient.get("/api/tickets/my");
    return res.data;
  },

  getById: async (id: number): Promise<Ticket> => {
    const res = await apiClient.get(`/api/tickets/${id}`);
    return res.data;
  },

  create: async (data: {
    title: string;
    description: string;
    priority: string;
    categoryId?: number;
    supportType?: string;
    companyName?: string;
    location?: string;
  }): Promise<Ticket> => {
    const res = await apiClient.post("/api/tickets", data);
    return res.data;
  },

  update: async (
    id: number,
    data: Partial<{
      status: string;
      priority: string;
      assignedToId: number;
      title: string;
      description: string;
      categoryId: number;
    }>
  ): Promise<Ticket> => {
    const res = await apiClient.patch(`/api/tickets/${id}`, data);
    return res.data;
  },

  delete: async (id: number) => {
    const res = await apiClient.delete(`/api/tickets/${id}`);
    return res.data;
  },

  addComment: async (
    ticketId: number,
    content: string,
    isInternal = false
  ): Promise<Comment> => {
    const res = await apiClient.post(`/api/tickets/${ticketId}/comments`, {
      content,
      isInternal,
    });
    return res.data;
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get("/api/categories");
    return res.data;
  },

  getDashboard: async () => {
    const res = await apiClient.get("/api/dashboard");
    return res.data;
  },
};
