import apiClient from "./client";

export interface Engineer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  location?: string;
}

export interface CheckIn {
  id: number;
  engineerId: number;
  checkInTime: string;
  checkOutTime?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  status: string;
}

export interface WorkReport {
  id: number;
  engineerId: number;
  clientId?: number;
  siteId?: number;
  reportDate: string;
  workSummary: string;
  hoursWorked?: number;
  status: string;
  clientName?: string;
  siteName?: string;
}

export interface LeaveRequest {
  id: number;
  engineerId: number;
  startDate: string;
  endDate: string;
  reason: string;
  leaveType: string;
  status: "pending" | "approved" | "rejected";
  engineerName?: string;
}

export interface Assignment {
  id: number;
  engineerId: number;
  clientId: number;
  siteId?: number;
  startDate?: string;
  endDate?: string;
  clientName?: string;
  siteName?: string;
}

export const siteEnggApi = {
  getEngineers: async (): Promise<Engineer[]> => {
    const res = await apiClient.get("/api/site-engg/engineers");
    return res.data;
  },

  getClients: async () => {
    const res = await apiClient.get("/api/site-engg/clients");
    return res.data;
  },

  getSites: async () => {
    const res = await apiClient.get("/api/site-engg/sites");
    return res.data;
  },

  checkIn: async (data: {
    latitude?: number;
    longitude?: number;
    address?: string;
  }): Promise<CheckIn> => {
    const res = await apiClient.post("/api/site-engg/check-ins", {
      ...data,
      checkInTime: new Date().toISOString(),
    });
    return res.data;
  },

  checkOut: async (
    checkInId: number,
    data: { latitude?: number; longitude?: number; address?: string }
  ): Promise<CheckIn> => {
    const res = await apiClient.patch(
      `/api/site-engg/check-ins/${checkInId}/checkout`,
      {
        ...data,
        checkOutTime: new Date().toISOString(),
      }
    );
    return res.data;
  },

  getTodayCheckIn: async (): Promise<CheckIn | null> => {
    const res = await apiClient.get("/api/site-engg/check-ins/today");
    return res.data;
  },

  getCheckIns: async (params?: {
    date?: string;
    engineerId?: number;
  }): Promise<CheckIn[]> => {
    const res = await apiClient.get("/api/site-engg/check-ins", { params });
    return res.data;
  },

  getReports: async (params?: {
    date?: string;
    engineerId?: number;
  }): Promise<WorkReport[]> => {
    const res = await apiClient.get("/api/site-engg/reports", { params });
    return res.data;
  },

  submitReport: async (data: {
    reportDate: string;
    workSummary: string;
    hoursWorked?: number;
    clientId?: number;
    siteId?: number;
  }): Promise<WorkReport> => {
    const res = await apiClient.post("/api/site-engg/reports", data);
    return res.data;
  },

  getLeaves: async (params?: {
    engineerId?: number;
  }): Promise<LeaveRequest[]> => {
    const res = await apiClient.get("/api/site-engg/leaves", { params });
    return res.data;
  },

  submitLeave: async (data: {
    startDate: string;
    endDate: string;
    reason: string;
    leaveType: string;
  }): Promise<LeaveRequest> => {
    const res = await apiClient.post("/api/site-engg/leaves", data);
    return res.data;
  },

  updateLeaveStatus: async (
    id: number,
    status: "approved" | "rejected"
  ): Promise<LeaveRequest> => {
    const res = await apiClient.patch(`/api/site-engg/leaves/${id}`, {
      status,
    });
    return res.data;
  },

  getAssignments: async (params?: {
    engineerId?: number;
  }): Promise<Assignment[]> => {
    const res = await apiClient.get("/api/site-engg/assignments", { params });
    return res.data;
  },

  getMusterRoll: async (params: { month: number; year: number }) => {
    const res = await apiClient.get("/api/site-engg/muster-roll", { params });
    return res.data;
  },
};
