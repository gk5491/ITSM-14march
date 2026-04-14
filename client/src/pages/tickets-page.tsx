import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { PaginationControls } from "@/components/common/pagination-controls";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Eye,
  MessageSquare,
  RefreshCw
} from "lucide-react";
import { Category } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface TicketFilters {
  status?: string;
  priority?: string;
  categoryId?: number;
}

export default function TicketsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<TicketFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = window.innerWidth < 768;

  // Fetch user tickets
  const { data: tickets, isLoading: isLoadingTickets, refetch } = useQuery<any[]>({
    queryKey: ["/api/tickets/my"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/tickets/my");
      return await res.json();
    },
    enabled: !!user,
  });

  // Fetch categories for filters
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/categories");
      return await res.json();
    },
    enabled: !!user,
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Ticket data has been refreshed",
    });
  };

  // Get status color based on ticket status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
      case "new":
        return "bg-red-100 text-red-800";
      case "in-progress":
      case "assigned":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Filter tickets based on search query and filters
  const filteredTickets = tickets?.filter(ticket => {
    let matchesSearch = true;
    let matchesFilters = true;

    // Apply search query
    if (searchQuery) {
      matchesSearch =
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `TKT-${ticket.id.toString().padStart(4, '0')}`.includes(searchQuery);
    }

    // Apply status filter
    if (filters.status && ticket.status !== filters.status) {
      matchesFilters = false;
    }

    // Apply priority filter
    if (filters.priority && ticket.priority !== filters.priority) {
      matchesFilters = false;
    }

    // Apply category filter
    if (filters.categoryId && ticket.categoryId !== filters.categoryId) {
      matchesFilters = false;
    }

    return matchesSearch && matchesFilters;
  });

  // Calculate pagination
  const totalPages = Math.ceil((filteredTickets?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTickets = filteredTickets?.slice(startIndex, endIndex) || [];

  // Reset page when filters change
  const handleFiltersChange = (newFilters: TicketFilters) => {
    setCurrentPage(1);
    setFilters(newFilters);
  };

  const handleSearchChange = (value: string) => {
    setCurrentPage(1);
    setSearchQuery(value);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="My Tickets" />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Actions Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="mb-4 md:mb-0">
              <h2 className="text-lg font-semibold text-gray-800">My Support Tickets</h2>
              <p className="text-sm text-gray-500">View and manage your support requests</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>

              <Link href="/tickets/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Ticket
                </Button>
              </Link>
            </div>
          </div>

          {/* Tickets List */}
          {isLoadingTickets ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[...Array(5)].map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Filters */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="w-full sm:w-auto">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <Select
                        value={filters.status || "all-statuses"}
                        onValueChange={(value) => handleFiltersChange({ ...filters, status: value !== "all-statuses" ? value : undefined })}
                      >
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-statuses">All Statuses</SelectItem>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full sm:w-auto">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <Select
                        value={filters.priority || "all-priorities"}
                        onValueChange={(value) => handleFiltersChange({ ...filters, priority: value !== "all-priorities" ? value : undefined })}
                      >
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue placeholder="All Priorities" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-priorities">All Priorities</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full sm:w-auto">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <Select
                        value={filters.categoryId?.toString() || "all-categories"}
                        onValueChange={(value) => handleFiltersChange({
                          ...filters,
                          categoryId: value !== "all-categories" ? parseInt(value) : undefined
                        })}
                      >
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-categories">All Categories</SelectItem>
                          {categories?.filter(c => !c.parentId).map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full sm:w-auto ml-auto flex items-end gap-2">
                      <Button variant="outline" onClick={() => {
                        setCurrentPage(1);
                        setFilters({});
                      }}>
                        Reset Filters
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tickets List */}
              <Card>
                {filteredTickets && filteredTickets.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedTickets.map((ticket) => (
                          <tr key={ticket.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="text-sm font-mono text-gray-900">TKT-{ticket.id.toString().padStart(4, '0')}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <Link href={`/tickets/${ticket.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                                {ticket.title}
                              </Link>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <Badge variant="outline" className={getStatusColor(ticket.status)}>
                                {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`text-sm capitalize ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(ticket.createdAt)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <Link href={`/tickets/${ticket.id}`}>
                                  <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4 text-blue-600" />
                                  </Button>
                                </Link>
                                <Link href={`/tickets/${ticket.id}`}>
                                  <Button variant="ghost" size="icon" className="relative">
                                    <MessageSquare className="h-4 w-4 text-gray-600" />
                                    {ticket.commentCount > 0 && (
                                      <span className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                        {ticket.commentCount}
                                      </span>
                                    )}
                                  </Button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <CardContent className="p-12 text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                    <p className="text-gray-500 mb-6">
                      {filters.status || filters.priority || filters.categoryId || searchQuery
                        ? "Try adjusting your filters or search query"
                        : "You haven't created any support tickets yet"}
                    </p>
                    <Link href="/tickets/new">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create your first ticket
                      </Button>
                    </Link>
                  </CardContent>
                )}

                {filteredTickets && filteredTickets.length > 0 && (
                  <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                          <span className="font-medium">{Math.min(endIndex, filteredTickets.length)}</span> of{" "}
                          <span className="font-medium">{filteredTickets.length}</span> results
                        </p>
                      </div>
                      {totalPages > 1 && (
                        <PaginationControls
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={setCurrentPage}
                        />
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
