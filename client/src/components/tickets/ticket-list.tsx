import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { hasAnyRole } from "@/lib/role-utils";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { PaginationControls } from "@/components/common/pagination-controls";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Paperclip
} from "lucide-react";
import { Ticket, User } from "@shared/schema";

interface TicketWithExtras extends Ticket {
  category?: any;
  subcategory?: any;
  createdBy?: User;
  assignedTo?: User;
  commentCount?: number;
  comments?: any[];
}

interface TicketListProps {
  tickets: TicketWithExtras[];
  showCreatedBy?: boolean;
  showAssignedTo?: boolean;
  isOwner?: boolean;
  changedTicketIds?: Set<number>;
}

export default function TicketList({
  tickets,
  showCreatedBy = false,
  showAssignedTo = false,
  isOwner = false,
  changedTicketIds = new Set()
}: TicketListProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<TicketWithExtras | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delete ticket mutation
  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      await apiRequest("DELETE", `/api/tickets/${ticketId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/my"] });
      toast({
        title: "Ticket deleted",
        description: "The ticket has been deleted successfully.",
      });
      setShowDeleteDialog(false);
      setTicketToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update ticket status mutation
  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PUT", `/api/tickets/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/my"] });
      toast({
        title: "Ticket updated",
        description: "The ticket status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Assign ticket to self mutation
  const assignTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      await apiRequest("PUT", `/api/tickets/${ticketId}`, {
        assignedToId: user?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/my"] });
      toast({
        title: "Ticket assigned",
        description: "The ticket has been assigned to you.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to assign ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-blue-100 text-blue-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "urgent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4" />;
      case "in-progress":
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "closed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatTicketId = (id: number) => {
    return `TKT-${id.toString().padStart(4, '0')}`;
  };

  // Get base path for consistent routing
  // Remove getBasePath and basePath, let Vite handle the base path

  const handleViewTicket = (ticketId: number) => {
    // Store the current path and full URL
    const currentPath = window.location.pathname;
    sessionStorage.setItem('ticketReferrer', currentPath.includes('/all-tickets') ? '/all-tickets' : '/tickets');
    navigate(`/tickets/${ticketId}`);
  };

  const handleEditTicket = (ticketId: number) => {
    navigate(`/tickets/${ticketId}/edit`);
  };

  const handleDeleteTicket = (ticket: TicketWithExtras) => {
    setTicketToDelete(ticket);
    setShowDeleteDialog(true);
  };

  const confirmDeleteTicket = () => {
    if (ticketToDelete) {
      deleteTicketMutation.mutate(ticketToDelete.id);
    }
  };

  const handleStatusChange = (ticketId: number, newStatus: string) => {
    updateTicketMutation.mutate({ id: ticketId, status: newStatus });
  };

  const handleAssignToSelf = (ticketId: number) => {
    assignTicketMutation.mutate(ticketId);
  };

  const canEditTicket = (ticket: TicketWithExtras) => {
    return (
      hasAnyRole(user?.role, ["admin", "agent"]) ||
      (isOwner && ticket.createdById === user?.id)
    );
  };

  const canDeleteTicket = (ticket: TicketWithExtras) => {
    return (
      hasAnyRole(user?.role, ["admin"]) ||
      (isOwner && ticket.createdById === user?.id)
    );
  };

  const canAssignTicket = (ticket: TicketWithExtras) => {
    return (
      hasAnyRole(user?.role, ["admin", "agent"]) &&
      ticket.assignedToId !== user?.id
    );
  };

  const totalPages = Math.ceil((tickets?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTickets = tickets?.slice(startIndex, endIndex) || [];

  return (
    <>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {paginatedTickets.map((ticket) => {
            const isChanged = changedTicketIds.has(ticket.id);
            return (
              <div
                key={ticket.id}
                className={`p-6 transition-all duration-500 ${isChanged
                  ? 'bg-yellow-50 border-l-4 border-l-yellow-400 animate-pulse-once'
                  : 'hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Ticket Header */}
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(ticket.status)}
                        <span className="text-sm font-medium text-gray-900">
                          {formatTicketId(ticket.id)}
                        </span>
                      </div>
                      <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(ticket.status)}>
                        {ticket.status === "in_progress" ? "In Progress" : ticket.status.replace('-', ' ')}
                      </Badge>
                    </div>

                    {/* Ticket Title */}
                    <h3 className="text-lg font-medium text-gray-900 mb-2 cursor-pointer hover:text-blue-600"
                      onClick={() => handleViewTicket(ticket.id)}>
                      {ticket.title}
                    </h3>

                    {/* Ticket Description */}
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {ticket.description}
                    </p>

                    {/* Ticket Meta Information */}
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {ticket.createdAt ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true }) : 'No date'}
                        </span>
                      </div>

                      {showCreatedBy && ticket.createdBy && (
                        <div className="flex items-center space-x-2">
                          <span>Created by:</span>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {ticket.createdBy.name ? ticket.createdBy.name.charAt(0).toUpperCase() : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{ticket.createdBy.name || 'Unknown'}</span>
                        </div>
                      )}

                      {showAssignedTo && (
                        <div className="flex items-center space-x-2">
                          {ticket.assignedTo ? (
                            <>
                              <span>Assigned to:</span>
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {ticket.assignedTo.name ? ticket.assignedTo.name.charAt(0).toUpperCase() : 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{ticket.assignedTo.name || 'Unknown'}</span>
                            </>
                          ) : (
                            <span className="text-orange-600">Unassigned</span>
                          )}
                        </div>
                      )}

                      {ticket.category && (
                        <div className="flex items-center space-x-1">
                          <span>Category:</span>
                          <Badge variant="secondary" className="text-xs">
                            {ticket.category.name}
                          </Badge>
                        </div>
                      )}

                      {/* Show comment count */}
                      <div className="flex items-center space-x-1 ml-4">
                        <MessageSquare className="h-4 w-4" />
                        <span>Comments:</span>
                        <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{Array.isArray(ticket.comments) ? ticket.comments.length : (ticket.commentCount || 0)}</span>
                      </div>
                      {ticket.attachmentUrl && (
                        <div className="flex items-center space-x-1">
                          <Paperclip className="h-4 w-4" />
                          <span className="text-xs">Attachment</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 ml-4">
                    {/* Comment Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewTicket(ticket.id)}
                      className="text-gray-600 hover:text-blue-600"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {Array.isArray(ticket.comments) ? ticket.comments.length : (ticket.commentCount || 0)}
                      </span>
                    </Button>

                    {/* More Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleViewTicket(ticket.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>

                        {/* EDIT FUNCTIONALITY */}
                        {canEditTicket(ticket) && (
                          <DropdownMenuItem onClick={() => handleEditTicket(ticket.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Ticket
                          </DropdownMenuItem>
                        )}

                        {canAssignTicket(ticket) && (
                          <DropdownMenuItem onClick={() => handleAssignToSelf(ticket.id)}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Assign to Me
                          </DropdownMenuItem>
                        )}

                        {hasAnyRole(user?.role, ["admin", "agent"]) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(ticket.id, "in_progress")}
                              disabled={ticket.status === "in_progress" || ticket.status === "in-progress"}
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Mark In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(ticket.id, "closed")}
                              disabled={ticket.status === "closed"}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Close Ticket
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* DELETE FUNCTIONALITY */}
                        {canDeleteTicket(ticket) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteTicket(ticket)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Ticket
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {totalPages > 1 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ticket</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete ticket "{ticketToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteTicket}
              disabled={deleteTicketMutation.isPending}
            >
              {deleteTicketMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
