import { useState, useEffect, useRef, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface Ticket {
  id: number;
  title: string;
  status: string;
  priority: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  assignedToId?: number | null;
  categoryId?: number;
  [key: string]: any;
}

interface PollingState {
  tickets: Ticket[];
  changedTicketIds: Set<number>;
  isLoading: boolean;
  error: string | null;
  statusCounts?: {
    open: number;
    inProgress: number;
    closed: number;
  };
}

export function useTicketPolling(
  endpoint: string,
  pollInterval = 3000,
  enabled = true
) {
  const [state, setState] = useState<PollingState>({
    tickets: [],
    changedTicketIds: new Set(),
    isLoading: true,
    error: null,
    statusCounts: undefined,
  });

  const previousTicketsRef = useRef<Ticket[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Compute status counts from tickets
  const computeStatusCounts = useCallback((tickets: Ticket[]) => {
    return tickets.reduce(
      (acc, ticket) => {
        if (ticket.status === 'open') acc.open++;
        else if (ticket.status === 'in-progress' || ticket.status === 'in_progress')
          acc.inProgress++;
        else if (ticket.status === 'closed') acc.closed++;
        return acc;
      },
      { open: 0, inProgress: 0, closed: 0 }
    );
  }, []);

  // Compare and detect changes
  const compareAndUpdate = useCallback(
    (newTickets: Ticket[]) => {
      const previousTickets = previousTicketsRef.current;
      const changedIds = new Set<number>();

      // Create maps for efficient comparison
      const previousMap = new Map(previousTickets.map((t) => [t.id, t]));
      const newMap = new Map(newTickets.map((t) => [t.id, t]));

      // Check for new or updated tickets
      newTickets.forEach((newTicket) => {
        const oldTicket = previousMap.get(newTicket.id);

        if (!oldTicket) {
          // New ticket created
          changedIds.add(newTicket.id);
          console.log('[Polling] New ticket created:', newTicket.id);
        } else if (
          oldTicket.status !== newTicket.status ||
          oldTicket.updatedAt !== newTicket.updatedAt ||
          oldTicket.assignedToId !== newTicket.assignedToId
        ) {
          // Ticket updated or status/assignment changed
          changedIds.add(newTicket.id);
          console.log('[Polling] Ticket updated:', newTicket.id);
        }
      });

      // Check for deleted tickets
      previousTickets.forEach((oldTicket) => {
        if (!newMap.has(oldTicket.id)) {
          console.log('[Polling] Ticket deleted:', oldTicket.id);
        }
      });

      // Update state if changes detected
      if (changedIds.size > 0 || previousTickets.length !== newTickets.length) {
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            tickets: newTickets,
            changedTicketIds: changedIds,
            statusCounts: computeStatusCounts(newTickets),
            isLoading: false,
            error: null,
          }));

          // Clear highlights after 3 seconds
          setTimeout(() => {
            if (mountedRef.current) {
              setState((prev) => ({
                ...prev,
                changedTicketIds: new Set(),
              }));
            }
          }, 3000);
        }
      } else if (previousTickets.length === 0 && newTickets.length === 0) {
        // Handle initial empty state
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            tickets: newTickets,
            statusCounts: computeStatusCounts(newTickets),
            isLoading: false,
          }));
        }
      }

      // Store current tickets for next comparison
      previousTicketsRef.current = newTickets;
    },
    [computeStatusCounts]
  );

  // Fetch tickets from API
  const fetchTickets = useCallback(async () => {
    try {
      const response = await apiRequest('GET', endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }

      const raw = await response.json();

      // Normalize response - handle both paginated and non-paginated formats
      const tickets = Array.isArray(raw) ? raw : raw.tickets ?? [];

      // Normalize tickets to ensure consistent structure
      const normalizedTickets = tickets.map((ticket: any) => ({
        ...ticket,
        id: Number(ticket.id),
        status: ticket.status || 'open',
        priority: ticket.priority || 'medium',
      }));

      compareAndUpdate(normalizedTickets);
    } catch (err) {
      console.error('[Polling] Error fetching tickets:', err);
      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Unknown error',
          isLoading: false,
        }));
      }
    }
  }, [endpoint, compareAndUpdate]);

  // Manual refetch function
  const refetch = useCallback(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Set up polling
  useEffect(() => {
    if (!enabled) {
      return;
    }

    mountedRef.current = true;

    // Initial fetch
    fetchTickets();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(() => {
      fetchTickets();
    }, pollInterval);

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [enabled, pollInterval, fetchTickets]);

  return {
    tickets: state.tickets,
    changedTicketIds: state.changedTicketIds,
    isLoading: state.isLoading,
    error: state.error,
    statusCounts: state.statusCounts,
    refetch,
  };
}
