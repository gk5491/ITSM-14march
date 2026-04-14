import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { hasRole, hasAnyRole } from "@/lib/role-utils";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getBasePath } from "@/lib/get-base-path";
import { formatDistanceToNow } from "date-fns";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import CommentThread from "@/components/tickets/comment-thread";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  Tag,
  User,
  Clock,
  CheckCircle,
  ExternalLink,
  Paperclip,
  Download
} from "lucide-react";
import { TicketWithRelations } from "@shared/schema";

export default function TicketDetailPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = window.innerWidth < 768;
  const basePath = getBasePath();

  // Extract ticket ID from URL
  const ticketId = location.split("/").pop();

  // Get the referrer path from sessionStorage
  const referrer = sessionStorage.getItem('ticketReferrer') || '/tickets';

  // Fetch ticket details with relations
  const {
    data: ticket,
    isLoading: isLoadingTicket,
    error
  } = useQuery<TicketWithRelations>({
    queryKey: [`/api/tickets`, ticketId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/tickets/${ticketId}`);
      return await res.json();
    },
    enabled: !!user && !!ticketId,
  });

  // Fetch users for assignment dropdown
  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      return await res.json();
    },
    enabled: !!user,
  });

  // Mutation for updating ticket status
  const updateTicketMutation = useMutation({
    mutationFn: async ({ status, assignedToId, priority }: { status?: string; assignedToId?: number | null; priority?: string }) => {
      const res = await apiRequest("PUT", `/api/tickets/${ticketId}`, {
        status,
        assignedToId,
        priority
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets`, ticketId] });
      toast({
        title: "Ticket updated",
        description: "The ticket has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update ticket",
        description: error.message || "An error occurred while updating the ticket.",
        variant: "destructive",
      });
    },
  });

  // Mutation for adding a comment
  const addCommentMutation = useMutation({
    mutationFn: async ({ ticketId, content, isInternal }: { ticketId: number; content: string; isInternal: boolean }) => {
      // Use canonical REST endpoint for comments
      const res = await apiRequest("POST", `/api/tickets/${ticketId}/comments`, {
        content,
        isInternal: isInternal || false
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Comment creation error:', errorText);
        throw new Error(errorText || 'Failed to add comment');
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets`, ticketId] });
      setCommentText("");
      setIsInternalNote(false);
      toast({
        title: "Comment added",
        description: "Your comment has been added to the ticket.",
      });
    },
    onError: (error: any) => {
      console.error('Comment error details:', error);
      toast({
        title: "Failed to add comment",
        description: error instanceof Error ? error.message : "An error occurred while adding your comment.",
        variant: "destructive",
      });
    },
  });

  // Handle status change
  const handleStatusChange = (status: string) => {
    updateTicketMutation.mutate({ status });
  };

  // Handle priority change
  const handlePriorityChange = (priority: string) => {
    updateTicketMutation.mutate({ priority });
  };

  // Handle assignment change
  const handleAssignmentChange = (agentId: string) => {
    updateTicketMutation.mutate({
      assignedToId: agentId === "unassigned" ? null : parseInt(agentId)
    });
  };

  // Handle comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !ticket) return;

    try {
      await addCommentMutation.mutateAsync({
        ticketId: ticket.id,
        content: commentText.trim(),
        isInternal: isInternalNote
      });
    } catch (error) {
      console.error('Comment submission error:', error);
      // Toast is handled in mutation's onError
    }
  };

  // Format date to show exact time
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Never';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid date';
      return dateObj.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Handle error state
  useEffect(() => {
    if (error) {
      let errorMsg = "Failed to load ticket details. Please try again.";
      // Try to extract backend error details if available
      if (error instanceof Error) {
        try {
          // If error.message is a JSON string, parse it
          const parsed = JSON.parse(error.message);
          if (parsed.details) {
            errorMsg = parsed.details;
          } else if (parsed.error) {
            errorMsg = parsed.error;
          }
        } catch {
          // If not JSON, use error.message
          errorMsg = error.message;
        }
      }
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      // Only navigate back for critical errors such as 404 or access denied.
      // This prevents unintentional redirects when transient errors occur.
      const lower = String(errorMsg).toLowerCase();
      const shouldNavigate = lower.includes('ticket not found') || lower.includes('access denied') || lower.includes('unauthorized');
      if (shouldNavigate) {
        navigate(referrer);
      }
    }
  }, [error, navigate, toast]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
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

  // Check if any agent or admin has commented on the ticket
  // Returns true if at least one comment exists from a user with role "admin" OR "agent"
  // Also handles users with combined admin/agent access
  const hasAgentOrAdminComment = () => {
    if (!ticket?.comments) return false;
    return ticket.comments.some(comment => {
      const userRole = comment.user.role?.toLowerCase() || '';
      // Check if role is admin, agent, or contains either (for users with multiple roles)
      return userRole === "admin" ||
        userRole === "agent" ||
        userRole.includes("admin") ||
        userRole.includes("agent");
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for larger screens, or as a slide-over for mobile */}
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Ticket Details" />

        {/* Main content scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Ticket header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center mb-1">
                <Button variant="ghost" size="sm" className="mr-2" onClick={() => navigate(referrer)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold text-gray-800">
                  {isLoadingTicket ? (
                    <Skeleton className="h-7 w-48" />
                  ) : (
                    <>
                      <span className="font-mono text-gray-500 text-base mr-2">TKT-{ticket?.id.toString().padStart(4, '0')}</span>
                      <span>{ticket?.title}</span>
                    </>
                  )}
                </h2>
              </div>
              <div className="flex items-center flex-wrap text-sm text-gray-500 ml-9">
                {isLoadingTicket ? (
                  <Skeleton className="h-5 w-64" />
                ) : (
                  <>
                    <span className="mr-3">Created {formatDate(ticket?.createdAt || "")}</span>
                    <span className="mr-3">By {ticket?.createdBy.name}</span>
                    <Badge variant="outline" className={getStatusColor(ticket?.status || "")}>
                      {ticket?.status === "in_progress"
                        ? "In Progress"
                        : (ticket?.status ?? "unknown").charAt(0).toUpperCase() + (ticket?.status ?? "unknown").slice(1)}
                    </Badge>
                    <Badge variant="outline" className={`ml-2 capitalize ${getPriorityColor(ticket?.priority || "")}`}>
                      {ticket?.priority} Priority
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Ticket content and metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Comments and updates */}
            <div className="md:col-span-2 space-y-6">
              {/* Ticket description */}
              <Card>
                <CardContent className="p-6">
                  {isLoadingTicket ? (
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start">
                          <div className="bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-800">{ticket?.createdBy.name}</h3>
                            <p className="text-sm text-gray-500">{formatDate(ticket?.createdAt || "")}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-700 mb-4">{ticket?.description}</div>

                      {/* Display attachment if exists */}
                      {ticket?.attachmentUrl && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center space-x-3">
                            <Paperclip className="h-5 w-5 text-gray-500" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {ticket.attachmentName}
                              </p>
                              <p className="text-xs text-gray-500">Attached file</p>
                            </div>
                            <a
                              href={ticket.attachmentUrl}
                              download={ticket.attachmentName || 'attachment'}
                              className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                            >
                              <Download className="h-4 w-4" />
                              <span className="text-sm">Download</span>
                            </a>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center text-sm text-gray-500">
                        <Badge variant="outline" className="mr-2">{ticket?.category.name}</Badge>
                        {ticket?.subcategory && (
                          <Badge variant="outline">{ticket?.subcategory.name}</Badge>
                        )}
                      </div>
                      {/* Show agent details for users */}
                      {hasRole(user?.role, "user") && !hasAnyRole(user?.role, ["admin", "agent"]) && ticket?.assignedTo && (
                        <div className="md:col-span-2 mt-4">
                          <div className="text-gray-500 font-medium mb-1">Assigned Agent</div>
                          <div className="flex flex-col gap-1">
                            <span><strong>Name:</strong> {ticket?.assignedTo?.name || ticket?.assignedTo?.username || "-"}</span>
                            <span><strong>Email:</strong> {ticket?.assignedTo?.email || "-"}</span>
                            <span><strong>Phone:</strong> {ticket?.assignedTo?.contactNumber || "-"}</span>
                            <span><strong>Department:</strong> {ticket?.assignedTo?.department || "-"}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Comments */}
              {isLoadingTicket ? (
                <div className="space-y-4">
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : ticket?.comments && ticket.comments.length > 0 ? (
                <CommentThread
                  comments={ticket.comments.map(comment => ({
                    id: comment.id,
                    content: comment.content,
                    createdAt: comment.createdAt,
                    isInternal: comment.isInternal ?? false,
                    user: {
                      id: comment.user.id,
                      name: comment.user.name,
                      role: comment.user.role
                    }
                  }))}
                  currentUserRole={user?.role || "user"}
                />
              ) : (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    No comments yet.
                  </CardContent>
                </Card>
              )}

              {/* Add comment - always allow users to comment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add a Comment</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitComment}>
                    <Textarea
                      rows={4}
                      placeholder="Type your message here..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="mb-4"
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {hasAnyRole(user?.role, ["admin", "agent"]) && (
                          <div className="flex items-center">
                            <Checkbox
                              id="internal-note"
                              checked={isInternalNote}
                              onCheckedChange={(checked) => setIsInternalNote(checked === true)}
                              className="mr-2"
                            />
                            <label htmlFor="internal-note" className="text-sm text-gray-700 cursor-pointer">
                              Make this an internal note
                            </label>
                          </div>
                        )}
                      </div>
                      <Button
                        type="submit"
                        disabled={!commentText.trim() || addCommentMutation.isPending}
                      >
                        {addCommentMutation.isPending ? "Sending..." : "Send Comment"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Ticket metadata */}
            <div className="space-y-6">
              {/* Status panel */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Ticket Status</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                    {hasRole(user?.role, "user") && !hasAnyRole(user?.role, ["admin", "agent"]) ? (
                      <div className="px-3 py-2 border rounded bg-gray-100 text-gray-700">
                        {ticket?.status === "open" && "Open"}
                        {ticket?.status === "in_progress" && "In Progress"}
                        {ticket?.status === "closed" && "Closed"}
                      </div>
                    ) : (
                      <Select
                        value={ticket?.status || "open"}
                        onValueChange={handleStatusChange}
                        disabled={isLoadingTicket || updateTicketMutation.isPending}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem
                            value="closed"
                            disabled={!hasAgentOrAdminComment()}
                          >
                            Closed
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {hasRole(user?.role, "admin") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                      <div className="space-y-2">
                        <Select
                          value={ticket?.assignedToId?.toString() || "unassigned"}
                          onValueChange={handleAssignmentChange}
                          disabled={isLoadingTicket || updateTicketMutation.isPending}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {users?.filter(u => hasAnyRole(u.role, ["agent", "admin"])).map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.username} - {user.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {(hasAnyRole(user?.role, ["admin", "agent"]) && user?.id != null &&
                          ticket?.assignedToId !== user.id) && (
                            <Button
                              variant="outline"
                              className="w-full flex items-center justify-center"
                              onClick={() => handleAssignmentChange(user.id.toString())}
                              disabled={isLoadingTicket || updateTicketMutation.isPending}
                            >
                              <User className="h-4 w-4 mr-2" />
                              Assign to me
                            </Button>
                          )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <Select
                      value={ticket?.priority || "medium"}
                      onValueChange={handlePriorityChange}
                      disabled={isLoadingTicket || updateTicketMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Details panel */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {isLoadingTicket ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      <li className="flex justify-between">
                        <span className="text-sm text-gray-500 flex items-center">
                          <Calendar className="h-4 w-4 mr-2" /> Created
                        </span>
                        <span className="text-sm text-gray-800">{formatDate(ticket?.createdAt || "")}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-sm text-gray-500 flex items-center">
                          <User className="h-4 w-4 mr-2" /> Company Name
                        </span>
                        <span className="text-sm text-gray-800">{ticket?.companyName || "N/A"}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-sm text-gray-500 flex items-center">
                          <User className="h-4 w-4 mr-2" /> Location
                        </span>
                        <span className="text-sm text-gray-800">{ticket?.location || "N/A"}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-sm text-gray-500 flex items-center">
                          <Tag className="h-4 w-4 mr-2" /> Category
                        </span>
                        <span className="text-sm text-gray-800">{ticket?.category.name}</span>
                      </li>
                      {ticket?.subcategory && (
                        <li className="flex justify-between">
                          <span className="text-sm text-gray-500 flex items-center">
                            <Tag className="h-4 w-4 mr-2" /> Subcategory
                          </span>
                          <span className="text-sm text-gray-800">{ticket.subcategory.name}</span>
                        </li>
                      )}
                      <li className="flex justify-between">
                        <span className="text-sm text-gray-500 flex items-center">
                          <Clock className="h-4 w-4 mr-2" /> Last Updated
                        </span>
                        <span className="text-sm text-gray-800">
                          {ticket?.comments && ticket.comments.length > 0
                            ? formatDate(ticket.comments[ticket.comments.length - 1].createdAt)
                            : formatDate(ticket?.updatedAt || "")}
                        </span>
                      </li>
                      {/* Show both user and agent details for admin, only user details for agent, only agent details for user */}
                      {hasRole(user?.role, "admin") && (
                        <>
                          {/* Show ticket's contact user details (not creator) */}
                          <>
                            <li className="flex justify-between">
                              <span className="text-sm text-gray-500 flex items-center">
                                <User className="h-4 w-4 mr-2" /> User Name
                              </span>
                              <span className="text-sm text-gray-800">{ticket?.contactName || "None"}</span>
                            </li>
                            <li className="flex justify-between">
                              <span className="text-sm text-gray-500 flex items-center">
                                <User className="h-4 w-4 mr-2" /> User Email
                              </span>
                              <span className="text-sm text-gray-800">{ticket?.contactEmail || "None"}</span>
                            </li>
                            <li className="flex justify-between">
                              <span className="text-sm text-gray-500 flex items-center">
                                <User className="h-4 w-4 mr-2" /> User Phone
                              </span>
                              <span className="text-sm text-gray-800">{ticket?.contactPhone || "None"}</span>
                            </li>
                          </>
                          {/* Agent details */}
                          {ticket?.assignedTo && (
                            <>
                              <li className="flex justify-between">
                                <span className="text-sm text-gray-500 flex items-center">
                                  <User className="h-4 w-4 mr-2" /> Agent Name
                                </span>
                                <span className="text-sm text-gray-800">{ticket.assignedTo.name}</span>
                              </li>
                              {ticket?.assignedTo?.email && (
                                <li className="flex justify-between">
                                  <span className="text-sm text-gray-500 flex items-center">
                                    <User className="h-4 w-4 mr-2" /> Agent Email
                                  </span>
                                  <span className="text-sm text-gray-800">{ticket.assignedTo.email}</span>
                                </li>
                              )}
                              {ticket?.assignedTo?.contactNumber && (
                                <li className="flex justify-between">
                                  <span className="text-sm text-gray-500 flex items-center">
                                    <User className="h-4 w-4 mr-2" /> Agent Phone
                                  </span>
                                  <span className="text-sm text-gray-800">{ticket.assignedTo.contactNumber}</span>
                                </li>
                              )}
                            </>
                          )}
                        </>
                      )}
                      {user?.role === "agent" && (
                        <>
                          <li className="flex justify-between">
                            <span className="text-sm text-gray-500 flex items-center">
                              <User className="h-4 w-4 mr-2" /> User Name
                            </span>
                            <span className="text-sm text-gray-800">{ticket?.contactName || "None"}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-sm text-gray-500 flex items-center">
                              <User className="h-4 w-4 mr-2" /> User Email
                            </span>
                            <span className="text-sm text-gray-800">{ticket?.contactEmail || "None"}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-sm text-gray-500 flex items-center">
                              <User className="h-4 w-4 mr-2" /> User Phone
                            </span>
                            <span className="text-sm text-gray-800">{ticket?.contactPhone || "None"}</span>
                          </li>
                        </>
                      )}
                      {hasRole(user?.role, "user") && !hasAnyRole(user?.role, ["admin", "agent"]) && ticket?.assignedTo && (
                        <>
                          <li className="flex justify-between">
                            <span className="text-sm text-gray-500 flex items-center">
                              <User className="h-4 w-4 mr-2" /> Agent Name
                            </span>
                            <span className="text-sm text-gray-800">{ticket.assignedTo.name}</span>
                          </li>
                          {ticket?.assignedTo?.email && (
                            <li className="flex justify-between">
                              <span className="text-sm text-gray-500 flex items-center">
                                <User className="h-4 w-4 mr-2" /> Agent Email
                              </span>
                              <span className="text-sm text-gray-800">{ticket.assignedTo.email}</span>
                            </li>
                          )}
                          {ticket?.assignedTo?.contactNumber && (
                            <li className="flex justify-between">
                              <span className="text-sm text-gray-500 flex items-center">
                                <User className="h-4 w-4 mr-2" /> Agent Phone
                              </span>
                              <span className="text-sm text-gray-800">{ticket.assignedTo.contactNumber}</span>
                            </li>
                          )}
                        </>
                      )}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* Related articles */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Related Articles</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {isLoadingTicket ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {ticket?.category.name === "Network Issues" && (
                        <li>
                          <Link href={`${basePath}/knowledge-base?q=wifi`} className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                            <ExternalLink className="h-3 w-3 mr-2" />
                            How to troubleshoot WiFi connectivity issues
                          </Link>
                        </li>
                      )}
                      {ticket?.category.name === "Email Services" && (
                        <li>
                          <Link href={`${basePath}/knowledge-base?q=outlook`} className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                            <ExternalLink className="h-3 w-3 mr-2" />
                            Common Outlook syncing problems and solutions
                          </Link>
                        </li>
                      )}
                      {ticket?.category.name === "Hardware" && ticket?.subcategory?.name === "Printer" && (
                        <li>
                          <Link href={`${basePath}/knowledge-base?q=printer`} className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                            <ExternalLink className="h-3 w-3 mr-2" />
                            Resolving printer error messages and paper jams
                          </Link>
                        </li>
                      )}
                      {!((ticket?.category.name === "Network Issues") ||
                        (ticket?.category.name === "Email Services") ||
                        (ticket?.category.name === "Hardware" && ticket?.subcategory?.name === "Printer")) && (
                          <li className="text-gray-500 text-sm">
                            No related articles found.
                          </li>
                        )}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
