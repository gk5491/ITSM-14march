import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { hasRole, hasAnyRole } from "@/lib/role-utils";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserSelection } from "@/components/ticket/user-selection";
import { CategorySelection } from "@/components/ticket/category-selection";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, FilePlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Category, User } from "@shared/schema";
import { CompanyCombobox } from "@/components/ticket/company-combobox";

// Form validation schema
const createTicketSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().optional().default(""),
  categoryId: z.string().min(1, "Please select a category"),
  subcategoryId: z.string().optional().default(""),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  supportType: z.enum(["remote", "telephonic", "onsite_visit", "other"]).default("remote"),
  assignedToId: z.string().optional().default(""),
  contactId: z.string().optional().default(""),
  contactEmail: z.string().optional().default("").refine((val) => !val || z.string().email().safeParse(val).success, {
    message: "Please enter a valid email address"
  }),
  contactName: z.string().optional().default(""),
  contactPhone: z.string().optional().default(""),
  contactDepartment: z.string().optional().default(""),
  dueDate: z.string().optional().default("")
});

// Add companyName and location to form values with proper type coercion
const createTicketSchemaWithCompany = createTicketSchema.extend({
  // Make companyName and location optional to avoid validation errors when the contact lacks these fields
  companyName: z.string().optional().default(""),
  location: z.string().optional().default("")
});

type CreateTicketFormValues = z.infer<typeof createTicketSchemaWithCompany>;

export default function TicketCreatePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [searchAgent, setSearchAgent] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [addingUser, setAddingUser] = useState(false);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [addingAgent, setAddingAgent] = useState(false);
  // Fixed state for dialogs - removed duplicates
  const [dialogState, setDialogState] = useState({
    showAddCategory: false,
    showAddSubcategory: false,
    newCategoryName: "",
    newSubcategoryName: "",
    isAdding: false
  });
  // Default categories and subcategories to show initially
  const defaultCategories = [
    { id: 1, name: "Hardware" },
    { id: 2, name: "Software" },
    { id: 3, name: "Network & Connectivity" },
    { id: 4, name: "Domain" }
  ];

  const defaultSubcategories = {
    "1": [
      { id: 101, name: "Desktop" },
      { id: 102, name: "Laptops" },
      { id: 103, name: "Servers" },
      { id: 104, name: "Network Equipment" },
      { id: 105, name: "Printers" },
      { id: 106, name: "Mouse" },
      { id: 107, name: "Monitor" },
      { id: 108, name: "Keyboard" },
      { id: 109, name: "Cables" },
      { id: 110, name: "Solid Drive" },
      { id: 111, name: "Hard Drive" }
    ],
    "2": [
      { id: 201, name: "Antivirus" },
      { id: 202, name: "AutoCAD" },
      { id: 203, name: "O365" },
      { id: 204, name: "VPN" },
      { id: 205, name: "Remote Software" },
      { id: 206, name: "Outlook" }
    ],
    "3": [
      { id: 301, name: "LAN" },
      { id: 302, name: "VPN/Remote Access" },
      { id: 303, name: "WiFi" },
      { id: 304, name: "Internet Connectivity" },
      { id: 305, name: "Server access" }
    ],
    "4": [
      { id: 401, name: "Password Reset" },
      { id: 402, name: "New Account Setup" },
      { id: 403, name: "Permissions Change" },
      { id: 404, name: "MFA Issues" },
      { id: 405, name: "Update Policy" },
      { id: 406, name: "System Configuration" }
    ]
  };

  type Category = { id: number; name: string };
  type SubcategoryMap = Record<string, Category[]>;

  const [localCategories, setLocalCategories] = useState<Category[]>(defaultCategories);
  const [localSubcategories, setLocalSubcategories] = useState<SubcategoryMap>(defaultSubcategories);

  // Auth and UI helpers needed before queries
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = window.innerWidth < 768;

  // Fetch categories from server so UI reflects DB state instead of only local defaults
  const { data: fetchedCategories, isLoading: isLoadingCategories, refetch: refetchCategories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    // Always fetch categories on mount so the dropdown reflects DB state.
    // Force a fresh fetch on mount and do not rely on cache
    enabled: true,
    staleTime: 0,
    gcTime: 0, // Prevent caching entirely so new data is always fetched
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: false,
  });

  // Update local state when fetched categories change
  // This replaces the deprecated onSuccess callback from React Query v4
  useEffect(() => {
    if (!fetchedCategories) return;

    console.debug('Fetched categories raw:', fetchedCategories);
    // Normalize categories into top-level list and subcategory map
    const top: Category[] = [];
    const submap: SubcategoryMap = {};

    fetchedCategories.forEach((c: any) => {
      const id = Number(c.id);
      const name = c.name;
      // Normalize parent id robustly (handles parent_id, parentId, string '0', empty string etc.)
      const rawParent = c.parentId ?? c.parent_id ?? null;
      const parentId = rawParent === null || rawParent === undefined || rawParent === "" ? null : Number(rawParent);

      if (parentId === null || parentId === 0 || Number.isNaN(parentId)) {
        top.push({ id, name });
      } else {
        const key = parentId.toString();
        if (!submap[key]) submap[key] = [];
        submap[key].push({ id, name });
      }
    });

    // Sort top-level categories by name (optional)
    top.sort((a, b) => a.name.localeCompare(b.name));
    Object.keys(submap).forEach(k => submap[k].sort((a, b) => a.name.localeCompare(b.name)));

    console.debug('Normalized categories top:', top);
    console.debug('Normalized categories submap:', submap);

    // If server returned categories use them, otherwise keep defaults
    if (top.length > 0) {
      setLocalCategories(top);
    } else {
      setLocalCategories(defaultCategories);
    }

    if (Object.keys(submap).length > 0) {
      // Prefer server-provided subcategories; fall back to defaults only when server is empty
      setLocalSubcategories(submap);
    } else {
      setLocalSubcategories(defaultSubcategories);
    }
  }, [fetchedCategories]);

  const [, navigate] = useLocation();

  // Initialize form
  const form = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchemaWithCompany),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      subcategoryId: "",
      priority: "medium",
      supportType: "remote",
      assignedToId: "",
      contactId: "",
      contactEmail: user?.email || "",
      contactName: user?.name || "",
      contactPhone: user?.contactNumber || "",
      contactDepartment: user?.department || "",
      companyName: user?.companyName || "",
      location: user?.location || "",
      dueDate: "",
    },
  });

  // Get subcategories for selected category
  const selectedCategory = localCategories.find((c: Category) => c.id.toString() === selectedCategoryId);
  const subcategories = selectedCategoryId ? (localSubcategories[selectedCategoryId] || []) : [];

  // Fetch all users (agents and admins)
  const queryClient = useQueryClient();
  const { data: allUsers, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      return await res.json();
    },
    enabled: !!user,
  });

  // Filter users for contact info selection
  // contactOptions should be available to admins and agents (list of users)
  // agentOptions should always be populated from allUsers so agents can assign to self or others
  let contactOptions: User[] = [];
  let agentOptions: User[] = allUsers?.filter(u => hasAnyRole(u.role, ["agent", "admin"])) || [];
  if (hasAnyRole(user?.role, ["agent", "admin"])) {
    contactOptions = allUsers?.filter(u => u.role === "user") || [];
  }

  // Debug logging
  console.log("All users:", allUsers);
  console.log("Contact options:", contactOptions);
  console.log("Is loading users:", isLoadingUsers);

  // Filter contact options based on search
  const filteredContacts = contactOptions.filter(contact =>
    contact.name.toLowerCase().includes(searchAgent.toLowerCase()) ||
    contact.username.toLowerCase().includes(searchAgent.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchAgent.toLowerCase())
  );

  // Auto-fetch user details by contact id
  const handleContactSelection = async (id: string) => {
    const selectedContact = contactOptions.find(contact => contact.id.toString() === id);
    if (selectedContact) {
      form.setValue("contactEmail", selectedContact.email);
      form.setValue("contactName", selectedContact.name);
      form.setValue("contactPhone", selectedContact.contactNumber || "");
      form.setValue("contactDepartment", selectedContact.department || "");
      // Auto-fill company and location when contact is selected (if available)
      form.setValue("companyName", (selectedContact.companyName || "") as any);
      form.setValue("location", (selectedContact.location || "") as any);
    }
  };

  // Auto-populate company/location when user types or pastes an email into contactEmail
  const contactEmailValue = form.watch("contactEmail");
  useEffect(() => {
    if (!contactEmailValue || !allUsers) return;
    const matched = allUsers.find(u => u.email && u.email.toLowerCase() === String(contactEmailValue).toLowerCase());
    if (matched) {
      form.setValue("contactId", matched.id ? String(matched.id) : form.getValues().contactId);
      form.setValue("contactName", matched.name || form.getValues().contactName || "");
      form.setValue("contactPhone", matched.contactNumber || form.getValues().contactPhone || "");
      form.setValue("contactDepartment", matched.department || form.getValues().contactDepartment || "");
      form.setValue("companyName", matched.companyName || form.getValues().companyName || "");
      form.setValue("location", matched.location || form.getValues().location || "");
    }
  }, [contactEmailValue, allUsers]);

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: CreateTicketFormValues) => {
      console.log('Creating ticket with data:', data);

      const formData = new FormData();

      // Required fields
      formData.append('title', data.title);
      formData.append('categoryId', data.categoryId);
      formData.append('priority', data.priority);
      formData.append('supportType', data.supportType);
      formData.append('status', 'open');
      formData.append('companyName', data.companyName);
      formData.append('location', data.location);
      // Ensure createdById is set to the selected contact (user) if admin/agent is creating
      if (hasAnyRole(user?.role, ["admin", "agent"]) && data.contactId) {
        formData.append('createdById', String(data.contactId));
      } else if (user && user.id) {
        // For regular users, set themselves as creator
        formData.append('createdById', String(user.id));
      }

      // Optional fields with null fallback
      formData.append('description', data.description || '');
      formData.append('subcategoryId', data.subcategoryId || '');
      formData.append('assignedToId', data.assignedToId || '');
      formData.append('contactId', data.contactId || '');
      formData.append('contactEmail', data.contactEmail || '');
      formData.append('contactName', data.contactName || '');
      formData.append('contactPhone', data.contactPhone || '');
      formData.append('contactDepartment', data.contactDepartment || '');

      // Handle date properly
      if (data.dueDate) {
        formData.append('dueDate', new Date(data.dueDate).toISOString());
      }

      // Handle file attachment
      if (file) {
        formData.append('attachment', file);
      }

      try {
        const res = await apiRequest("POST", "/api/tickets", formData);
        const responseText = await res.text();

        if (!res.ok) {
          console.error('HTTP Error Response:', res.status, responseText);
          throw new Error(responseText || `HTTP ${res.status}: Failed to create ticket`);
        }

        let result;
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse response:', responseText);
          throw new Error('Invalid server response format');
        }

        if (!result || !result.id) {
          throw new Error('Invalid response: Missing ticket ID');
        }

        console.log('Ticket created successfully:', result);
        return result;
      } catch (error) {
        console.error('Ticket creation error:', error);
        throw error;
      }
    },
    onSuccess: async (data, variables) => {
      console.log('Ticket created successfully:', data);

      // Helper function to verify assignment
      const verifyAssignment = async (ticketId: string | number, expectedAssigneeId: string | number) => {
        const res = await apiRequest("GET", `/api/tickets/${ticketId}`);
        if (!res.ok) return false;
        const ticket = await res.json();
        const ticketObj = Array.isArray(ticket) ? ticket[0] : ticket;
        return ticketObj?.assignedToId?.toString() === expectedAssigneeId.toString();
      };

      // Helper function for assignment
      const assignTicket = async (ticketId: string | number, assigneeId: string | number) => {
        const assignRes = await apiRequest("PUT", `/api/tickets/${ticketId}`, {
          assignedToId: assigneeId
        });
        return assignRes.ok;
      };

      try {
        const assignedFromForm = variables?.assignedToId || form.getValues().assignedToId;

        if (assignedFromForm && assignedFromForm !== "" && assignedFromForm !== "unassigned") {
          let isAssigned = await verifyAssignment(data.id, assignedFromForm);

          // If not already assigned, attempt to assign
          if (!isAssigned) {
            const maxRetries = 3;
            for (let attempt = 1; attempt <= maxRetries && !isAssigned; attempt++) {
              console.log(`Attempt ${attempt} to assign ticket ${data.id} to user ${assignedFromForm}`);

              if (await assignTicket(data.id, assignedFromForm)) {
                // Wait a small amount of time for the assignment to propagate
                await new Promise(resolve => setTimeout(resolve, 300));
                isAssigned = await verifyAssignment(data.id, assignedFromForm);

                if (isAssigned) {
                  console.log('Assignment verified successfully');
                  // Invalidate relevant queries
                  await queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
                  await queryClient.invalidateQueries({ queryKey: ["/api/tickets/my"] });
                  await queryClient.invalidateQueries({ queryKey: ["/api/tickets", data.id] });
                  break;
                }
              }

              if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 500 * attempt));
              }
            }
          }

          if (!isAssigned) {
            console.warn('Failed to verify ticket assignment after multiple attempts');
            toast({
              title: 'Assignment Status Uncertain',
              description: 'The ticket was created but the assignment status could not be verified. Please check the ticket details.',
              variant: 'default',
            });
          } else {
            toast({
              title: 'Success',
              description: `Ticket #${data.id} created and assigned successfully.`,
            });
          }
        } else {
          toast({
            title: "Success",
            description: `Ticket #${data.id} has been created.`,
          });
        }
      } catch (err) {
        console.error('Assignment verification error:', err);
        toast({
          title: 'Warning',
          description: 'Ticket created but assignment status could not be verified.',
          variant: 'default',
        });
      }

      // Reset form and navigate only after all assignment checks are complete
      setTimeout(() => {
        form.reset();
        setFile(null);
        navigate(`/tickets/${data.id}`);
      }, 500); // Small delay to ensure assignments are processed
    },
    onError: (error: any) => {
      console.error('Ticket creation failed:', error);

      let errorMessage = "An error occurred while creating the ticket.";
      let errorDetails = "";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = error.message || error.error || "Unknown error occurred";
        if (error.details) {
          errorDetails = typeof error.details === 'string' ? error.details : JSON.stringify(error.details);
        }
      }

      // Check if it's a validation error
      if (errorMessage.includes('validation') || errorMessage.includes('required')) {
        errorMessage = "Please check all required fields and try again.";
      } else if (errorMessage.includes('database') || errorMessage.includes('SQL')) {
        errorMessage = "Database error occurred. Please try again later.";
        errorDetails = "Contact support if the problem persists.";
      }

      toast({
        title: "Failed to create ticket",
        description: errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = async (data: CreateTicketFormValues) => {
    try {
      console.log('Form data being submitted:', data);
      await createTicketMutation.mutateAsync(data);
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create ticket",
        variant: "destructive",
      });
    }
  };

  // Keep track of selected subcategories for each category
  const [categorySubcategories, setCategorySubcategories] = useState<Record<string, string>>({});

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    form.setValue("categoryId", value);

    // If we have a previously selected subcategory for this category, restore it
    const previousSubcategory = categorySubcategories[value];
    if (previousSubcategory) {
      form.setValue("subcategoryId", previousSubcategory);
    } else {
      form.setValue("subcategoryId", "");
    }
  };

  // Keep track of subcategory selections
  const handleSubcategoryChange = (value: string) => {
    form.setValue("subcategoryId", value);
    if (selectedCategoryId) {
      setCategorySubcategories(prev => ({
        ...prev,
        [selectedCategoryId]: value
      }));
    }
  };

  // Reset create dialog states on mount
  useEffect(() => {
    setDialogState(prev => ({
      ...prev,
      showAddCategory: false,
      showAddSubcategory: false,
      newCategoryName: '',
      newSubcategoryName: '',
      isAdding: false
    }));
  }, []);

  const handleAssignToMe = () => {
    if (user?.id) {
      form.setValue("assignedToId", user.id.toString());
    }
  };

  const addCategory = async () => {
    setDialogState(prev => ({ ...prev, isAdding: true }));
    try {
      const result = await apiRequest("POST", "/api/categories", {
        name: dialogState.newCategoryName,
        parentId: null
      });

      if (!result.ok) {
        const errText = await result.text();
        let message = errText || 'Failed to add category';
        try {
          const parsed = JSON.parse(errText);
          message = parsed?.error || parsed?.message || message;
        } catch (e) {
          // ignore JSON parse errors
        }
        throw new Error(message);
      }

      const created = await result.json();

      // Immediately update local state with the new category
      if (created && created.id) {
        const newId = created.id.toString();
        setLocalCategories(prev => {
          // Check if category already exists
          if (prev.some(cat => String(cat.id) === newId)) return prev;
          // Add the new category to the list
          const updated = [...prev, { id: created.id, name: created.name }];
          // Sort by name for consistency
          updated.sort((a, b) => a.name.localeCompare(b.name));
          return updated;
        });
        setSelectedCategoryId(newId);
        form.setValue("categoryId", newId);
      }

      // Invalidate and refetch the query to ensure DB persistence and sync
      await queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      await refetchCategories();

      toast({ title: 'Success', description: 'New category added successfully.' });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add category',
        variant: "destructive"
      });
    } finally {
      setDialogState(prev => ({ ...prev, showAddCategory: false, newCategoryName: '', isAdding: false }));
    }
  };

  const addSubcategory = async () => {
    if (!selectedCategoryId) {
      toast({
        title: 'Error',
        description: 'Please select a category first.',
        variant: "destructive"
      });
      return;
    }

    setDialogState(prev => ({ ...prev, isAdding: true }));
    try {
      const result = await apiRequest("POST", "/api/categories", {
        name: dialogState.newSubcategoryName,
        parentId: parseInt(selectedCategoryId)
      });

      if (!result.ok) {
        const errText = await result.text();
        let message = errText || 'Failed to add subcategory';
        try {
          const parsed = JSON.parse(errText);
          message = parsed?.error || parsed?.message || message;
        } catch (e) {
          // ignore
        }
        throw new Error(message);
      }

      const created = await result.json();

      // Immediately update local state with the new subcategory
      if (created && created.id && selectedCategoryId) {
        const newId = created.id.toString();
        setLocalSubcategories(prev => {
          const arr = prev[selectedCategoryId] || [];
          // Check if subcategory already exists
          if (arr.some(sub => String(sub.id) === newId)) return prev;
          // Add the new subcategory to the list
          const updated = {
            ...prev,
            [selectedCategoryId]: [...arr, { id: created.id, name: created.name }]
          };
          // Sort subcategories by name for consistency
          if (updated[selectedCategoryId]) {
            updated[selectedCategoryId].sort((a, b) => a.name.localeCompare(b.name));
          }
          return updated;
        });
        form.setValue("subcategoryId", newId);
      }

      // Invalidate and refetch the query to ensure DB persistence and sync
      await queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      await refetchCategories();

      toast({
        title: 'Success',
        description: 'New subcategory added successfully.'
      });
    } catch (error) {
      console.error('Error adding subcategory:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add subcategory',
        variant: "destructive"
      });
    } finally {
      setDialogState(prev => ({ ...prev, showAddSubcategory: false, newSubcategoryName: '', isAdding: false }));
    }
  };

  // Refetch categories when dialogs close
  useEffect(() => {
    if (!dialogState.showAddCategory && !dialogState.showAddSubcategory) {
      refetchCategories();
    }
  }, [dialogState.showAddCategory, dialogState.showAddSubcategory]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for larger screens, or as a slide-over for mobile */}
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Create Ticket" />

        {/* Main content scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" className="mr-2" onClick={() => navigate("/tickets")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold text-gray-800">Create New Support Ticket</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>New Support Request</CardTitle>
              <CardDescription>
                Provide detailed information about your issue for faster resolution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Add New Category Modal */}
                  <Dialog
                    open={dialogState.showAddCategory}
                    onOpenChange={(open) => setDialogState(prev => ({ ...prev, showAddCategory: open }))}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                        <DialogDescription>
                          Enter a name for the new category.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <FormItem>
                          <FormLabel>Category Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter category name"
                              value={dialogState.newCategoryName}
                              onChange={(e) => setDialogState(prev => ({ ...prev, newCategoryName: e.target.value }))}
                              disabled={dialogState.isAdding}
                            />
                          </FormControl>
                        </FormItem>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDialogState(prev => ({ ...prev, showAddCategory: false }))}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          disabled={dialogState.isAdding || !dialogState.newCategoryName}
                          onClick={addCategory}
                        >
                          Add
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Add New Subcategory Modal */}
                  <Dialog
                    open={dialogState.showAddSubcategory}
                    onOpenChange={(open) => setDialogState(prev => ({ ...prev, showAddSubcategory: open }))}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Subcategory</DialogTitle>
                        <DialogDescription>
                          Enter a name for the new subcategory.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <FormItem>
                          <FormLabel>Subcategory Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter subcategory name"
                              value={dialogState.newSubcategoryName}
                              onChange={(e) => setDialogState(prev => ({ ...prev, newSubcategoryName: e.target.value }))}
                              disabled={dialogState.isAdding}
                            />
                          </FormControl>
                        </FormItem>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDialogState(prev => ({ ...prev, showAddSubcategory: false }))}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          disabled={dialogState.isAdding || !dialogState.newSubcategoryName}
                          onClick={addSubcategory}
                        >
                          Add
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Add New User Modal */}
                  <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>
                          Enter the email address for the new user. We'll create an account automatically.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="Enter user's email address"
                                value={newUserEmail}
                                onChange={e => setNewUserEmail(e.target.value)}
                                disabled={addingUser}
                              />
                            </FormControl>
                          </FormItem>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowAddUser(false)}>
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          disabled={addingUser || !newUserEmail}
                          onClick={async () => {
                            setAddingUser(true);
                            try {
                              const email = newUserEmail;
                              const username = email;
                              const name = email;
                              const password = Math.random().toString(36).slice(-8);
                              const res = await apiRequest("POST", "/api/users", { email, role: "user", username, name, password });
                              if (res.ok) {
                                const created = await res.json();
                                toast({ title: "Success", description: "New user created successfully." });
                                setShowAddUser(false);
                                setNewUserEmail("");
                                await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
                                setTimeout(() => {
                                  if (created && created.id) {
                                    form.setValue("contactId", created.id.toString());
                                    form.setValue("contactEmail", created.email);
                                  }
                                }, 300);
                              } else {
                                toast({ title: "Error", description: "Failed to add user." });
                              }
                            } finally {
                              setAddingUser(false);
                            }
                          }}
                        >
                          Add User
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Add New Agent Modal */}
                  <Dialog open={showAddAgent} onOpenChange={setShowAddAgent}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Agent</DialogTitle>
                        <DialogDescription>
                          Enter the email address for the new agent. We'll create an account automatically.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="Enter agent's email address"
                                value={newAgentEmail}
                                onChange={e => setNewAgentEmail(e.target.value)}
                                disabled={addingAgent}
                              />
                            </FormControl>
                          </FormItem>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowAddAgent(false)}>
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          disabled={addingAgent || !newAgentEmail}
                          onClick={async () => {
                            setAddingAgent(true);
                            try {
                              const email = newAgentEmail;
                              const username = email;
                              const name = email;
                              const password = Math.random().toString(36).slice(-8);
                              const res = await apiRequest("POST", "/api/users", { email, role: "agent", username, name, password });
                              if (res.ok) {
                                const created = await res.json();
                                toast({ title: "Success", description: "New agent created successfully." });
                                setShowAddAgent(false);
                                setNewAgentEmail("");
                                await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
                                setTimeout(() => {
                                  if (created && created.id) {
                                    form.setValue("assignedToId", created.id.toString());
                                  }
                                }, 300);
                              } else {
                                toast({ title: "Error", description: "Failed to add agent." });
                              }
                            } finally {
                              setAddingAgent(false);
                            }
                          }}
                        >
                          Add Agent
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ticket Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief summary of the issue" {...field} />
                        </FormControl>
                        <FormDescription>
                          Be concise and specific about the problem
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Company and Location were moved into Contact Information so they are auto-filled from contact */}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Select
                                onValueChange={(value) => handleCategoryChange(value)}
                                value={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <ScrollArea className="h-[200px]">
                                    {/* Add New Category Button */}
                                    <div className="p-2">
                                      <Button
                                        variant="outline"
                                        className="w-full"
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setDialogState(prev => ({ ...prev, showAddCategory: true }));
                                        }}
                                      >
                                        ➕ Add New Category
                                      </Button>
                                    </div>
                                    <Separator className="my-2" />
                                    {localCategories.map((category) => (
                                      <SelectItem key={category.id} value={category.id.toString()}>
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                  </ScrollArea>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subcategoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subcategory</FormLabel>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Select
                                onValueChange={handleSubcategoryChange}
                                value={field.value || ""}
                                disabled={!selectedCategoryId}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Subcategory" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <ScrollArea className="h-[200px]">
                                    {/* Add New Subcategory Button */}
                                    <div className="p-2">
                                      <Button
                                        variant="outline"
                                        className="w-full"
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setDialogState(prev => ({ ...prev, showAddSubcategory: true }));
                                        }}
                                      >
                                        ➕ Add New Subcategory
                                      </Button>
                                    </div>
                                    <Separator className="my-2" />
                                    {(selectedCategoryId ? (localSubcategories[selectedCategoryId as keyof typeof localSubcategories] || []) : []).map((subcategory) => (
                                      <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                                        {subcategory.name}
                                      </SelectItem>
                                    ))}
                                  </ScrollArea>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Priority for admin/agent is in the Contact Information section; users will see company/location + priority below this block. */}
                  </div>

                  {/* For regular users show company/location before priority here */}
                  {hasRole(user?.role, "user") && !hasAnyRole(user?.role, ["admin", "agent"]) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <CompanyCombobox
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter location" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <FormField
                      control={form.control}
                      name="supportType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Support Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Support Type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="remote">Remote</SelectItem>
                              <SelectItem value="telephonic">Telephonic</SelectItem>
                              <SelectItem value="onsite_visit">Onsite Visit</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />


                    {/* <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    /> */}
                  </div>

                  {hasAnyRole(user?.role, ["admin", "agent"]) && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-800">Contact Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Contact Info Dropdown: Only users for admin/agent */}
                        <FormField
                          control={form.control}
                          name="contactId"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Contact Info</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleContactSelection(value);
                                }}
                                value={field.value || ""}
                                disabled={isLoadingUsers}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select User - Search by username or email" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <ScrollArea className="h-[200px]">
                                    <div className="p-2">
                                      <Input
                                        placeholder="Search by username or email..."
                                        value={searchAgent}
                                        onChange={(e) => setSearchAgent(e.target.value)}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        className="mb-2"
                                      />
                                    </div>
                                    {/* None option */}
                                    <SelectItem value="none">None</SelectItem>
                                    {/* Add New User Button */}
                                    <div className="p-2">
                                      <Button
                                        variant="outline"
                                        className="w-full"
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setShowAddUser(true);
                                        }}
                                      >
                                        ➕ Add New User
                                      </Button>
                                    </div>
                                    <div className="px-2">
                                      <Separator className="my-2" />
                                    </div>
                                    {/* Existing users */}
                                    {filteredContacts.length > 0 ? (
                                      filteredContacts.map((contact) => (
                                        <SelectItem key={contact.id} value={contact.id.toString()}>
                                          {contact.username} - {contact.email} ({contact.role})
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem value="no-contacts" disabled>
                                        No contacts found
                                      </SelectItem>
                                    )}
                                  </ScrollArea>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Select the user who will be the main contact for this ticket
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Assigned to: admins see dropdown + quick-assign, agents see only quick-assign */}
                        {hasRole(user?.role, "admin") && (
                          <FormField
                            control={form.control}
                            name="assignedToId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Assigned to</FormLabel>
                                <Select
                                  onValueChange={(value) => {
                                    // If selecting self, use "Assign to me" logic
                                    if (value === user?.id?.toString()) {
                                      field.onChange(value);
                                    } else {
                                      // For other selections, only admin can assign to others
                                      if (hasRole(user?.role, "admin")) {
                                        field.onChange(value);
                                      } else {
                                        // Non-admin users can only self-assign
                                        toast({
                                          title: "Permission Denied",
                                          description: "Only admins can assign tickets to other agents",
                                          variant: "destructive"
                                        });
                                      }
                                    }
                                  }}
                                  value={field.value || ""}
                                  disabled={isLoadingUsers}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Agent" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <ScrollArea className="h-[200px]">
                                      {/* Add New Agent Button - Admin Only */}
                                      {hasAnyRole(user?.role, ["admin"]) && (
                                        <div className="p-2">
                                          <Button
                                            variant="outline"
                                            className="w-full"
                                            type="button"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setShowAddAgent(true);
                                            }}
                                          >
                                            ➕ Add New Agent
                                          </Button>
                                        </div>
                                      )}
                                      <div className="px-2">
                                        <Separator className="my-2" />
                                      </div>
                                      {agentOptions.length > 0 ? (
                                        agentOptions.map((agent) => (
                                          <SelectItem
                                            key={agent.id}
                                            value={agent.id.toString()}
                                            disabled={!hasAnyRole(user?.role, ["admin"]) && agent.id !== user?.id}
                                          >
                                            {agent.username} - {agent.email}
                                            {agent.id === user?.id && " (me)"}
                                          </SelectItem>
                                        ))
                                      ) : (
                                        <SelectItem value="no-agents" disabled>
                                          No agents found
                                        </SelectItem>
                                      )}
                                    </ScrollArea>
                                  </SelectContent>
                                </Select>
                                {/* Quick assign/unassign toggle */}
                                {hasAnyRole(user?.role, ["admin", "agent"]) && (
                                  <div className="mt-2">
                                    <Button
                                      variant={field.value === user?.id?.toString() ? "default" : "outline"}
                                      className="w-full"
                                      type="button"
                                      onClick={() => {
                                        // Prefer assigning to an agent account that matches current user's email if available
                                        const matchedAgent = agentOptions.find(a => (a.email && user?.email && a.email.toLowerCase() === user.email.toLowerCase()) || String(a.id) === String(user?.id));
                                        const targetId = matchedAgent ? String(matchedAgent.id) : (user?.id ? String(user.id) : "");

                                        if (field.value === targetId) {
                                          field.onChange(""); // Unassign
                                          return;
                                        }

                                        if (matchedAgent) {
                                          // Assign to the matched agent id so the Select shows correctly
                                          field.onChange(String(matchedAgent.id));
                                        } else if (hasAnyRole(user?.role, ["agent"])) {
                                          // User is already an agent (including multi-role), assign to self immediately
                                          field.onChange(user?.id ? String(user.id) : "");
                                        } else {
                                          // Admin without agent role - offer to create an agent account
                                          setNewAgentEmail(user?.email || "");
                                          setShowAddAgent(true);
                                          toast({ title: 'Agent account required', description: 'You are not registered as an agent. Create an agent account to assign tickets to yourself.', variant: 'default' });
                                        }
                                      }}
                                    >
                                      {field.value === user?.id?.toString() ? "✓ Assigned to me" : "➕ Assign to me"}
                                    </Button>
                                  </div>
                                )}
                                <FormDescription>
                                  {hasAnyRole(user?.role, ["admin"])
                                    ? "Assign this ticket to any agent"
                                    : "You can assign tickets to yourself"}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {hasAnyRole(user?.role, ["agent"]) && !hasAnyRole(user?.role, ["admin"]) && (
                          <FormField
                            control={form.control}
                            name="assignedToId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Assigned to</FormLabel>
                                <div className="space-y-2">
                                  <Button
                                    variant={field.value === user?.id?.toString() ? "default" : "outline"}
                                    className="w-full"
                                    type="button"
                                    onClick={() => {
                                      // Toggle assignment
                                      if (field.value === user?.id?.toString()) {
                                        form.setValue("assignedToId", "");
                                      } else {
                                        form.setValue("assignedToId", user?.id?.toString() || "");
                                      }
                                    }}
                                  >
                                    {field.value === user?.id?.toString() ? "✓ Assigned to me" : "➕ Assign to me"}
                                  </Button>
                                  {field.value === user?.id?.toString() && (
                                    <div className="text-sm text-gray-600 px-2">
                                      Ticket will be assigned to you upon creation
                                    </div>
                                  )}
                                </div>
                                <FormDescription>
                                  Click to assign/unassign this ticket to yourself
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name="contactName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Name

                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Auto-filled when agent selected" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone (Optional)

                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Auto-filled when agent selected" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactDepartment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Department (Optional)

                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Auto-filled when agent selected" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Company and Location - moved here so they are populated when contact is selected */}
                        <FormField
                          control={form.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                <CompanyCombobox
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="Auto-filled from contact" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Priority" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={6}
                            placeholder="Detailed description of the issue you're experiencing..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include relevant details like error messages, when it started, and what you've tried
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border border-dashed border-gray-300 rounded-md p-6">
                    <div className="text-center">
                      <FilePlus className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md bg-white font-medium text-primary hover:text-primary-dark focus-within:outline-none"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                setFile(e.target.files[0]);
                              }
                            }}
                            accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                          />
                        </label>
                        <p className="pl-1 text-sm text-gray-500">or drag and drop</p>
                        {file && (
                          <p className="text-xs text-green-600 mt-2">
                            Selected file: {file.name}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG, PDF, DOC up to 10MB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/tickets")}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createTicketMutation.isPending}
                    >
                      {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}


