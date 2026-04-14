<?php
// HOTPATCH: Fix REST-style comment POST routing
require_once __DIR__ . '/tickets-comment-fix.php';
/**
 * Tickets API Endpoints - FIXED VERSION
 * IT Helpdesk Portal - PHP Backend
 */

// Function to check if a user has a specific role (supports comma-separated roles)
function userHasRole($userRole, $requiredRole) {
    if (empty($userRole)) {
        return false;
    }
    $roles = array_map('trim', explode(',', $userRole));
    return in_array($requiredRole, $roles);
}

// Function to check if a user has any of the required roles (supports comma-separated roles)
function userHasAnyRole($userRole, $requiredRoles) {
    if (empty($userRole)) {
        return false;
    }
    $roles = array_map('trim', explode(',', $userRole));
    foreach ($requiredRoles as $required) {
        if (in_array($required, $roles)) {
            return true;
        }
    }
    return false;
}

// Function to sanitize dates for JavaScript consumption
function sanitizeDateForJS($dateValue) {
    // Handle NULL or empty dates
    if (is_null($dateValue) || empty($dateValue) || $dateValue === '0000-00-00 00:00:00') {
        return null;
    }
    
    // Ensure the date is in a valid format and return an ISO 8601 string.
    // Prefer DateTime for robust timezone handling.
    try {
        // If the string looks like a DB datetime without timezone (e.g. "YYYY-MM-DD HH:MM:SS"),
        // parse it explicitly as UTC so PHP doesn't assume server local timezone.
        if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $dateValue)) {
            $dt = DateTime::createFromFormat('Y-m-d H:i:s', $dateValue, new DateTimeZone('UTC'));
            if ($dt === false) {
                return null;
            }
            return $dt->format(DateTime::ATOM);
        }

        // Otherwise let DateTime parse (handles ISO strings with timezone offsets)
        $dt = new DateTime($dateValue);
        $dt->setTimezone(new DateTimeZone('UTC'));
        return $dt->format(DateTime::ATOM);
    } catch (Exception $e) {
        return null;
    }
}

// Get the correct path to database config regardless of working directory
$configPath = dirname(__DIR__) . '/config/database.php';
if (!file_exists($configPath)) {
    $configPath = __DIR__ . '/../config/database.php';
}
require_once $configPath;

// Include email notification helpers
require_once __DIR__ . '/../helpers/email_notifications.php';

// Enable CORS for frontend - Dynamic Origin for IIS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Vary: Origin');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$method = $_SERVER['REQUEST_METHOD'];

// Include shared session configuration
require_once __DIR__ . '/../config/session.php';
initializeSession();

// Handle both JSON and FormData requests
$request = [];

// Check if request data is provided by cPanel wrapper
if (isset($_REQUEST_DATA) && !empty($_REQUEST_DATA)) {
    $request = $_REQUEST_DATA;
    error_log("Using cPanel wrapper request data: " . print_r($request, true));
} else {
    // Original request handling
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (strpos($contentType, 'application/json') !== false) {
        $request = json_decode(file_get_contents('php://input'), true) ?? [];
    } else {
        $request = $_POST ?? [];
    }
    error_log("Using direct request data: " . print_r($request, true));
}

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/api/tickets', PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

try {
    // Enhanced logging for debugging
    error_log("=== TICKETS API REQUEST START ===");
    error_log("Method: " . $method);
    error_log("REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'Not set'));
    error_log("Path parts: " . print_r($pathParts, true));
    error_log("Session ID: " . session_id());
    error_log("Session data: " . print_r($_SESSION, true));
    
    $action = $_GET['action'] ?? '';
    $ticketId = $_GET['id'] ?? null;
    
    // Handle RESTful routing: /tickets/123 or /tickets/123/comments
    if (count($pathParts) >= 2) {
        if ($pathParts[0] === 'tickets' && is_numeric($pathParts[1])) {
            $ticketId = $pathParts[1];
            if (isset($pathParts[2]) && $pathParts[2] === 'comments') {
                $action = 'comment';
            }
        }
    }
    
    switch ($method) {
        case 'GET':
            if ($action === 'comment') {
                handleGetComments($ticketId);
            } elseif ($ticketId) {
                handleGetSingleTicket($ticketId);
            } else {
                handleGetTickets();
            }
            break;
        case 'POST':
            // If the client used query params (e.g. tickets.php?action=comment&id=123)
            // prefer using the explicit action param so we correctly route to comment creation.
            if (!empty($action) && $action === 'comment' && !empty($ticketId)) {
                error_log("Routing POST by action param to create comment. ticketId={$ticketId}");
                handleCreateComment($ticketId, $request);
                break;
            }

            if (count($pathParts) >= 4 && $pathParts[2] === 'comments') {
                handleCreateComment($pathParts[1], $request);
            } elseif (isset($pathParts[1]) && is_numeric($pathParts[1])) {
                $ticketId = $pathParts[1];
                if (isset($pathParts[2]) && $pathParts[2] === 'comments') {
                    handleCreateComment($ticketId, $request);
                } else {
                    handleCreateTicket($request);
                }
            } else {
                handleCreateTicket($request);
            }
            break;
        case 'PUT':
            $ticketId = $_GET['id'] ?? null;
            handleUpdateTicket($ticketId, $request);
            break;
        case 'DELETE':
            $ticketId = $_GET['id'] ?? null;
            handleDeleteTicket($ticketId);
            break;
        default:
            jsonResponse(['error' => 'Method not allowed'], 405);
    }
} catch (Exception $e) {
    error_log("Tickets API Error: " . $e->getMessage());
    // For debugging: return the exception message in the response (remove in production)
    jsonResponse([
        'error' => 'Internal server error',
        'details' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], 500);
}

function handleGetTickets() {
    requireAuth();
    
    $db = getDb();
    
    $filter = $_GET['filter'] ?? 'all';
    $user = $_GET['user'] ?? '';
    $status = $_GET['status'] ?? '';
    $priority = $_GET['priority'] ?? '';
    $categoryId = $_GET['categoryId'] ?? '';
    $userId = $_SESSION['user_id'];
    $userRole = $_SESSION['user_role'];
    
    $sql = "
        SELECT 
            t.*,
            c.name as category_name,
            sc.name as subcategory_name,
            cb.name as created_by_name,
            cb.email as created_by_email,
            cb.contact_number as created_by_contact_number,
            at.name as assigned_to_name,
            at.email as assigned_to_email
        FROM tickets t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN categories sc ON t.subcategory_id = sc.id
        LEFT JOIN users cb ON t.created_by_id = cb.id
        LEFT JOIN users at ON t.assigned_to_id = at.id
        WHERE 1=1
    ";
    
    $params = [];
    
    // Apply user/role based filters first
    $userFilterApplied = false;
    
    if ($filter === 'my' || $user === 'my') {
        $sql .= " AND (t.created_by_id = ? OR t.assigned_to_id = ? OR t.contact_email = ?)";
        $params[] = $userId;
        $params[] = $userId;
        $params[] = $_SESSION['user_email'] ?? '';
        $userFilterApplied = true;
    } elseif (userHasRole($userRole, 'user') && !userHasAnyRole($userRole, ['admin', 'agent'])) {
        $sql .= " AND (t.created_by_id = ? OR t.assigned_to_id = ? OR t.contact_email = ?)";
        $params[] = $userId;
        $params[] = $userId;
        $params[] = $_SESSION['user_email'] ?? '';
        $userFilterApplied = true;
    }
    
    // Assigned To filter
    if (isset($_GET['assignedToId'])) {
        $assignedToId = $_GET['assignedToId'];
        if ($assignedToId === '0') {
            // Unassigned tickets only
            $sql .= " AND (t.assigned_to_id IS NULL OR t.assigned_to_id = 0)";
        } elseif ($assignedToId !== '') {
            // Specific agent
            $sql .= " AND t.assigned_to_id = ?";
            $params[] = $assignedToId;
        }
        // If assignedToId is empty string, do not filter (All Agents)
    }

    // Other filters
    if ($status) {
        $sql .= " AND t.status = ?";
        $params[] = $status;
    }
    
    if ($priority) {
        $sql .= " AND t.priority = ?";
        $params[] = $priority;
    }
    
    if ($categoryId) {
        $sql .= " AND t.category_id = ?";
        $params[] = $categoryId;
    }
    
    // Company name filter (case-insensitive, partial matching)
    if (isset($_GET['companyName']) && $_GET['companyName'] !== '') {
        $companyName = $_GET['companyName'];
        // Use LIKE for partial matching to handle variations like "Denasa" and "Denasa Buildcon"
        $sql .= " AND (LOWER(t.company_name) LIKE LOWER(?) OR LOWER(cb.company_name) LIKE LOWER(?))";
        $params[] = '%' . $companyName . '%';
        $params[] = '%' . $companyName . '%';
    }

    $sql .= " ORDER BY t.created_at DESC";
    
    $tickets = $db->fetchAll($sql, $params);
    
    // Transform tickets to match frontend expectations and add comment count
            $transformedTickets = array_map(function($ticket) use ($db) {
        $commentCount = $db->fetchOne("SELECT COUNT(*) as cnt FROM comments WHERE ticket_id = ?", [$ticket['id']]);
        return [
            'id' => (int)$ticket['id'],
            'title' => $ticket['title'],
            'description' => $ticket['description'],
            'status' => $ticket['status'],
            'priority' => $ticket['priority'],
            'supportType' => $ticket['support_type'],
            'contactEmail' => $ticket['contact_email'],
            'contactName' => $ticket['contact_name'],
            'contactPhone' => $ticket['contact_phone'],
            'contactDepartment' => $ticket['contact_department'],
            'categoryId' => (int)$ticket['category_id'],
            'subcategoryId' => $ticket['subcategory_id'] ? (int)$ticket['subcategory_id'] : null,
            'createdById' => (int)$ticket['created_by_id'],
            'assignedToId' => $ticket['assigned_to_id'] ? (int)$ticket['assigned_to_id'] : null,
            'dueDate' => sanitizeDateForJS($ticket['due_date']),
            'attachmentUrl' => $ticket['attachment_url'],
            'attachmentName' => $ticket['attachment_name'],
            'createdAt' => sanitizeDateForJS($ticket['created_at']),
            'updatedAt' => sanitizeDateForJS($ticket['updated_at']),
            'categoryName' => $ticket['category_name'],
            'subcategoryName' => $ticket['subcategory_name'],
            'createdByName' => $ticket['created_by_name'],
            'createdByEmail' => $ticket['created_by_email'],
            'assignedToName' => $ticket['assigned_to_name'],
            'assignedToEmail' => $ticket['assigned_to_email'],
            'commentCount' => (int)($commentCount['cnt'] ?? 0),
            'companyName' => $ticket['company_name'],
            'location' => $ticket['location'],
            'category' => [
                'id' => (int)$ticket['category_id'],
                'name' => $ticket['category_name']
            ],
            'subcategory' => $ticket['subcategory_id'] ? [
                'id' => (int)$ticket['subcategory_id'],
                'name' => $ticket['subcategory_name']
            ] : null,
            'createdBy' => [
                'id' => (int)$ticket['created_by_id'],
                'name' => $ticket['created_by_name'],
                'email' => $ticket['created_by_email'],
                'contactNumber' => $ticket['created_by_contact_number'] ?? null
            ],
            'assignedTo' => $ticket['assigned_to_id'] ? [
                'id' => (int)$ticket['assigned_to_id'],
                'name' => $ticket['assigned_to_name'],
                'email' => $ticket['assigned_to_email']
            ] : null
        ];
    }, $tickets);

    jsonResponse($transformedTickets);
}

function handleCreateTicket($request) {
    error_log("=== handleCreateTicket START ===");
    error_log("Request data: " . print_r($request, true));
    error_log("Session data: " . print_r($_SESSION, true));
    error_log("Session ID: " . session_id());
    
    // Authentication check
    try {
        error_log("Step 1: Checking authentication...");
        requireAuth(); // This function doesn't return user data, just checks auth
        error_log("Authentication successful - User ID: " . $_SESSION['user_id']);
    } catch (Exception $e) {
        error_log("Authentication failed: " . $e->getMessage());
        jsonResponse(['error' => 'Authentication required', 'details' => $e->getMessage()], 401);
        return;
    }
    
    // Data extraction and validation
    error_log("Step 2: Extracting and validating data...");
    $title = sanitizeInput($request['title'] ?? '');
    $description = sanitizeInput($request['description'] ?? '');
    $priority = sanitizeInput($request['priority'] ?? 'medium');
    $categoryId = (int)($request['categoryId'] ?? $request['category_id'] ?? 0);
    $subcategoryId = !empty($request['subcategoryId']) ? (int)$request['subcategoryId'] : (!empty($request['subcategory_id']) ? (int)$request['subcategory_id'] : null);
    $supportType = sanitizeInput($request['supportType'] ?? $request['support_type'] ?? 'remote');
    $contactEmail = sanitizeInput($request['contactEmail'] ?? $request['contact_email'] ?? '');
    $contactName = sanitizeInput($request['contactName'] ?? $request['contact_name'] ?? '');
    $contactPhone = sanitizeInput($request['contactPhone'] ?? $request['contact_phone'] ?? '');
    $contactDepartment = sanitizeInput($request['contactDepartment'] ?? $request['contact_department'] ?? '');
    
    error_log("Extracted data - title: '$title', description: '$description', categoryId: $categoryId");
    
    // Handle due date
    $dueDate = null;
    if (!empty($request['dueDate'])) {
        try {
            $dueDateTime = new DateTime($request['dueDate']);
            $dueDate = $dueDateTime->format('Y-m-d H:i:s');
            error_log("Due date processed: " . $dueDate);
        } catch (Exception $e) {
            error_log("Invalid due date format: " . $request['dueDate']);
            $dueDate = null;
        }
    }
    
    // Enhanced validation with specific error messages
    $validationErrors = [];
    
    if (empty($title)) {
        $validationErrors[] = 'Title is required and cannot be empty';
    } elseif (strlen($title) < 5) {
        $validationErrors[] = 'Title must be at least 5 characters long';
    } elseif (strlen($title) > 500) {
        $validationErrors[] = 'Title cannot exceed 500 characters';
    }
    
    // Description is optional, no minimum length
    // No validation for description
    
    if ($categoryId === 0) {
        $validationErrors[] = 'Category is required - please select a valid category';
    }
    
    if (!in_array($priority, ['low', 'medium', 'high'])) {
        $validationErrors[] = 'Priority must be low, medium, or high';
    }
    
    if (!in_array($supportType, ['remote', 'telephonic', 'onsite_visit', 'other'])) {
        $validationErrors[] = 'Support type must be remote, telephonic, onsite_visit, or other';
    }
    
    if (!empty($validationErrors)) {
        error_log("Validation failed: " . implode(', ', $validationErrors));
        jsonResponse([
            'error' => 'Validation failed', 
            'details' => implode('. ', $validationErrors),
            'validation_errors' => $validationErrors
        ], 400);
        return;
    }
    
    // Database operations
    try {
        error_log("Step 3: Establishing database connection...");
        $db = getDb();
        error_log("Database connection successful");
        
        // Verify category exists - using positional parameters instead of named parameters
        $category = $db->fetchOne("SELECT id FROM categories WHERE id = ?", [$categoryId]);
        if (!$category) {
            error_log("Category not found: $categoryId");
            jsonResponse([
                'error' => 'Invalid category', 
                'details' => "Category with ID $categoryId does not exist"
            ], 400);
            return;
        }
        error_log("Category verified: ID $categoryId");
        
        // Verify subcategory exists if provided - using positional parameters
        if ($subcategoryId !== null) {
            $subcategory = $db->fetchOne("SELECT id FROM categories WHERE id = ?", [$subcategoryId]);
            if (!$subcategory) {
                error_log("Subcategory not found: $subcategoryId, setting to null");
                $subcategoryId = null; // Set to null if invalid instead of failing
            } else {
                error_log("Subcategory verified: ID $subcategoryId");
            }
        }
        
        // Check if user exists - using positional parameters
        $userExists = $db->fetchOne("SELECT id FROM users WHERE id = ?", [$_SESSION['user_id']]);
        if (!$userExists) {
            error_log("User not found: " . $_SESSION['user_id']);
            jsonResponse([
                'error' => 'Invalid user', 
                'details' => 'User session is invalid'
            ], 400);
            return;
        }
        error_log("User verified: ID " . $_SESSION['user_id']);
        
        // Get user's stored company info (handle databases that may not have 'location' column)
        $userData = ['company_name' => '', 'location' => ''];
        try {
            $columns = $db->fetchAll("SHOW COLUMNS FROM users");
            $hasLocation = false;
            foreach ($columns as $col) {
                if (isset($col['Field']) && $col['Field'] === 'location') {
                    $hasLocation = true;
                    break;
                }
            }
            $selectCols = $hasLocation ? 'company_name, location' : 'company_name';
            $fetched = $db->fetchOne("SELECT $selectCols FROM users WHERE id = ?", [$_SESSION['user_id']]);
            if ($fetched) {
                $userData = $fetched;
            }
            if (!isset($userData['location'])) {
                $userData['location'] = '';
            }
        } catch (Exception $e) {
            error_log("Could not fetch user company/location: " . $e->getMessage());
            $userData = ['company_name' => '', 'location' => ''];
        }
        
        // Prepare ticket data
        error_log("Step 4: Preparing ticket data...");
        // If frontend provided an assigned agent id, validate it and persist at creation time.
        $assignedToId = null;
        if (!empty($request['assignedToId'])) {
            $candidateId = intval($request['assignedToId']);
            // Validate the user exists and is an agent (or admin) before assigning
            $candidate = $db->fetchOne("SELECT id, role, email, name FROM users WHERE id = ?", [$candidateId]);
            if ($candidate && in_array($candidate['role'], ['agent', 'admin'])) {
                $assignedToId = $candidateId;
            } else {
                error_log("Requested assignee is not a valid agent (or not found): " . print_r($request['assignedToId'], true));
                $assignedToId = null;
            }
        }

        $ticketData = [
            'title' => $title,
            'description' => $description,
            'status' => 'open',
            'priority' => $priority,
            'support_type' => $supportType,
            'contact_email' => $contactEmail ?: $_SESSION['user_email'] ?? '',
            'contact_name' => $contactName ?: $_SESSION['user_name'] ?? '',
            'contact_phone' => $contactPhone,
            'contact_department' => $contactDepartment,
            'company_name' => sanitizeInput($request['companyName'] ?? $userData['company_name'] ?? ''),
            'location' => sanitizeInput($request['location'] ?? $userData['location'] ?? ''),
            'category_id' => $categoryId,
            'subcategory_id' => $subcategoryId,
            'created_by_id' => $_SESSION['user_id'],
            'assigned_to_id' => $assignedToId,
            'due_date' => $dueDate,
            // Store timestamps in UTC to avoid timezone confusion across environments
            'created_at' => gmdate('Y-m-d H:i:s'),
                'updated_at' => gmdate('Y-m-d H:i:s')
        ];
        
        error_log("Ticket data prepared: " . print_r($ticketData, true));
        
        // Handle file upload if present
        if (!empty($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
            error_log("File upload detected, processing...");
            $uploadDir = '../../uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            
            $fileName = time() . '_' . basename($_FILES['attachment']['name']);
            $uploadPath = $uploadDir . $fileName;
            
            if (move_uploaded_file($_FILES['attachment']['tmp_name'], $uploadPath)) {
                $ticketData['attachment_url'] = '/uploads/' . $fileName;
                $ticketData['attachment_name'] = $_FILES['attachment']['name'];
                error_log("File uploaded successfully: $fileName");
            } else {
                error_log("File upload failed");
                jsonResponse([
                    'error' => 'File upload failed', 
                    'details' => 'Could not save uploaded file'
                ], 500);
                return;
            }
        }
        
        // Insert ticket into database
        error_log("Step 5: Inserting ticket into database...");
        $ticketId = $db->insert('tickets', $ticketData);
        
        if (!$ticketId) {
            error_log("Failed to insert ticket into database");
            jsonResponse([
                'error' => 'Database error', 
                'details' => 'Failed to create ticket in database'
            ], 500);
            return;
        }
        
        error_log("Ticket created successfully with ID: $ticketId");
        
        // Retrieve the created ticket with relations, including assigned agent info
        $ticket = $db->fetchOne("
            SELECT 
                t.*,
                c.name as category_name,
                sc.name as subcategory_name,
                cb.name as created_by_name,
                cb.email as created_by_email,
                at.name as assigned_to_name,
                at.email as assigned_to_email,
                at.contact_number as assigned_to_contact_number
            FROM tickets t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN categories sc ON t.subcategory_id = sc.id
            LEFT JOIN users cb ON t.created_by_id = cb.id
            LEFT JOIN users at ON t.assigned_to_id = at.id
            WHERE t.id = ?
        ", [$ticketId]);
        
        if (!$ticket) {
            error_log("Failed to retrieve created ticket");
            jsonResponse(['error' => 'Ticket created but failed to retrieve'], 500);
            return;
        }
        
        // Transform ticket to match frontend expectations, including assigned agent info
        $transformedTicket = [
            'id' => (int)$ticket['id'],
            'title' => $ticket['title'],
            'description' => $ticket['description'],
            'status' => $ticket['status'],
            'priority' => $ticket['priority'],
            'supportType' => $ticket['support_type'],
            'contactEmail' => $ticket['contact_email'],
            'contactName' => $ticket['contact_name'],
            'contactPhone' => $ticket['contact_phone'],
            'contactDepartment' => $ticket['contact_department'],
            'categoryId' => (int)$ticket['category_id'],
            'subcategoryId' => $ticket['subcategory_id'] ? (int)$ticket['subcategory_id'] : null,
            'createdById' => (int)$ticket['created_by_id'],
            'assignedToId' => $ticket['assigned_to_id'] ? (int)$ticket['assigned_to_id'] : null,
            'dueDate' => sanitizeDateForJS($ticket['due_date']),
            'attachmentUrl' => $ticket['attachment_url'],
            'attachmentName' => $ticket['attachment_name'],
            'createdAt' => sanitizeDateForJS($ticket['created_at']),
            'updatedAt' => sanitizeDateForJS($ticket['updated_at']),
            'categoryName' => $ticket['category_name'],
            'subcategoryName' => $ticket['subcategory_name'],
            'createdByName' => $ticket['created_by_name'],
            'createdByEmail' => $ticket['created_by_email'],
            'assignedToName' => $ticket['assigned_to_name'],
            'assignedToEmail' => $ticket['assigned_to_email'],
            'assignedToContactNumber' => $ticket['assigned_to_contact_number'],
            'companyName' => $ticket['company_name'],
            'location' => $ticket['location'],
            'category' => [
                'id' => (int)$ticket['category_id'],
                'name' => $ticket['category_name']
            ],
            'subcategory' => $ticket['subcategory_id'] ? [
                'id' => (int)$ticket['subcategory_id'],
                'name' => $ticket['subcategory_name']
            ] : null,
            'createdBy' => [
                'id' => (int)$ticket['created_by_id'],
                'name' => $ticket['created_by_name'],
                'email' => $ticket['created_by_email']
            ],
            'assignedTo' => $ticket['assigned_to_id'] ? [
                'id' => (int)$ticket['assigned_to_id'],
                'name' => $ticket['assigned_to_name'],
                'email' => $ticket['assigned_to_email'],
                'contactNumber' => $ticket['assigned_to_contact_number']
            ] : null
        ];
        
        error_log("Ticket creation successful: " . print_r($transformedTicket, true));
        
        // Send email notifications for ticket creation
        try {
            // Notify the user who created the ticket
            if (!empty($transformedTicket['createdBy']['email'])) {
                notifyUserTicketCreation($transformedTicket, $transformedTicket['createdBy']);
            }

            // Notify assigned agent (if assigned at creation time)
            if (!empty($transformedTicket['assignedTo']) && !empty($transformedTicket['assignedTo']['email'])) {
                $agent = $db->fetchOne("SELECT id, name, email FROM users WHERE id = ?", [$transformedTicket['assignedTo']['id']]);
                if ($agent && !empty($agent['email'])) {
                    try {
                        notifyAgentTicketAssignment($transformedTicket, $agent);
                    } catch (Exception $e) {
                        error_log("Failed to notify assigned agent: " . $e->getMessage());
                    }
                }
            }

            // Notify admins about the new ticket (match multi-role values)
            $admins = $db->fetchAll("SELECT id, name, email FROM users WHERE FIND_IN_SET('admin', role)");
            foreach ($admins as $admin) {
                notifyAdminTicketCreation($transformedTicket, $admin);
            }
        } catch (Exception $e) {
            error_log("Failed to send ticket creation notifications: " . $e->getMessage());
        }
        
        jsonResponse($transformedTicket, 201);
        
    } catch (Exception $e) {
        error_log("Database error in handleCreateTicket: " . $e->getMessage());
        jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handleGetSingleTicket($ticketId) {
    requireAuth();
    
    if (!$ticketId) {
        jsonResponse(['error' => 'Ticket ID is required'], 400);
    }
    
    $db = getDb();
    $userId = $_SESSION['user_id'];
    $userRole = $_SESSION['user_role'];
    
    if (userHasRole($userRole, 'user') && !userHasAnyRole($userRole, ['admin', 'agent'])) {
        $sql = "
            SELECT 
                t.*,
                c.name as category_name,
                sc.name as subcategory_name,
                cb.name as created_by_name,
                cb.email as created_by_email,
                at.name as assigned_to_name,
                at.email as assigned_to_email,
                at.contact_number as assigned_to_contact_number
            FROM tickets t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN categories sc ON t.subcategory_id = sc.id
            LEFT JOIN users cb ON t.created_by_id = cb.id
            LEFT JOIN users at ON t.assigned_to_id = at.id
            WHERE t.id = ? AND (t.created_by_id = ? OR t.assigned_to_id = ? OR t.contact_email = ?)";
        $params = [$ticketId, $userId, $userId, $_SESSION['user_email'] ?? ''];
    } else {
        $sql = "
            SELECT 
                t.*,
                c.name as category_name,
                sc.name as subcategory_name,
                cb.name as created_by_name,
                cb.email as created_by_email,
                at.name as assigned_to_name,
                at.email as assigned_to_email,
                at.contact_number as assigned_to_contact_number
            FROM tickets t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN categories sc ON t.subcategory_id = sc.id
            LEFT JOIN users cb ON t.created_by_id = cb.id
            LEFT JOIN users at ON t.assigned_to_id = at.id
            WHERE t.id = ?";
        $params = [$ticketId];
    }

    $ticket = $db->fetchOne($sql, $params);
    
    if (!$ticket) {
        error_log("handleGetSingleTicket: Ticket not found. ID: $ticketId, User: " . ($_SESSION['user_id'] ?? 'none'));
        jsonResponse([
            'error' => 'Ticket not found',
            'details' => [
                'ticketId' => $ticketId,
                'userId' => $_SESSION['user_id'] ?? null,
                'userRole' => $_SESSION['user_role'] ?? null
            ]
        ], 404);
    }
    
    // Fetch the ticket details
    $ticket = $db->fetchOne($sql, $params);
    if (!$ticket) {
        error_log("handleGetSingleTicket: Ticket not found. ID: $ticketId, User: " . ($_SESSION['user_id'] ?? 'none'));
        jsonResponse([
            'error' => 'Ticket not found',
            'details' => [
                'ticketId' => $ticketId,
                'userId' => $_SESSION['user_id'] ?? null,
                'userRole' => $_SESSION['user_role'] ?? null
            ]
        ], 404);
    }

    // Fetch comments for this ticket
    $sql = "
        SELECT 
            c.*,
            u.name as user_name,
            u.email as user_email,
            u.role as user_role
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.ticket_id = ?";
    if ($userRole !== 'admin' && $userRole !== 'agent') {
        $sql .= " AND c.is_internal = 0";
    }
    $sql .= " ORDER BY c.created_at ASC";
    $comments = $db->fetchAll($sql, [$ticketId]);
    $transformedComments = array_map(function($comment) {
        return [
            'id' => (int)$comment['id'],
            'ticketId' => (int)$comment['ticket_id'],
            'userId' => (int)$comment['user_id'],
            'content' => $comment['comment'],
            'isInternal' => (bool)$comment['is_internal'],
            'createdAt' => sanitizeDateForJS($comment['created_at']),
            'updatedAt' => sanitizeDateForJS($comment['updated_at']),
            'user' => [
                'id' => (int)$comment['user_id'],
                'name' => $comment['user_name'],
                'email' => $comment['user_email'],
                'role' => $comment['user_role']
            ]
        ];
    }, $comments);

    $transformedTicket = [
        'id' => (int)$ticket['id'],
        'title' => $ticket['title'],
        'description' => $ticket['description'],
        'status' => $ticket['status'],
        'priority' => $ticket['priority'],
        'supportType' => $ticket['support_type'],
        'contactEmail' => $ticket['contact_email'],
        'contactName' => $ticket['contact_name'],
        'contactPhone' => $ticket['contact_phone'],
        'contactDepartment' => $ticket['contact_department'],
        'categoryId' => (int)$ticket['category_id'],
        'subcategoryId' => $ticket['subcategory_id'] ? (int)$ticket['subcategory_id'] : null,
        'createdById' => (int)$ticket['created_by_id'],
        'assignedToId' => $ticket['assigned_to_id'] ? (int)$ticket['assigned_to_id'] : null,
        'dueDate' => sanitizeDateForJS($ticket['due_date']),
        'attachmentUrl' => $ticket['attachment_url'],
        'attachmentName' => $ticket['attachment_name'],
        'createdAt' => sanitizeDateForJS($ticket['created_at']),
        'updatedAt' => sanitizeDateForJS($ticket['updated_at']),
        'categoryName' => $ticket['category_name'],
        'subcategoryName' => $ticket['subcategory_name'],
        'createdByName' => $ticket['created_by_name'],
        'createdByEmail' => $ticket['created_by_email'],
        'assignedToName' => $ticket['assigned_to_name'],
        'assignedToEmail' => $ticket['assigned_to_email'],
        'comments' => $transformedComments,
        'companyName' => $ticket['company_name'],
        'location' => $ticket['location'],
        'category' => [
            'id' => (int)$ticket['category_id'],
            'name' => $ticket['category_name']
        ],
        'subcategory' => $ticket['subcategory_id'] ? [
            'id' => (int)$ticket['subcategory_id'],
            'name' => $ticket['subcategory_name']
        ] : null,
        'createdBy' => [
            'id' => (int)$ticket['created_by_id'],
            'name' => $ticket['created_by_name'],
            'email' => $ticket['created_by_email']
        ],
        'assignedTo' => $ticket['assigned_to_id'] ? [
            'id' => (int)$ticket['assigned_to_id'],
            'name' => $ticket['assigned_to_name'],
            'email' => $ticket['assigned_to_email'],
            'contactNumber' => isset($ticket['assigned_to_contact_number']) ? $ticket['assigned_to_contact_number'] : null
        ] : null
    ];

    jsonResponse($transformedTicket);
}

function handleUpdateTicket($ticketId, $request) {
    requireAuth();
    
    if (!$ticketId) {
        jsonResponse(['error' => 'Ticket ID is required'], 400);
    }
    
    $db = getDb();
    $userId = $_SESSION['user_id'];
    $userRole = $_SESSION['user_role'];
    
    // Check if ticket exists and user has permission to update it
    $ticket = $db->fetchOne("
        SELECT id, created_by_id, assigned_to_id, status 
        FROM tickets 
        WHERE id = ?
    ", [$ticketId]);
    
    if (!$ticket) {
        jsonResponse(['error' => 'Ticket not found'], 404);
    }
    
    // Permission check: admin/agent can update any ticket, users can only update their own or assigned tickets
    if (!userHasAnyRole($userRole, ['admin', 'agent']) && 
        $ticket['created_by_id'] != $userId && $ticket['assigned_to_id'] != $userId) {
        jsonResponse(['error' => 'Permission denied'], 403);
    }
    
    try {
        $updateData = [];
        $allowedFields = ['title', 'description', 'status', 'priority', 'assignedToId', 'dueDate'];
        
        foreach ($allowedFields as $field) {
            if (isset($request[$field])) {
                switch ($field) {
                    case 'assignedToId':
                        $updateData['assigned_to_id'] = !empty($request[$field]) ? (int)$request[$field] : null;
                        break;
                    case 'dueDate':
                        $updateData['due_date'] = !empty($request[$field]) ? $request[$field] : null;
                        break;
                    default:
                        $updateData[$field] = $request[$field];
                }
            }
        }
        
        if (!empty($updateData)) {
            // Use UTC for updated_at as well
            $updateData['updated_at'] = gmdate('Y-m-d H:i:s');
            // Convert from named parameters to positional parameters for cPanel compatibility
            $db->update('tickets', $updateData, 'id = ?', [$ticketId]);
        }
        
        // Fetch updated ticket with relations
        $updatedTicket = $db->fetchOne("
            SELECT 
                t.*,
                c.name as category_name,
                sc.name as subcategory_name,
                cb.name as created_by_name,
                cb.email as created_by_email,
                at.name as assigned_to_name,
                at.email as assigned_to_email,
                at.contact_number as assigned_to_contact_number
            FROM tickets t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN categories sc ON t.subcategory_id = sc.id
            LEFT JOIN users cb ON t.created_by_id = cb.id
            LEFT JOIN users at ON t.assigned_to_id = at.id
            WHERE t.id = ?
        ", [$ticketId]);
        
        $transformedTicket = [
            'id' => (int)$updatedTicket['id'],
            'title' => $updatedTicket['title'],
            'description' => $updatedTicket['description'],
            'status' => $updatedTicket['status'],
            'priority' => $updatedTicket['priority'],
            'supportType' => $updatedTicket['support_type'],
            'contactEmail' => $updatedTicket['contact_email'],
            'contactName' => $updatedTicket['contact_name'],
            'contactPhone' => $updatedTicket['contact_phone'],
            'contactDepartment' => $updatedTicket['contact_department'],
            'categoryId' => (int)$updatedTicket['category_id'],
            'subcategoryId' => $updatedTicket['subcategory_id'] ? (int)$updatedTicket['subcategory_id'] : null,
            'createdById' => (int)$updatedTicket['created_by_id'],
            'assignedToId' => $updatedTicket['assigned_to_id'] ? (int)$updatedTicket['assigned_to_id'] : null,
            'dueDate' => sanitizeDateForJS($updatedTicket['due_date']),
            'attachmentUrl' => $updatedTicket['attachment_url'],
            'attachmentName' => $updatedTicket['attachment_name'],
            'createdAt' => sanitizeDateForJS($updatedTicket['created_at']),
            'updatedAt' => sanitizeDateForJS($updatedTicket['updated_at']),
            'categoryName' => $updatedTicket['category_name'],
            'subcategoryName' => $updatedTicket['subcategory_name'],
            'createdByName' => $updatedTicket['created_by_name'],
            'createdByEmail' => $updatedTicket['created_by_email'],
            'assignedToName' => $updatedTicket['assigned_to_name'],
            'assignedToEmail' => $updatedTicket['assigned_to_email'],
            'category' => [
                'id' => (int)$updatedTicket['category_id'],
                'name' => $updatedTicket['category_name']
            ],
            'subcategory' => $updatedTicket['subcategory_id'] ? [
                'id' => (int)$updatedTicket['subcategory_id'],
                'name' => $updatedTicket['subcategory_name']
            ] : null,
            'createdBy' => [
                'id' => (int)$updatedTicket['created_by_id'],
                'name' => $updatedTicket['created_by_name'],
                'email' => $updatedTicket['created_by_email']
            ],
            'assignedTo' => $updatedTicket['assigned_to_id'] ? [
                'id' => (int)$updatedTicket['assigned_to_id'],
                'name' => $updatedTicket['assigned_to_name'],
                'email' => $updatedTicket['assigned_to_email'],
                'contactNumber' => $updatedTicket['assigned_to_contact_number']
            ] : null
        ];
        
        // Send email notifications for ticket assignment
        try {
            // Check if assigned_to_id was updated
            if (isset($updateData['assigned_to_id'])) {
                // Notify the assigned agent
                if ($updatedTicket['assigned_to_id']) {
                    $agent = $db->fetchOne("SELECT id, name, email FROM users WHERE id = ?", [$updatedTicket['assigned_to_id']]);
                    if ($agent && !empty($agent['email'])) {
                        notifyAgentTicketAssignment($transformedTicket, $agent);
                    }
                }
                
                // Notify the user who created the ticket
                if (!empty($updatedTicket['created_by_email'])) {
                    $user = [
                        'id' => (int)$updatedTicket['created_by_id'],
                        'name' => $updatedTicket['created_by_name'],
                        'email' => $updatedTicket['created_by_email']
                    ];
                    notifyUserTicketAssignment($transformedTicket, $user);
                }
                
                // Notify admins about the assignment (match multi-role values)
                $admins = $db->fetchAll("SELECT id, name, email FROM users WHERE FIND_IN_SET('admin', role)");
                foreach ($admins as $admin) {
                    notifyAdminTicketAssignment($transformedTicket, $admin);
                }
            }
        } catch (Exception $e) {
            error_log("Failed to send ticket assignment notifications: " . $e->getMessage());
        }
        
        jsonResponse($transformedTicket);
        
    } catch (Exception $e) {
        error_log("Database error in handleUpdateTicket: " . $e->getMessage());
        jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handleDeleteTicket($ticketId) {
    requireAuth();
    
    if (!$ticketId) {
        jsonResponse(['error' => 'Ticket ID is required'], 400);
    }
    
    $db = getDb();
    $userId = $_SESSION['user_id'];
    $userRole = $_SESSION['user_role'];
    
    // Check if ticket exists and user has permission to delete it
    $ticket = $db->fetchOne("
        SELECT id, created_by_id, assigned_to_id 
        FROM tickets 
        WHERE id = ?
    ", [$ticketId]);
    
    if (!$ticket) {
        jsonResponse(['error' => 'Ticket not found'], 404);
    }
    
        // Only admin (including multi-role) can delete tickets, or users can delete their own unassigned tickets
        if (!userHasAnyRole($userRole, ['admin']) && 
        ($ticket['created_by_id'] != $userId || $ticket['assigned_to_id'] !== null)) {
        jsonResponse(['error' => 'Permission denied'], 403);
    }
    
    try {
        // Delete related comments first
        $db->query("DELETE FROM comments WHERE ticket_id = ?", [$ticketId]);
        
        // Delete the ticket
        $db->query("DELETE FROM tickets WHERE id = ?", [$ticketId]);
        
        jsonResponse(['message' => 'Ticket deleted successfully']);
        
    } catch (Exception $e) {
        error_log("Database error in handleDeleteTicket: " . $e->getMessage());
        jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handleGetComments($ticketId) {
    requireAuth();
    
    if (!$ticketId) {
        jsonResponse(['error' => 'Ticket ID is required'], 400);
    }
    
    $db = getDb();
    $userId = $_SESSION['user_id'];
    $userRole = $_SESSION['user_role'];
    
    // Check if user has access to this ticket
    $ticket = $db->fetchOne("
        SELECT id, created_by_id, assigned_to_id, contact_email
        FROM tickets 
        WHERE id = ?
    ", [$ticketId]);
    
    if (!$ticket) {
        jsonResponse(['error' => 'Ticket not found'], 404);
    }
    
    // Permission check: admin/agent can see all comments, users can see comments on their tickets (including when they're the contact)
    if (!userHasAnyRole($userRole, ['admin', 'agent']) && 
        $ticket['created_by_id'] != $userId && $ticket['assigned_to_id'] != $userId && 
        $ticket['contact_email'] != ($_SESSION['user_email'] ?? '')) {
        jsonResponse(['error' => 'Permission denied'], 403);
    }
    
    try {
        $sql = "
            SELECT 
                c.*,
                u.name as user_name,
                u.email as user_email,
                u.role as user_role
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.ticket_id = ?
        ";
        
        // If user is not admin/agent, hide internal notes
        if (!userHasAnyRole($userRole, ['admin', 'agent'])) {
            $sql .= " AND c.is_internal = 0";
        }
        
        $sql .= " ORDER BY c.created_at ASC";
        
        $comments = $db->fetchAll($sql, [$ticketId]);
        
        $transformedComments = array_map(function($comment) {
            return [
                'id' => (int)$comment['id'],
                'ticketId' => (int)$comment['ticket_id'],
                'userId' => (int)$comment['user_id'],
                'content' => $comment['comment'],
                'isInternal' => (bool)$comment['is_internal'],
                'createdAt' => sanitizeDateForJS($comment['created_at']),
                'updatedAt' => sanitizeDateForJS($comment['updated_at']),
                'user' => [
                    'id' => (int)$comment['user_id'],
                    'name' => $comment['user_name'],
                    'email' => $comment['user_email'],
                    'role' => $comment['user_role']
                ]
            ];
        }, $comments);
        
        jsonResponse($transformedComments);
        
    } catch (Exception $e) {
        error_log("Database error in handleGetComments: " . $e->getMessage());
        jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handleCreateComment($ticketId, $request) {
    requireAuth();
    
    if (!$ticketId) {
        jsonResponse(['error' => 'Ticket ID is required'], 400);
    }
    
    // Check both 'content' (new API) and 'comment' (legacy API) fields
    $comment = trim($request['content'] ?? $request['comment'] ?? '');
    $isInternal = (bool)($request['isInternal'] ?? false);
    
    if (empty($comment)) {
        jsonResponse(['error' => 'Comment is required'], 400);
    }
    
    $db = getDb();
    $userId = $_SESSION['user_id'];
    $userRole = $_SESSION['user_role'];
    
    // Check if ticket exists and user has permission to comment
    $ticket = $db->fetchOne("
        SELECT id, created_by_id, assigned_to_id, contact_email
        FROM tickets 
        WHERE id = ?
    ", [$ticketId]);
    
    if (!$ticket) {
        jsonResponse(['error' => 'Ticket not found'], 404);
    }
    
    // Permission check: admin/agent can comment on any ticket, users can comment on their tickets (including when they're the contact)
    if (!userHasAnyRole($userRole, ['admin', 'agent']) && 
        $ticket['created_by_id'] != $userId && $ticket['assigned_to_id'] != $userId &&
        $ticket['contact_email'] != ($_SESSION['user_email'] ?? '')) {
        jsonResponse(['error' => 'Permission denied'], 403);
    }
    
    // Only admin and agents can create internal notes
    if ($isInternal && !userHasAnyRole($userRole, ['admin', 'agent'])) {
        $isInternal = false;
    }
    
    try {
        $commentData = [
            'ticket_id' => $ticketId,
            'user_id' => $userId,
            'comment' => $comment,
            'is_internal' => $isInternal ? 1 : 0,
            // store comment timestamps in UTC
            'created_at' => gmdate('Y-m-d H:i:s'),
            'updated_at' => gmdate('Y-m-d H:i:s')
        ];
        
        $commentId = $db->insert('comments', $commentData);
        
        // Update ticket's updated_at timestamp - using positional parameters for cPanel compatibility
        $db->update('tickets', 
            ['updated_at' => gmdate('Y-m-d H:i:s')], 
            'id = ?',
            [$ticketId]
        );
        
        // Fetch the created comment with user info
        $createdComment = $db->fetchOne("
            SELECT 
                c.*,
                u.name as user_name,
                u.email as user_email,
                u.role as user_role
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        ", [$commentId]);
        
        $transformedComment = [
            'id' => (int)$createdComment['id'],
            'ticketId' => (int)$createdComment['ticket_id'],
            'userId' => (int)$createdComment['user_id'],
            'content' => $createdComment['comment'],
            'isInternal' => (bool)$createdComment['is_internal'],
            'createdAt' => sanitizeDateForJS($createdComment['created_at']),
            'updatedAt' => sanitizeDateForJS($createdComment['updated_at']),
            'user' => [
                'id' => (int)$createdComment['user_id'],
                'name' => $createdComment['user_name'],
                'email' => $createdComment['user_email'],
                'role' => $createdComment['user_role']
            ]
        ];
        
        jsonResponse($transformedComment, 201);
        
    } catch (Exception $e) {
        error_log("Database error in handleCreateComment: " . $e->getMessage());
        jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}
?>