import { useState, useRef, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react";
import { useAuth } from "@/hooks/use-auth";
import { hasAnyRole } from "@/lib/role-utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { PaginationControls } from "@/components/common/pagination-controls";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ImportDialog } from "@/components/ui/import-dialog";

// Define types locally instead of importing from schema
type PriorityStat = {
  priority: string;
  slaRate: number;
};

type DashboardStats = {
  summary?: {
    total?: number;
    open?: number;
    closed?: number;
    inProgress?: number;
  };
  avgResponseTime?: string;
  slaComplianceRate?: string;
  priorityStats?: PriorityStat[];
};

type Category = {
  id: number;
  name: string;
  parent_id?: number;
};

function exportToCSV(data: any[], filename = 'report.csv') {
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [Object.keys(data[0]).join(','), ...data.map(row => Object.values(row).join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function ReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agentPerformancePage, setAgentPerformancePage] = useState(1);
  const AGENT_PERFORMANCE_ITEMS_PER_PAGE = 5;
  const [dateRange, setDateRange] = useState("30days");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assignedToFilter, setAssignedToFilter] = useState("all");
  const [createdByFilter, setCreatedByFilter] = useState("all");
  const [createdDateFrom, setCreatedDateFrom] = useState("");
  const [createdDateTo, setCreatedDateTo] = useState("");
  const [dueDateFrom, setDueDateFrom] = useState("");
  const [dueDateTo, setDueDateTo] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = window.innerWidth < 768;

  // Build filter object for API calls
  const buildFilters = () => {
    const filters: any = {};
    if (dateRange && dateRange !== "all") filters.dateRange = dateRange;
    if (statusFilter && statusFilter !== "all") filters.status = statusFilter;
    if (priorityFilter && priorityFilter !== "all") filters.priority = priorityFilter;
    if (categoryFilter && categoryFilter !== "all") filters.categoryId = parseInt(categoryFilter);
    return filters;
  };

  // Fetch comprehensive dashboard stats with filters
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: [
      "/api/reports",
      dateRange,
      categoryFilter,
      statusFilter,
      priorityFilter,
      assignedToFilter,
      createdByFilter,
      createdDateFrom,
      createdDateTo,
      dueDateFrom,
      dueDateTo,
    ],
    queryFn: async () => {
      // Build query string from filters
      const params = new URLSearchParams();
      if (dateRange && dateRange !== "all") params.append("dateRange", dateRange);
      if (categoryFilter && categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter && priorityFilter !== "all") params.append("priority", priorityFilter);
      if (assignedToFilter && assignedToFilter !== "all") params.append("assignedTo", assignedToFilter);
      if (createdByFilter && createdByFilter !== "all") params.append("createdBy", createdByFilter);
      if (createdDateFrom) params.append("createdDateFrom", createdDateFrom);
      if (createdDateTo) params.append("createdDateTo", createdDateTo);
      if (dueDateFrom) params.append("dueDateFrom", dueDateFrom);
      if (dueDateTo) params.append("dueDateTo", dueDateTo);

      const res = await apiRequest("GET", `/api/reports?${params.toString()}`);
      return await res.json();
    },
    enabled: !!user && hasAnyRole(user?.role, ["admin", "agent"]),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch ticket volume trend data
  const { data: ticketVolumeData, isLoading: isLoadingVolume } = useQuery({
    queryKey: [
      "/api/reports/volume",
      dateRange,
      categoryFilter,
      statusFilter,
      priorityFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("type", "volume");
      if (dateRange && dateRange !== "all") params.append("dateRange", dateRange);
      if (categoryFilter && categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter && priorityFilter !== "all") params.append("priority", priorityFilter);

      const res = await apiRequest("GET", `/api/reports?${params.toString()}`);
      return await res.json();
    },
    enabled: !!user && hasAnyRole(user?.role, ["admin", "agent"]),
    refetchInterval: 30000,
  });

  // Fetch resolution time data
  const { data: resolutionTimeData, isLoading: isLoadingResolution } = useQuery({
    queryKey: [
      "/api/reports/resolution",
      dateRange,
      categoryFilter,
      statusFilter,
      priorityFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("type", "resolution");
      if (dateRange && dateRange !== "all") params.append("dateRange", dateRange);
      if (categoryFilter && categoryFilter !== "all") params.append("category", categoryFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter && priorityFilter !== "all") params.append("priority", priorityFilter);

      const res = await apiRequest("GET", `/api/reports?${params.toString()}`);
      return await res.json();
    },
    enabled: !!user && hasAnyRole(user?.role, ["admin", "agent"]),
    refetchInterval: 30000,
  });

  // Fetch category distribution data
  const { data: categoryData, isLoading: isLoadingCategories } = useQuery({
    queryKey: [
      "/api/reports/categories",
      dateRange,
      statusFilter,
      priorityFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("type", "categories");
      if (dateRange && dateRange !== "all") params.append("dateRange", dateRange);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter && priorityFilter !== "all") params.append("priority", priorityFilter);

      const res = await apiRequest("GET", `/api/reports?${params.toString()}`);
      return await res.json();
    },
    enabled: !!user && hasAnyRole(user?.role, ["admin", "agent"]),
    refetchInterval: 30000,
  });

  // Fetch SLA compliance data
  const { data: slaComplianceData, isLoading: isLoadingSLA } = useQuery({
    queryKey: [
      "/api/reports/sla",
      dateRange,
      categoryFilter,
      priorityFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("type", "sla");
      if (dateRange && dateRange !== "all") params.append("dateRange", dateRange);
      if (categoryFilter && categoryFilter !== "all") params.append("category", categoryFilter);
      if (priorityFilter && priorityFilter !== "all") params.append("priority", priorityFilter);

      const res = await apiRequest("GET", `/api/reports?${params.toString()}`);
      return await res.json();
    },
    enabled: !!user && hasAnyRole(user?.role, ["admin", "agent"]),
    refetchInterval: 30000,
  });

  // Fetch users for filters - Updated to get agents/admins only
  const { data: users, isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ["/api/users", "simple"],
    queryFn: async () => {
      try {
        console.log("Fetching agents from /api/users...");
        const res = await apiRequest("GET", "/api/users?simple=true");

        if (!res.ok) {
          console.error("Users API failed:", res.status, res.statusText);
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log("Simple users API response:", data);

        if (!Array.isArray(data)) {
          console.error("Users API returned non-array:", data);
          return [];
        }

        // Filter to only agents and admins
        const filteredUsers = data.filter((user: any) =>
          hasAnyRole(user.role, ['admin', 'agent'])
        );
        console.log("Filtered agents/admins:", filteredUsers);
        return filteredUsers;
      } catch (error) {
        console.error("Users query error:", error);
        return [];
      }
    },
    enabled: !!user && hasAnyRole(user?.role, ["admin", "agent"]),
    retry: 1,
  });

  // Separate query for all users (for Created By filter)
  const { data: allUsers } = useQuery({
    queryKey: ["/api/users", "all"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user && hasAnyRole(user?.role, ["admin", "agent"]),
  });

  // Add categories query for filter dropdowns
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/categories");
      return await res.json();
    },
    enabled: !!user && hasAnyRole(user?.role, ["admin", "agent"]),
  });

  // Enhanced agent performance query with better error handling
  const { data: agentPerformanceData, isLoading: isLoadingAgents, error: agentError } = useQuery({
    queryKey: [
      "agent-performance",
      dateRange,
      categoryFilter,
      agentFilter,
      statusFilter,
      priorityFilter,
      assignedToFilter,
      createdByFilter,
      createdDateFrom,
      createdDateTo
    ],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        params.append("type", "performance");

        // Add all filter parameters
        if (dateRange && dateRange !== "all") params.append("dateRange", dateRange);
        if (categoryFilter && categoryFilter !== "all") params.append("category", categoryFilter);
        if (agentFilter && agentFilter !== "all") params.append("agent", agentFilter);
        if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
        if (priorityFilter && priorityFilter !== "all") params.append("priority", priorityFilter);
        if (assignedToFilter && assignedToFilter !== "all") params.append("assignedTo", assignedToFilter);
        if (createdByFilter && createdByFilter !== "all") params.append("createdBy", createdByFilter);
        if (createdDateFrom) params.append("createdDateFrom", createdDateFrom);
        if (createdDateTo) params.append("createdDateTo", createdDateTo);

        const url = `/api/reports?${params.toString()}`;
        console.log("Agent Performance API URL:", url);

        const res = await apiRequest("GET", url);
        console.log("Agent Performance Response Status:", res.status, res.statusText);

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Agent Performance API Error Response:", errorText);
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        const data = await res.json();
        console.log("Agent Performance Data:", data);

        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Agent Performance Query Error:", error);
        throw error;
      }
    },
    enabled: !!user && hasAnyRole(user?.role, ["admin", "agent"]),
    retry: 1,
  });

  // Add detailed error logging
  console.log("Agent Performance Debug:", {
    isLoading: isLoadingAgents,
    error: agentError,
    errorMessage: agentError?.message,
    data: agentPerformanceData,
    hasData: agentPerformanceData && Array.isArray(agentPerformanceData) && agentPerformanceData.length > 0
  });

  console.log("Users Query Status:", {
    isLoading: isLoadingUsers,
    error: usersError,
    users: users,
    usersCount: users?.length || 0
  });

  // Simulate date range filtering (last N months) - FIX: Add null checks
  const rangeMap = {
    "7days": 3,
    "30days": 5,
    "90days": 7,
  };

  // FIX: Add proper null/undefined checks for all data arrays - MOVED INSIDE COMPONENT
  // IMPORTANT: Define safe data arrays BEFORE using them in calculations
  const safeTicketVolumeData = Array.isArray(ticketVolumeData) ? ticketVolumeData : [];
  const safeResolutionTimeData = Array.isArray(resolutionTimeData) ? resolutionTimeData : [];
  const safeCategoryData = Array.isArray(categoryData) ? categoryData : [];
  const safeAgentPerformanceData = Array.isArray(agentPerformanceData) ? agentPerformanceData : [];

  const filteredTicketVolumeData = Array.isArray(ticketVolumeData)
    ? ticketVolumeData.slice(-((rangeMap as any)[dateRange] || 6))
    : [];

  // Agent Performance Pagination
  const agentPerformanceTotalPages = Math.ceil((safeAgentPerformanceData?.length || 0) / AGENT_PERFORMANCE_ITEMS_PER_PAGE);
  const agentPerformanceStartIndex = (agentPerformancePage - 1) * AGENT_PERFORMANCE_ITEMS_PER_PAGE;
  const agentPerformanceEndIndex = agentPerformanceStartIndex + AGENT_PERFORMANCE_ITEMS_PER_PAGE;
  const paginatedAgentPerformanceData = safeAgentPerformanceData?.slice(agentPerformanceStartIndex, agentPerformanceEndIndex) || [];

  // Fix category filtering logic - FIX: Add null checks - MOVED INSIDE COMPONENT
  const filteredCategoryData = Array.isArray(categoryData)
    ? (categoryFilter === "all"
      ? categoryData
      : categoryData.filter((item: { name: any; }) => {
        const categoryMap = {
          "network": "Network Issues",
          "hardware": "Hardware",
          "email": "Email Services"
        };
        return item.name === (categoryMap as any)[categoryFilter];
      }))
    : [];

  // Filter other data based on category - FIX: Add null checks - MOVED INSIDE COMPONENT
  const filteredResolutionTimeData = Array.isArray(resolutionTimeData)
    ? (categoryFilter === "all"
      ? resolutionTimeData
      : resolutionTimeData.filter((item: { name: any; }) => {
        const categoryMap = {
          "network": "Network",
          "hardware": "Hardware",
          "email": "Email"
        };
        return item.name === (categoryMap as any)[categoryFilter];
      }))
    : [];

  // Import functionality - Handle file upload
  const handleImportFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiRequest("POST", "/api/reports?action=import", formData);

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Import Successful",
          description: `${result.imported || 0} tickets imported successfully`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
        setShowImportDialog(false);
      } else {
        const errorData = await response.json();
        toast({
          title: "Import Failed",
          description: errorData.message || "Failed to import tickets",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import Error",
        description: "An error occurred while importing tickets",
        variant: "destructive"
      });
    }
  };

  // Export functionality - Updated to use correct API endpoint
  const handleExportReport = async () => {
    try {
      // Set responseType to 'blob' for file downloads
      const response = await apiRequest("GET", "/api/reports?action=export&format=csv", null, true);

      if (response.ok) {
        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Extract filename from response headers or use default
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `tickets_export_${new Date().toISOString().split('T')[0]}.csv`;

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Export Successful",
          description: "Tickets have been exported successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Export Failed",
          description: errorData.message || "Failed to export tickets",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Error",
        description: "An error occurred while exporting tickets",
        variant: "destructive"
      });
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setDateRange("30days");
    setCompanyFilter("all");
    setAgentFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setAssignedToFilter("all");
    setCreatedByFilter("all");
    setCategoryFilter("all");
    setCreatedDateFrom("");
    setCreatedDateTo("");
    setDueDateFrom("");
    setDueDateTo("");
  };

  // Rest of your component JSX remains the same...
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for larger screens, or as a slide-over for mobile */}
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Reports" />

        {/* Main content scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              {hasAnyRole(user?.role, ["admin"]) ? "Admin" : "Agent"} Analytics
            </h2>
            <p className="text-sm text-gray-500">
              Monitor {hasAnyRole(user?.role, ["admin"]) ? "global" : "your assigned"} performance metrics and support trends
            </p>
          </div>

          {/* Role-based access check */}
          {(!user || !hasAnyRole(user?.role, ["admin", "agent"])) && (
            <Card className="mb-6">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
                <p className="text-gray-500">Reports are only available for admins and agents.</p>
              </CardContent>
            </Card>
          )}

          {user && hasAnyRole(user?.role, ["admin", "agent"]) && (
            <>
              {/* Enhanced Filters */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                      <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select date range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7days">Last 7 Days</SelectItem>
                          <SelectItem value="30days">Last 30 Days</SelectItem>
                          <SelectItem value="90days">Last 90 Days</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <Select value={companyFilter} onValueChange={setCompanyFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Companies" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Companies</SelectItem>
                          <SelectItem value="company1">Tech Corp</SelectItem>
                          <SelectItem value="company2">Business Inc</SelectItem>
                          <SelectItem value="company3">Startup Ltd</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Agent Wise</label>
                      <Select value={agentFilter} onValueChange={setAgentFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Agents" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Agents</SelectItem>
                          {users && Array.isArray(users) && users.length > 0 ? (
                            users.map((agent: any) => (
                              <SelectItem key={`agent-${agent.id}`} value={agent.id.toString()}>
                                {agent.name} ({agent.role})
                              </SelectItem>
                            ))
                          ) : isLoadingUsers ? (
                            <SelectItem value="loading" disabled>
                              Loading agents...
                            </SelectItem>
                          ) : (
                            <SelectItem value="no-agents" disabled>
                              No agents available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priority</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                      <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Assignees" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Assignees</SelectItem>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {users && Array.isArray(users) && users.length > 0 ? (
                            users.map((agent: any) => (
                              <SelectItem key={`assigned-${agent.id}`} value={agent.id.toString()}>
                                {agent.name} - {agent.role}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-assignees" disabled>
                              {isLoadingUsers ? "Loading agents..." : "No assignees found"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                      <Select value={createdByFilter} onValueChange={setCreatedByFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Creators" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Creators</SelectItem>
                          {allUsers && Array.isArray(allUsers) && allUsers.length > 0 ? (
                            allUsers.map((user: any) => (
                              <SelectItem key={`creator-${user.id}`} value={user.id.toString()}>
                                {user.name} - {user.email}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="loading" disabled>
                              Loading users...
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories && Array.isArray(categories) && categories.length > 0 ? (
                            categories
                              .filter((cat) => !cat.parent_id) // Only show parent categories
                              .map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))
                          ) : (
                            <>
                              <SelectItem value="network">Network Issues</SelectItem>
                              <SelectItem value="hardware">Hardware</SelectItem>
                              <SelectItem value="email">Email Services</SelectItem>
                              <SelectItem value="software">Software</SelectItem>
                              <SelectItem value="access">Access Control</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Date Filters</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Created Date From</label>
                        <Input
                          type="date"
                          value={createdDateFrom}
                          onChange={(e) => setCreatedDateFrom(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Created Date To</label>
                        <Input
                          type="date"
                          value={createdDateTo}
                          onChange={(e) => setCreatedDateTo(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date From</label>
                        <Input
                          type="date"
                          value={dueDateFrom}
                          onChange={(e) => setDueDateFrom(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date To</label>
                        <Input
                          type="date"
                          value={dueDateTo}
                          onChange={(e) => setDueDateTo(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        Use filters above to customize your report data
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={resetFilters}>
                        Reset Filters
                      </Button>

                      <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import Data
                      </Button>

                      <Button onClick={handleExportReport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Overview Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Tickets Volume Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Ticket Volume Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-64">
                      {isLoadingVolume ? (
                        <div className="flex items-center justify-center h-full">
                          <Skeleton className="h-48 w-full" />
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={filteredTicketVolumeData || []}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="tickets"
                              stroke="#1976d2"
                              activeDot={{ r: 8 }}
                              name="Tickets"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-gray-500 text-sm">Total Tickets</p>
                        <p className="text-xl font-semibold text-gray-800">
                          {isLoadingStats ? <Skeleton className="h-8 w-16 mx-auto" /> : stats?.summary?.total || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Avg. Daily</p>
                        <p className="text-xl font-semibold text-gray-800">
                          {isLoadingStats ? <Skeleton className="h-8 w-16 mx-auto" /> :
                            stats?.summary?.total ? Math.round(stats.summary.total / 30) : 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Open</p>
                        <p className="text-xl font-semibold text-orange-600">
                          {isLoadingStats ? <Skeleton className="h-8 w-16 mx-auto" /> : stats?.summary?.open || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Resolution Time Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Resolution Time by Category</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-64">
                      {isLoadingResolution ? (
                        <div className="flex items-center justify-center h-full">
                          <Skeleton className="h-48 w-full" />
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={filteredResolutionTimeData || []}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar
                              dataKey="avgTime"
                              fill="#1976d2"
                              name="Avg Hours"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-gray-500 text-sm">Avg. Resolution</p>
                        <p className="text-xl font-semibold text-gray-800">
                          {isLoadingStats ? <Skeleton className="h-8 w-16 mx-auto" /> : stats?.avgResponseTime || "0h"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">SLA Met</p>
                        <p className="text-xl font-semibold text-green-600">
                          {isLoadingStats ? <Skeleton className="h-8 w-16 mx-auto" /> : stats?.slaComplianceRate || "0%"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Closed Today</p>
                        <p className="text-xl font-semibold text-green-600">
                          {isLoadingStats ? <Skeleton className="h-8 w-16 mx-auto" /> : stats?.summary?.closed || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Category Distribution and Team Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Category Distribution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Ticket Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-64">
                      {isLoadingCategories ? (
                        <div className="flex items-center justify-center h-full">
                          <Skeleton className="h-48 w-48 rounded-full mx-auto" />
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={filteredCategoryData || []}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {(filteredCategoryData || []).map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="mt-4">
                      {(filteredCategoryData || []).slice(0, 3).map((item: any, index: number) => (
                        <div key={item.name}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">{item.name}</span>
                            <span className="text-sm font-medium text-gray-800">
                              {item.count} ({Math.round((item.count / (stats?.summary?.total || 1)) * 100)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                                width: `${Math.round((item.count / (stats?.summary?.total || 1)) * 100)}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Agent Performance - Keep existing implementation */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Agent Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Time</th>
                            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SLA Met</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoadingAgents ? (
                            // Loading skeleton rows
                            Array.from({ length: 3 }).map((_, index) => (
                              <tr key={`skeleton-${index}`} className="border-b border-gray-100">
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <Skeleton className="w-8 h-8 rounded-full mr-2" />
                                    <Skeleton className="h-4 w-24" />
                                  </div>
                                </td>
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <Skeleton className="h-4 w-8" />
                                </td>
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <Skeleton className="h-4 w-12" />
                                </td>
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <Skeleton className="h-4 w-10" />
                                </td>
                              </tr>
                            ))
                          ) : safeAgentPerformanceData && safeAgentPerformanceData.length > 0 ? (
                            // Real agent data - using paginated data
                            paginatedAgentPerformanceData.map((agent: any) => (
                              <tr key={agent.id} className="border-b border-gray-100">
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center text-blue-600 mr-2">
                                      {agent.name?.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium">{agent.name}</div>
                                      {agent.department && (
                                        <div className="text-xs text-gray-500">{agent.department}</div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-3 whitespace-nowrap text-sm">
                                  <div>
                                    <div className="font-medium">{agent.tickets}</div>
                                    <div className="text-xs text-gray-500">
                                      {agent.activeTickets} active
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-3 whitespace-nowrap text-sm">
                                  {agent.avgTime > 0 ? `${agent.avgTime}h` : 'N/A'}
                                </td>
                                <td className="py-3 px-3 whitespace-nowrap text-sm">
                                  <span className={agent.slaMet >= 95 ? "text-green-600" : agent.slaMet >= 90 ? "text-yellow-600" : "text-red-600"}>
                                    {agent.slaMet}%
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-gray-500">
                                {agentError ? 'Error loading agent data' : 'No agent performance data available for selected filters.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      {agentPerformanceTotalPages > 1 && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                          <PaginationControls
                            currentPage={agentPerformancePage}
                            totalPages={agentPerformanceTotalPages}
                            onPageChange={setAgentPerformancePage}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* SLA Compliance */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">SLA Compliance Trend</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-52">
                    {isLoadingSLA ? (
                      <div className="flex items-center justify-center h-full">
                        <Skeleton className="h-48 w-full" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={Array.isArray(slaComplianceData) ? slaComplianceData : []}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="compliance"
                            stroke="#43a047"
                            activeDot={{ r: 8 }}
                            name="Compliance %"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-gray-500 text-sm">High Priority</p>
                        <p className="text-xl font-semibold text-green-600">
                          {stats?.priorityStats?.find((p) => p.priority === 'high')?.slaRate || 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Medium Priority</p>
                        <p className="text-xl font-semibold text-green-600">
                          {stats?.priorityStats?.find((p) => p.priority === 'medium')?.slaRate || 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Low Priority</p>
                        <p className="text-xl font-semibold text-green-600">
                          {stats?.priorityStats?.find((p) => p.priority === 'low')?.slaRate || 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Import Dialog */}
              <ImportDialog
                open={showImportDialog}
                onOpenChange={setShowImportDialog}
                onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/reports"] })}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
