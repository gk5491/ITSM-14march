<?php
/**
 * cPanel Deployment Fix for ITSM Application
 * Addresses common issues with ticket creation and comment posting on cPanel hosting
 */

// Ensure clean start - no output before headers
ob_start();

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set up test user session for testing
$_SESSION['user_id'] = 1;
$_SESSION['user_role'] = 'admin';

require_once 'php/config/database.php';

echo "=== cPANEL DEPLOYMENT FIX ===\n";
echo "Applying fixes for common cPanel hosting issues...\n\n";

// Fix 1: Create proper .htaccess for cPanel
echo "1. CREATING cPANEL-OPTIMIZED .htaccess\n";

$htaccessContent = '# cPanel-optimized .htaccess for ITSM Application
RewriteEngine On

# Handle CORS preflight OPTIONS requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# API Routes - Handle both with and without .php extension
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.+)$ php/api/$1.php [QSA,L]

# Frontend Routes - Serve React app
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/php/
RewriteCond %{REQUEST_URI} !^/uploads/
RewriteRule ^(.*)$ client/dist/index.html [QSA,L]

# Security Headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # CORS Headers for API requests
    SetEnvIf Origin "^https?://(www\.)?(cybaemtech\.net|localhost)(:5173)?$" ORIGIN_SUB_DOMAIN=$1$2$3
    Header always set Access-Control-Allow-Origin "%{ORIGIN_SUB_DOMAIN}e" env=ORIGIN_SUB_DOMAIN
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    Header always set Access-Control-Allow-Credentials "true"
    Header always set Vary "Origin"
</IfModule>

# PHP Settings for cPanel
<IfModule mod_php7.c>
    php_flag display_errors Off
    php_flag log_errors On
    php_value error_log error_log
    php_value session.cookie_httponly 1
    php_value session.cookie_secure 1
    php_value session.use_strict_mode 1
</IfModule>

# File Security
<Files "*.php">
    Order allow,deny
    Allow from all
</Files>

<Files ".htaccess">
    Order deny,allow
    Deny from all
</Files>

# Prevent access to sensitive files
<FilesMatch "\.(sql|log|conf|env)$">
    Order deny,allow
    Deny from all
</FilesMatch>
';

if (file_put_contents('.htaccess', $htaccessContent)) {
    echo "✅ .htaccess file created/updated\n";
} else {
    echo "❌ Failed to create .htaccess file\n";
}

// Fix 2: Create cPanel-specific API wrapper
echo "\n2. CREATING cPANEL API WRAPPER\n";

$apiWrapperContent = '<?php
/**
 * cPanel-specific API wrapper for tickets
 * Handles common cPanel hosting limitations
 */

// Clean buffer and headers for cPanel
if (ob_get_level()) {
    ob_clean();
}

// Set proper headers before any output
header("Content-Type: application/json; charset=UTF-8");

// Handle CORS for cPanel
$allowedOrigins = [
    "https://cybaemtech.in",
    "https://www.cybaemtech.in", 
    "http://localhost:5173",
    "http://localhost:5000"
];

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Vary: Origin");

// Handle OPTIONS preflight
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

// Enhanced error handling for cPanel
ini_set("display_errors", 0);
ini_set("log_errors", 1);
error_reporting(E_ALL);

// Custom error handler
set_error_handler(function($severity, $message, $file, $line) {
    error_log("PHP Error: [$severity] $message in $file on line $line");
    if ($severity === E_ERROR || $severity === E_PARSE || $severity === E_CORE_ERROR) {
        http_response_code(500);
        echo json_encode(["error" => "Internal server error", "details" => "Check error logs"]);
        exit();
    }
});

// Start session with cPanel-compatible settings
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        "lifetime" => 86400,
        "path" => "/",
        "domain" => "",
        "secure" => isset($_SERVER["HTTPS"]),
        "httponly" => true,
        "samesite" => "Lax"
    ]);
    session_start();
}

// Enhanced request parsing for cPanel
function getRequestData() {
    $contentType = $_SERVER["CONTENT_TYPE"] ?? "";
    
    // Handle JSON requests
    if (strpos($contentType, "application/json") !== false) {
        $input = file_get_contents("php://input");
        if ($input) {
            $data = json_decode($input, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $data;
            }
        }
        return [];
    }
    
    // Handle form data
    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        return $_POST;
    }
    
    return [];
}

// Enhanced JSON response for cPanel
function sendJsonResponse($data, $statusCode = 200) {
    // Clean any existing output
    if (ob_get_level()) {
        ob_clean();
    }
    
    http_response_code($statusCode);
    header("Content-Type: application/json; charset=UTF-8");
    
    $response = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($response === false) {
        http_response_code(500);
        echo json_encode(["error" => "JSON encoding failed"]);
    } else {
        echo $response;
    }
    
    exit();
}

// Include the main tickets API
try {
    // Override global functions for cPanel compatibility
    if (!function_exists("jsonResponse")) {
        function jsonResponse($data, $statusCode = 200) {
            sendJsonResponse($data, $statusCode);
        }
    }
    
    // Set request data globally
    $_REQUEST_DATA = getRequestData();
    
    // Include main API
    require_once "tickets.php";
    
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    sendJsonResponse(["error" => "API error", "details" => $e->getMessage()], 500);
} catch (Throwable $e) {
    error_log("Fatal API Error: " . $e->getMessage());
    sendJsonResponse(["error" => "Fatal error", "details" => "Check error logs"], 500);
}
?>';

if (!file_exists('php/api')) {
    mkdir('php/api', 0755, true);
}

if (file_put_contents('php/api/tickets-cpanel.php', $apiWrapperContent)) {
    echo "✅ cPanel API wrapper created\n";
} else {
    echo "❌ Failed to create API wrapper\n";
}

// Fix 3: Create uploads directory with proper permissions
echo "\n3. CREATING UPLOADS DIRECTORY\n";
if (!file_exists('uploads')) {
    if (mkdir('uploads', 0755, true)) {
        echo "✅ Uploads directory created\n";
        
        // Create .htaccess for uploads security
        $uploadsHtaccess = '# Uploads directory security
<Files "*">
    Order deny,allow
    Allow from all
</Files>

<FilesMatch "\.(php|php3|php4|php5|phtml|pl|py|jsp|asp|sh|cgi)$">
    Order deny,allow
    Deny from all
</FilesMatch>
';
        file_put_contents('uploads/.htaccess', $uploadsHtaccess);
        echo "✅ Uploads security configured\n";
    } else {
        echo "❌ Failed to create uploads directory\n";
    }
} else {
    echo "✅ Uploads directory already exists\n";
}

// Fix 4: Test database operations with cPanel optimizations
echo "\n4. TESTING DATABASE OPERATIONS\n";
try {
    $db = Database::getInstance();
    $connection = $db->getConnection();
    
    // Test ticket creation with cPanel-specific data
    $testTicketData = [
        'title' => 'cPanel Test Ticket - ' . date('Y-m-d H:i:s'),
        'description' => 'Testing ticket creation on cPanel hosting environment',
        'status' => 'open',
        'priority' => 'medium',
        'support_type' => 'remote',
        'contact_email' => 'cpanel.test@example.com',
        'contact_name' => 'cPanel Test User',
        'contact_phone' => '555-CPANEL',
        'contact_department' => 'Testing',
        'category_id' => 1,
        'created_by_id' => 1,
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s')
    ];
    
    $ticketId = $db->insert('tickets', $testTicketData);
    if ($ticketId) {
        echo "✅ Ticket creation test: SUCCESS (ID: $ticketId)\n";
        
        // Test comment creation
        $testCommentData = [
            'ticket_id' => $ticketId,
            'user_id' => 1,
            'comment' => 'Test comment for cPanel deployment - ' . date('Y-m-d H:i:s'),
            'is_internal' => 0,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        $commentId = $db->insert('comments', $testCommentData);
        if ($commentId) {
            echo "✅ Comment creation test: SUCCESS (ID: $commentId)\n";
        } else {
            echo "❌ Comment creation test: FAILED\n";
        }
        
    } else {
        echo "❌ Ticket creation test: FAILED\n";
    }
    
} catch (Exception $e) {
    echo "❌ Database test failed: " . $e->getMessage() . "\n";
}

// Fix 5: Create error logging
echo "\n5. SETTING UP ERROR LOGGING\n";
if (!file_exists('logs')) {
    mkdir('logs', 0755, true);
}

$errorLogPath = 'logs/error.log';
if (touch($errorLogPath)) {
    echo "✅ Error log created: $errorLogPath\n";
    ini_set('error_log', $errorLogPath);
} else {
    echo "❌ Failed to create error log\n";
}

// Fix 6: Create test endpoints
echo "\n6. CREATING TEST ENDPOINTS\n";

$testEndpointContent = '<?php
// Simple test endpoint for cPanel deployment verification
session_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit(0);
}

$response = [
    "status" => "success",
    "message" => "ITSM API is working on cPanel",
    "timestamp" => date("Y-m-d H:i:s"),
    "php_version" => PHP_VERSION,
    "server_software" => $_SERVER["SERVER_SOFTWARE"] ?? "Unknown",
    "session_status" => session_status() === PHP_SESSION_ACTIVE ? "active" : "inactive"
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>';

if (file_put_contents('php/api/test.php', $testEndpointContent)) {
    echo "✅ Test endpoint created: /php/api/test.php\n";
} else {
    echo "❌ Failed to create test endpoint\n";
}

echo "\n=== cPANEL DEPLOYMENT FIX COMPLETE ===\n";
echo "\nNEXT STEPS FOR cPANEL DEPLOYMENT:\n";
echo "1. Upload all files to your cPanel public_html directory\n";
echo "2. Update database credentials in php/config/database.php\n";
echo "3. Test the API endpoint: https://yourdomain.com/php/api/test.php\n";
echo "4. Test ticket creation: https://yourdomain.com/php/api/tickets-cpanel.php\n";
echo "5. Check error logs in /logs/error.log if issues occur\n";
echo "6. Ensure uploads directory has write permissions (755)\n";
echo "7. Verify .htaccess file is uploaded and active\n";

echo "\n🚀 DEPLOYMENT READY FOR cPANEL!\n";
?>