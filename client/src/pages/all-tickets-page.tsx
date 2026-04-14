import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTicketPolling } from "@/hooks/use-ticket-polling";
import { hasAnyRole } from "@/lib/role-utils";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import TicketList from "@/components/tickets/ticket-list";
import TicketFilters from "@/components/tickets/ticket-filters";
import { PaginationControls } from "@/components/common/pagination-controls";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  RefreshCw, 
  Filter,
  Ticket as TicketIcon,
  AlertCircle,
  Clock,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { Category, Ticket, User } from "@shared/schema";

interface FilterState {
  status?: string;
  priority?: string;
  categoryId?: number;
  assignedToId?: number;
  companyName?: string;
}

export default function AllTicketsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // By default, show only unassigned tickets
  const [filters, setFilters] = useState<FilterState>({
    assignedToId: 0 // 0 means Unassigned
  });

  const { user } = useAuth();
  const isMobile = window.innerWidth < 768;

  // Build query parameters for server-side filtering
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.categoryId !== undefined && filters.categoryId !== null) params.append('categoryId', filters.categoryId.toString());
    if (typeof filters.assignedToId !== 'undefined' && filters.assignedToId !== null) {
      params.append('assignedToId', filters.assignedToId.toString());
    }
    if (filters.companyName) params.append('companyName', filters.companyName);
    return params.toString();
  };

  // Construct endpoint with filters
  const endpoint = () => {
    const queryParams = buildQueryParams();
    return queryParams ? `/api/tickets?${queryParams}` : '/api/tickets';
  };

  // Use polling hook for real-time updates
  const {
    tickets,
    changedTicketIds,
    isLoading: isLoadingTickets,
    error: ticketsError,
    statusCounts,
    refetch
  } = useTicketPolling(
    endpoint(),
    3000, // Poll every 3 seconds
    !!user // Only poll when user is authenticated
  );

  // Fetch ticket categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/categories");
      return await res.json();
    },
    enabled: !!user,
  });

  // Fetch users (for assignment filter)
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      return await res.json();
    },
    enabled: !!user && hasAnyRole(user?.role, ["admin", "agent"]),
  });

  // Get ticket counts from backend response (filtered counts)
  const getTicketCounts = () => {
    if (!statusCounts) return { total: 0, open: 0, inProgress: 0, closed: 0 };

    return {
      total: tickets.length,
      open: statusCounts.open,
      inProgress: statusCounts.inProgress,
      closed: statusCounts.closed,
    };
  };

  const counts = getTicketCounts();

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  // Handle search changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on search
  };

  // Calculate pagination
  const totalPages = Math.ceil((tickets?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTickets = tickets?.slice(startIndex, endIndex) || [];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sidebar for larger screens, or as a slide-over for mobile */}
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="All Tickets" />

        {/* Main content scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                <TicketIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Support Tickets Dashboard
                </h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  Manage and track all support tickets
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Live • Auto-refresh 3s
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Search and Actions Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by ticket ID, title, description, or company..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>
              <Button
                variant="outline"
                size="default"
                onClick={() => refetch()}
                className="flex items-center gap-2 h-11 px-5 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingTickets ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Tickets"
              value={isLoadingTickets ? null : counts.total}
              icon={TicketIcon}
              gradient="from-blue-500 to-cyan-500"
              bgColor="bg-blue-50"
              textColor="text-blue-700"
              isLoading={isLoadingTickets}
            />
            <StatCard
              label="Open"
              value={isLoadingTickets ? null : counts.open}
              icon={AlertCircle}
              gradient="from-red-500 to-pink-500"
              bgColor="bg-red-50"
              textColor="text-red-700"
              isLoading={isLoadingTickets}
            />
            <StatCard
              label="In Progress"
              value={isLoadingTickets ? null : counts.inProgress}
              icon={Clock}
              gradient="from-amber-500 to-orange-500"
              bgColor="bg-amber-50"
              textColor="text-amber-700"
              isLoading={isLoadingTickets}
            />
            <StatCard
              label="Closed"
              value={isLoadingTickets ? null : counts.closed}
              icon={CheckCircle2}
              gradient="from-green-500 to-emerald-500"
              bgColor="bg-green-50"
              textColor="text-green-700"
              isLoading={isLoadingTickets}
            />
          </div>

          {/* Filters Section */}
          <Card className="border-gray-200 shadow-sm mb-6 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-base font-semibold text-gray-900">Filters</CardTitle>
              </div>
              <p className="text-xs text-gray-500 mt-1">Refine your ticket search with advanced filters</p>
            </CardHeader>
            <CardContent className="p-5">
              <TicketFilters
                categories={categories || []}
                users={users || []}
                tickets={tickets || []}
                showAssigneeFilter={true}
                initialFilters={filters}
                onFilterChange={handleFilterChange}
              />
            </CardContent>
          </Card>

          {/* Tickets List Card */}
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Tickets List</CardTitle>
                  <p className="text-xs text-gray-500 mt-1">
                    {isLoadingTickets ? (
                      <Skeleton className="h-4 w-32" />
                    ) : (
                      `Showing ${paginatedTickets.length} of ${tickets?.length || 0} tickets`
                    )}
                  </p>
                </div>
                {!isLoadingTickets && tickets && tickets.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">Page {currentPage} of {totalPages}</span>
                  </div>
                )}
              </div>
            </CardHeader>

            {isLoadingTickets ? (
              <CardContent className="p-6">
                <div className="space-y-3">
                  {[...Array(6)].map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              </CardContent>
            ) : tickets && tickets.length > 0 ? (
              <>
                <TicketList
                  key={`${searchQuery}-${JSON.stringify(filters)}-${currentPage}`}
                  tickets={paginatedTickets as any}
                  showCreatedBy={true}
                  showAssignedTo={true}
                  changedTicketIds={changedTicketIds}
                />
                {totalPages > 1 && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    <CardContent className="p-4">
                      <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    </CardContent>
                  </div>
                )}
              </>
            ) : (
              <CardContent className="p-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-gray-100 p-5 rounded-full">
                    <TicketIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets found</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">
                      {Object.keys(filters).length > 0 || searchQuery
                        ? "No tickets match your current filters or search query. Try adjusting your criteria."
                        : "There are no tickets in the system yet. Create your first ticket to get started."}
                    </p>
                  </div>
                  {(Object.keys(filters).length > 0 || searchQuery) && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchQuery("");
                        setFilters({ assignedToId: 0 });
                        setCurrentPage(1);
                      }}
                      className="mt-2"
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}

// Enhanced Stat Card Component
interface StatCardProps {
  label: string;
  value: number | null;
  icon: any;
  gradient: string;
  bgColor: string;
  textColor: string;
  isLoading?: boolean;
}

function StatCard({ label, value, icon: Icon, gradient, bgColor, textColor, isLoading }: StatCardProps) {
  return (
    <Card className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
            )}
          </div>
          <div className={`p-3 rounded-xl ${bgColor} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-6 w-6 ${textColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// import { useState } from "react";
// import { useAuth } from "@/hooks/use-auth";
// import { useTicketPolling } from "@/hooks/use-ticket-polling";
// import { hasAnyRole } from "@/lib/role-utils";
// import { useQuery } from "@tanstack/react-query";
// import { apiRequest } from "@/lib/queryClient";

// import Sidebar from "@/components/layout/sidebar";
// import Header from "@/components/layout/header";
// import TicketFilters from "@/components/tickets/ticket-filters";
// import TicketList from "@/components/tickets/ticket-list";
// import { PaginationControls } from "@/components/common/pagination-controls";

// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Skeleton } from "@/components/ui/skeleton";

// import {
//   Search, RefreshCw, AlertCircle,
//   Clock, CheckCircle2, Ticket, Sparkles
// } from "lucide-react";

// import { Category, User } from "@shared/schema";

// interface FilterState {
//   status?: string;
//   priority?: string;
//   categoryId?: number;
//   assignedToId?: number;
//   companyName?: string;
// }

// export default function AllTicketsPage() {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const ITEMS_PER_PAGE = 10;

//   const [filters, setFilters] = useState<FilterState>({ assignedToId: 0 });
//   const { user } = useAuth();

//   const isMobile = window.innerWidth < 768;

//   const { tickets, changedTicketIds, isLoading: isLoadingTickets, statusCounts, refetch } =
//     useTicketPolling("/api/tickets", 3000, !!user);

//   const { data: categories } = useQuery<Category[]>({
//     queryKey: ["/api/categories"],
//     queryFn: async () => (await apiRequest("GET", "/api/categories")).json(),
//     enabled: !!user
//   });

//   const { data: users } = useQuery<User[]>({
//     queryKey: ["/api/users"],
//     queryFn: async () => (await apiRequest("GET", "/api/users")).json(),
//     enabled: !!user && hasAnyRole(user?.role, ["admin", "agent"])
//   });

//   const counts = {
//     total: tickets?.length || 0,
//     open: statusCounts?.open || 0,
//     inProgress: statusCounts?.inProgress || 0,
//     closed: statusCounts?.closed || 0,
//   };

//   const paginated = tickets?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE) || [];
//   const totalPages = Math.ceil((tickets?.length || 0) / ITEMS_PER_PAGE);

//   return (
//     <div className="flex h-screen bg-[#F6F9FC]">
//       <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)}/>
      
//       <div className="flex-1 flex flex-col overflow-hidden">
        
//         <Header toggleSidebar={()=>setSidebarOpen(!sidebarOpen)} title="Support Tickets"/>

//         <main className="p-6 max-w-7xl mx-auto">

//           {/* PAGE TITLE */}
//           <div className="mb-8">
//             <h1 className="text-4xl font-bold text-[#0077CC]">Support Tickets Dashboard</h1>
//             <p className="text-gray-500 text-sm">Manage and track all support tickets • Live Filtering</p>
//           </div>

//           {/* SEARCH BAR */}
//           <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-3 items-center border">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
//               <Input
//                 placeholder="Search tickets by title, ID, or description..."
//                 value={searchQuery}
//                 onChange={(e)=>setSearchQuery(e.target.value)}
//                 className="pl-10 h-11 bg-white"
//               />
//             </div>
//             <Button variant="secondary" onClick={()=>refetch()} className="gap-2">
//               <RefreshCw className={`${isLoadingTickets && "animate-spin"}`} size={16}/> Refresh
//             </Button>
//           </div>

//           {/* STATS ROW */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

//             <StatCard label="Total Tickets" value={counts.total} icon={Ticket} bg="bg-[#E0F2FF]" color="text-[#0A85FF]"/>
//             <StatCard label="Open" value={counts.open} icon={AlertCircle} bg="bg-[#FFE8E8]" color="text-[#D64545]"/>
//             <StatCard label="In Progress" value={counts.inProgress} icon={Clock} bg="bg-[#FFF6D9]" color="text-[#C78A00]"/>
//             <StatCard label="Closed" value={counts.closed} icon={CheckCircle2} bg="bg-[#E2FFE8]" color="text-[#0BA13B]"/>

//           </div>

//           {/* FILTER BAR */}
//           <Card className="bg-white border rounded-xl shadow mb-6 p-5">
//             <div className="flex gap-2 items-center mb-4">
//               <Sparkles className="text-[#0A85FF]" size={16}/>
//               <h2 className="font-semibold text-gray-700">Filters</h2>
//             </div>
//             <TicketFilters
//               categories={categories||[]}
//               users={users||[]}
//               tickets={tickets||[]}
//               showAssigneeFilter
//               initialFilters={filters}
//               onFilterChange={setFilters}
//             />
//           </Card>

//           {/* LIST CARD */}
//           <Card className="border shadow bg-white rounded-xl">

//             <div className="flex justify-between items-center border-b p-4">
//               <div>
//                 <h3 className="font-semibold text-lg">Tickets List</h3>
//                 <p className="text-gray-500 text-xs">{tickets?.length} total found</p>
//               </div>
//               <div className="flex items-center gap-2 text-xs text-green-600">
//                 <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></div> Live
//               </div>
//             </div>

//             {isLoadingTickets ? (
//               <CardContent className="p-6 space-y-4">
//                 {[...Array(6)].map((_,i)=><Skeleton key={i} className="h-14 w-full rounded-md"/>)}
//               </CardContent>

//             ) : tickets?.length ? (
//               <>
//                 <TicketList tickets={paginated as any} showAssignedTo showCreatedBy changedTicketIds={changedTicketIds}/>

//                 <div className="border-t">
//                   <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}/>
//                 </div>
//               </>
//             ) : (
//               <div className="p-10 text-center text-gray-500">No tickets found</div>
//             )}

//           </Card>

//         </main>
//       </div>
//     </div>
//   );
// }


// /* 🔥 New Soft SaaS Stat Card */
// function StatCard({
//   label, value, icon:Icon, bg, color
// }:{
//   label:string, value:number, icon:any, bg:string, color:string
// }) {
//   return (
//     <div className="p-5 rounded-xl shadow bg-white border hover:scale-[1.01] transition flex justify-between items-center">
//       <div>
//         <p className="text-gray-500 text-sm">{label}</p>
//         <h2 className="text-3xl font-bold text-slate-900 mt-1">{value}</h2>
//       </div>
//       <div className={`p-3 rounded-xl ${bg}`}>
//         <Icon size={26} className={color}/>
//       </div>
//     </div>
//   );
// }
