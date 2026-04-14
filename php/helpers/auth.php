<?php
/**
 * Authentication Helper Functions
 * IT Helpdesk Portal - PHP Backend
 */

// Session configuration
if (session_status() == PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_strict_mode', 1);
    ini_set('session.cookie_samesite', 'Lax');
    session_start();
}

/**
 * Check if user is authenticated
 */
function requireAuth() {
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['user_role'])) {
        // Log the authentication failure
        error_log("Authentication failed - Session data: " . print_r($_SESSION, true));
        
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Authentication required. Please log in.',
            'code' => 'AUTH_REQUIRED'
        ]);
        exit;
    }
    
    return [
        'user_id' => $_SESSION['user_id'],
        'user_role' => $_SESSION['user_role']
    ];
}

/**
 * Check if user has admin privileges
 */
function requireAdmin() {
    $auth = requireAuth();
    
    if ($auth['user_role'] !== 'admin') {
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Admin privileges required',
            'code' => 'ADMIN_REQUIRED'
        ]);
        exit;
    }
    
    return $auth;
}

/**
 * Get current authenticated user
 */
function getCurrentUser() {
    if (!isset($_SESSION['user_id'])) {
        return null;
    }
    
    return [
        'user_id' => $_SESSION['user_id'],
        'user_role' => $_SESSION['user_role']
    ];
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']) && isset($_SESSION['user_role']);
}

/**
 * Standard JSON response helper
 */
function jsonResponse($data, $httpCode = 200) {
    header('Content-Type: application/json');
    http_response_code($httpCode);
    echo json_encode($data);
    exit;
}

/**
 * Sanitize input data
 */
function sanitizeInput($input) {
    if (is_string($input)) {
        return trim(htmlspecialchars($input, ENT_QUOTES, 'UTF-8'));
    }
    return $input;
}
?>