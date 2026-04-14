export type UserRole = "admin" | "agent" | "user" | "hr";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type TicketPriority = "low" | "medium" | "high";

export type SupportType = "remote" | "onsite" | "hybrid" | "phone" | "email";

export type LeaveStatus = "pending" | "approved" | "rejected";

export type LeaveType = "sick" | "casual" | "earned" | "emergency" | "other";

export type CheckInStatus = "checked_in" | "checked_out";

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  companyName?: string;
  department?: string;
  location?: string;
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  parentId?: number;
  subcategories?: Category[];
}

export interface Comment {
  id: number;
  ticketId: number;
  userId: number;
  content: string;
  isInternal: boolean;
  createdAt: string;
  user?: Pick<User, "id" | "name" | "role">;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  supportType?: SupportType;
  companyName?: string;
  location?: string;
  categoryId?: number;
  createdById: number;
  assignedToId?: number;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  category?: Pick<Category, "id" | "name">;
  createdBy?: Pick<User, "id" | "name" | "email">;
  assignedTo?: Pick<User, "id" | "name" | "email">;
  comments?: Comment[];
}

export interface DashboardStats {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  total?: number;
  highPriority?: number;
  mediumPriority?: number;
  lowPriority?: number;
}

export interface AgentPerformance {
  id: number;
  name: string;
  email: string;
  totalTickets: number;
  resolved: number;
  inProgress: number;
  open: number;
  avgResolutionDays?: number;
}

export interface CheckIn {
  id: number;
  engineerId: number;
  checkInTime: string;
  checkOutTime?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  status?: CheckInStatus;
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
  engineerName?: string;
}

export interface LeaveRequest {
  id: number;
  engineerId: number;
  startDate: string;
  endDate: string;
  reason: string;
  leaveType: LeaveType;
  status: LeaveStatus;
  engineerName?: string;
  approvedBy?: number;
  approvedAt?: string;
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
  engineerName?: string;
}

export interface Client {
  id: number;
  name?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Site {
  id: number;
  name: string;
  clientId?: number;
  address?: string;
  city?: string;
}

export interface MusterRecord {
  engineerId: number;
  name: string;
  department?: string;
  daysPresent: number;
  daysAbsent: number;
  leavesApproved: number;
  lateCheckIns: number;
  totalWorkingDays: number;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  categoryId?: number;
  viewCount: number;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface TicketFilters {
  status?: TicketStatus | "all";
  priority?: TicketPriority | "all";
  search?: string;
  assignedToId?: number;
  categoryId?: number;
  page?: number;
  limit?: number;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  priority: TicketPriority;
  categoryId?: number;
  supportType?: SupportType;
  companyName?: string;
  location?: string;
}

export interface UpdateTicketPayload {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: number;
  title?: string;
  description?: string;
  categoryId?: number;
  dueDate?: string;
}
