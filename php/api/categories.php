<?php
/**
 * Categories API Endpoints
 * IT Helpdesk Portal - PHP Backend
 */

// Get the correct path to database config regardless of working directory
$configPath = dirname(__DIR__) . '/config/database.php';
if (!file_exists($configPath)) {
    // Fallback for different directory structures
    $configPath = __DIR__ . '/../config/database.php';
}
require_once $configPath;

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

// Handle both JSON and FormData requests
$request = [];
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (strpos($contentType, 'application/json') !== false) {
    // JSON request
    $request = json_decode(file_get_contents('php://input'), true) ?? [];
} else {
    // FormData or regular POST
    $request = $_POST ?? [];
}

try {
    switch ($method) {
        case 'GET':
            handleGetCategories();
            break;
        case 'POST':
            handleCreateCategory($request);
            break;
        case 'PUT':
            $categoryId = $_GET['id'] ?? null;
            handleUpdateCategory($categoryId, $request);
            break;
        case 'DELETE':
            $categoryId = $_GET['id'] ?? null;
            handleDeleteCategory($categoryId);
            break;
        default:
            jsonResponse(['error' => 'Method not allowed'], 405);
    }
} catch (Exception $e) {
    error_log("Categories API Error: " . $e->getMessage());
    jsonResponse(['error' => 'Internal server error'], 500);
}

function handleGetCategories() {
    requireAuth();
    
    $db = getDb();
    $parentId = $_GET['parentId'] ?? null;
    
    // Debug logging
    error_log("Categories GET request - parentId: " . ($parentId !== null ? $parentId : 'null'));
    
    $sql = "
        SELECT 
            c.*,
            p.name as parent_name,
            (SELECT COUNT(*) FROM tickets WHERE category_id = c.id) as ticket_count
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.id
        WHERE 1=1
    ";
    
    $params = [];
    
    // If parentId is specified, filter subcategories
    if ($parentId !== null) {
        if ($parentId === '0' || $parentId === '') {
            // Return top-level categories (no parent)
            $sql .= " AND c.parent_id IS NULL";
            error_log("Filtering for top-level categories (parent_id IS NULL)");
        } else {
            // Return subcategories for specific parent
            $sql .= " AND c.parent_id = :parent_id";
            $params['parent_id'] = (int)$parentId;
            error_log("Filtering for subcategories with parent_id: " . (int)$parentId);
        }
    } else {
        error_log("No parentId filter - returning all categories");
    }
    
    $sql .= " ORDER BY c.parent_id IS NULL DESC, c.parent_id, c.name";
    
    error_log("Final SQL: " . $sql);
    error_log("SQL Params: " . print_r($params, true));
    
    $categories = $db->fetchAll($sql, $params);
    
    error_log("Categories returned: " . count($categories));
    error_log("Categories data: " . print_r($categories, true));
    
    // Convert database field names to frontend-expected camelCase
    $categoriesResponse = array_map(function($category) {
        return [
            'id' => $category['id'],
            'name' => $category['name'],
            'parentId' => $category['parent_id'], // Convert snake_case to camelCase
            'parent_name' => $category['parent_name'] ?? null,
            'ticket_count' => $category['ticket_count'] ?? 0,
            'created_at' => $category['created_at'] ?? null,
            'updated_at' => $category['updated_at'] ?? null
        ];
    }, $categories);
    
    jsonResponse($categoriesResponse);
}

function handleCreateCategory($request) {
    // Allow admin, agent, and user to create categories (during ticket creation flow)
    requireAuth();
    
    $name = sanitizeInput($request['name'] ?? '');
    // Handle both camelCase and snake_case for parentId
    $parentId = !empty($request['parentId'] ?? $request['parent_id'] ?? null) 
        ? (int)($request['parentId'] ?? $request['parent_id']) 
        : null;
    
    if (empty($name)) {
        jsonResponse(['error' => 'Category name is required'], 400);
    }
    
    $db = getDb();
    
    // Check if category name already exists at the same level
    $existingQuery = "SELECT id FROM categories WHERE name = :name";
    $params = ['name' => $name];
    
    if ($parentId) {
        $existingQuery .= " AND parent_id = :parent_id";
        $params['parent_id'] = $parentId;
    } else {
        $existingQuery .= " AND parent_id IS NULL";
    }
    
    $existing = $db->fetchOne($existingQuery, $params);
    if ($existing) {
        jsonResponse(['error' => 'Category name already exists'], 400);
    }
    
    // If parent_id is provided, verify parent exists
    if ($parentId) {
        $parent = $db->fetchOne("SELECT id FROM categories WHERE id = :id", ['id' => $parentId]);
        if (!$parent) {
            jsonResponse(['error' => 'Parent category not found'], 404);
        }
    }
    
    $categoryId = $db->insert('categories', [
        'name' => $name,
        'parent_id' => $parentId
    ]);
    
    $category = $db->fetchOne("
        SELECT 
            c.*,
            p.name as parent_name
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.id
        WHERE c.id = :id
    ", ['id' => $categoryId]);
    
    jsonResponse($category, 201);
}

function handleUpdateCategory($categoryId, $request) {
    requireRole(['admin']);
    
    if (!$categoryId) {
        jsonResponse(['error' => 'Category ID is required'], 400);
    }
    
    $db = getDb();
    
    // Check if category exists
    $category = $db->fetchOne("SELECT * FROM categories WHERE id = :id", ['id' => $categoryId]);
    if (!$category) {
        jsonResponse(['error' => 'Category not found'], 404);
    }
    
    $name = sanitizeInput($request['name'] ?? $category['name']);
    $parentId = isset($request['parentId']) 
        ? (!empty($request['parentId']) ? (int)$request['parentId'] : null)
        : $category['parent_id'];
    
    // Check for circular reference (category can't be its own parent)
    if ($parentId == $categoryId) {
        jsonResponse(['error' => 'Category cannot be its own parent'], 400);
    }
    
    // Check if name conflicts with existing categories at the same level
    $existingQuery = "SELECT id FROM categories WHERE name = :name AND id != :id";
    $params = ['name' => $name, 'id' => $categoryId];
    
    if ($parentId) {
        $existingQuery .= " AND parent_id = :parent_id";
        $params['parent_id'] = $parentId;
    } else {
        $existingQuery .= " AND parent_id IS NULL";
    }
    
    $existing = $db->fetchOne($existingQuery, $params);
    if ($existing) {
        jsonResponse(['error' => 'Category name already exists'], 400);
    }
    
    $db->update('categories', [
        'name' => $name,
        'parent_id' => $parentId
    ], 'id = :id', ['id' => $categoryId]);
    
    $updatedCategory = $db->fetchOne("
        SELECT 
            c.*,
            p.name as parent_name
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.id
        WHERE c.id = :id
    ", ['id' => $categoryId]);
    
    jsonResponse($updatedCategory);
}

function handleDeleteCategory($categoryId) {
    requireRole(['admin']);
    
    if (!$categoryId) {
        jsonResponse(['error' => 'Category ID is required'], 400);
    }
    
    $db = getDb();
    
    // Check if category exists
    $category = $db->fetchOne("SELECT id FROM categories WHERE id = :id", ['id' => $categoryId]);
    if (!$category) {
        jsonResponse(['error' => 'Category not found'], 404);
    }
    
    // Check if category has tickets
    $ticketCount = $db->fetchOne(
        "SELECT COUNT(*) as count FROM tickets WHERE category_id = :cat_id1 OR subcategory_id = :cat_id2",
        ['cat_id1' => $categoryId, 'cat_id2' => $categoryId]
    );
    
    if ($ticketCount['count'] > 0) {
        jsonResponse(['error' => 'Cannot delete category with existing tickets'], 400);
    }
    
    // Check if category has subcategories
    $subcategoryCount = $db->fetchOne(
        "SELECT COUNT(*) as count FROM categories WHERE parent_id = :id",
        ['id' => $categoryId]
    );
    
    if ($subcategoryCount['count'] > 0) {
        jsonResponse(['error' => 'Cannot delete category with subcategories'], 400);
    }
    
    $db->delete('categories', 'id = :id', ['id' => $categoryId]);
    
    jsonResponse(['message' => 'Category deleted successfully']);
}
?>