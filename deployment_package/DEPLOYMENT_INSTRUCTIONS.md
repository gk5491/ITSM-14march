# PRODUCTION DEPLOYMENT GUIDE - TICKET DETAIL BLANK PAGE FIX

## Issue Summary
Ticket creation works and stores data in database, but redirecting to ticket detail pages (e.g., `/tickets/111`) shows blank pages on production. This is caused by missing API wrapper files in production.

## Problem Analysis
- Tickets are successfully created and stored in database (confirmed: ticket 111 exists)
- Frontend redirects to `/tickets/111` after creation using `navigate(`/tickets/${data.id}`)`
- Production server returns 404 for `/php/tickets`, `/php/users`, `/php/categories` endpoints
- Local development works because APIs are in `/php/api/` subdirectory
- Production (cPanel) requires direct endpoint files for proper routing

## Solution: Deploy API Wrapper Files

### Files to Upload to Production (`/itsm_app/php/` directory):

#### 1. Upload `php/tickets` (no extension)
```php
<?php
// Production wrapper for tickets API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Set up request data for the API
$_REQUEST_DATA = [
    'method' => $_SERVER['REQUEST_METHOD'],
    'path' => $_SERVER['PATH_INFO'] ?? $_SERVER['REQUEST_URI'] ?? '',
    'query' => $_GET,
    'body' => file_get_contents('php://input')
];

// Include the main tickets API
include_once __DIR__ . '/api/tickets.php';
?>
```

#### 2. Upload `php/users` (no extension)
```php
<?php
// Production wrapper for users API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Set up request data for the API
$_REQUEST_DATA = [
    'method' => $_SERVER['REQUEST_METHOD'],
    'path' => $_SERVER['PATH_INFO'] ?? $_SERVER['REQUEST_URI'] ?? '',
    'query' => $_GET,
    'body' => file_get_contents('php://input')
];

// Include the main users API
include_once __DIR__ . '/api/users.php';
?>
```

#### 3. Upload `php/categories` (no extension)
```php
<?php
// Production wrapper for categories API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Set up request data for the API
$_REQUEST_DATA = [
    'method' => $_SERVER['REQUEST_METHOD'],
    'path' => $_SERVER['PATH_INFO'] ?? $_SERVER['REQUEST_URI'] ?? '',
    'query' => $_GET,
    'body' => file_get_contents('php://input')
];

// Include the main categories API
include_once __DIR__ . '/api/categories.php';
?>
```

#### 4. Upload `php/dashboard` (no extension)
```php
<?php
// Production wrapper for dashboard API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Set up request data for the API
$_REQUEST_DATA = [
    'method' => $_SERVER['REQUEST_METHOD'],
    'path' => $_SERVER['PATH_INFO'] ?? $_SERVER['REQUEST_URI'] ?? '',
    'query' => $_GET,
    'body' => file_get_contents('php://input')
];

// Include the main dashboard API
include_once __DIR__ . '/api/dashboard.php';
?>
```

## Deployment Steps

### Step 1: Upload Files via cPanel File Manager
1. Login to cPanel for cybaemtech.in
2. Open File Manager
3. Navigate to `/public_html/itsm_app/php/`
4. Upload the 4 wrapper files (tickets, users, categories, dashboard) - NO file extensions
5. Set file permissions to 644 for all uploaded files

### Step 2: Verify Deployment
Test these URLs in browser:
- `https://cybaemtech.in/itsm_app/php/tickets` - Should return JSON data
- `https://cybaemtech.in/itsm_app/php/tickets/111` - Should return ticket 111 data
- `https://cybaemtech.in/itsm_app/php/users` - Should return users data
- `https://cybaemtech.in/itsm_app/php/categories` - Should return categories

### Step 3: Test Full Flow
1. Create a new ticket from frontend
2. Verify it redirects properly to ticket detail page
3. Check that comments section loads correctly
4. Test other navigation flows

## Expected Results After Deployment
- ✅ Ticket creation redirects to proper detail page
- ✅ Ticket detail pages show complete data (title, description, status, comments)
- ✅ Comments section loads and displays correctly
- ✅ All API endpoints respond with proper JSON data
- ✅ No more 404 errors on production

## Rollback Plan
If issues occur, remove the uploaded wrapper files and the system will fall back to previous behavior.

## Technical Notes
- These wrapper files route production requests to existing `/php/api/` files
- No changes needed to existing API code
- Frontend code unchanged - still uses same navigation patterns
- This fix specifically addresses cPanel hosting requirements for direct endpoint access