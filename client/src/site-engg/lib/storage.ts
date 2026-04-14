import type { User, Client, Site, Assignment, CheckIn, DailyReport, LeaveRequest } from '../types';

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`/api/site-engg${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
}

export const StorageService = {
  getUsers: async (): Promise<User[]> => {
    try {
      return await apiRequest('/profiles');
    } catch {
      return [];
    }
  },

  getEngineers: async () => {
    try {
      return await apiRequest('/engineers');
    } catch {
      return [];
    }
  },

  getClients: async (): Promise<Client[]> => {
    try {
      return await apiRequest('/clients');
    } catch {
      return [];
    }
  },

  getSites: async (): Promise<Site[]> => {
    try {
      return await apiRequest('/sites');
    } catch {
      return [];
    }
  },

  getAssignments: async (): Promise<Assignment[]> => {
    try {
      return await apiRequest('/assignments');
    } catch {
      return [];
    }
  },

  getCheckIns: async (): Promise<CheckIn[]> => {
    try {
      return await apiRequest('/check-ins');
    } catch {
      return [];
    }
  },

  getDailyReports: async (): Promise<DailyReport[]> => {
    try {
      return await apiRequest('/reports');
    } catch {
      return [];
    }
  },

  getLeaveRequests: async (): Promise<LeaveRequest[]> => {
    try {
      return await apiRequest('/leaves');
    } catch {
      return [];
    }
  },

  addUser: async (user: User) => {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: user.email,
        fullName: user.name,
        role: user.role,
        phone: user.phone,
        password: 'password123',
      }),
    });
  },

  createCheckIn: async (checkIn: Omit<CheckIn, 'id' | 'createdAt'>) => {
    return apiRequest('/check-ins', {
      method: 'POST',
      body: JSON.stringify({
        latitude: checkIn.latitude,
        longitude: checkIn.longitude,
        locationName: checkIn.locationName,
      }),
    });
  },

  updateCheckIn: async (id: string, updates: Partial<CheckIn>) => {
    if (updates.checkOutTime) {
      return apiRequest(`/check-ins/${id}/checkout`, {
        method: 'PUT',
      });
    }
    return null;
  },

  createDailyReport: async (report: Omit<DailyReport, 'id' | 'createdAt'>) => {
    return apiRequest('/reports', {
      method: 'POST',
      body: JSON.stringify({
        clientId: report.clientId,
        siteId: report.siteId,
        workDone: report.workDone,
        issues: report.issues,
      }),
    });
  },

  createLeaveRequest: async (leave: Omit<LeaveRequest, 'id' | 'createdAt'>) => {
    return apiRequest('/leaves', {
      method: 'POST',
      body: JSON.stringify({
        startDate: leave.startDate,
        endDate: leave.endDate,
        reason: leave.reason,
      }),
    });
  },

  updateLeaveRequest: async (id: string, updates: Partial<LeaveRequest>) => {
    return apiRequest(`/leaves/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  createAssignment: async (assignment: Omit<Assignment, 'id' | 'createdAt'>) => {
    return apiRequest('/assignments', {
      method: 'POST',
      body: JSON.stringify({
        engineerId: assignment.engineerId,
        clientId: assignment.clientId,
        siteId: assignment.siteId,
        assignedDate: assignment.assignedDate,
      }),
    });
  },

  createClient: async (client: Omit<Client, 'id' | 'createdAt'>) => {
    return apiRequest('/clients', {
      method: 'POST',
      body: JSON.stringify({
        name: client.name,
        contactPerson: client.contactPerson,
        email: client.email,
        phone: client.phone,
        userId: client.userId,
      }),
    });
  },

  createSite: async (site: Omit<Site, 'id' | 'createdAt'>) => {
    return apiRequest('/sites', {
      method: 'POST',
      body: JSON.stringify({
        clientId: site.clientId,
        name: site.name,
        location: site.location,
      }),
    });
  },
};
