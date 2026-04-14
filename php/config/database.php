<?php
/**
 * Database Configuration for cPanel Hosting
 * IT Helpdesk Portal - MySQL Connection
 */

// Database configuration - Local MySQL (itsm_helpdesk)
define('DB_HOST', '127.0.0.1'); // Local MySQL server
define('DB_NAME', 'itsm_helpdesk'); // Local database name
define('DB_USER', 'root'); // Local MySQL username
define('DB_PASS', ''); // Local MySQL password (empty for default WAMP/XAMPP)
define('DB_CHARSET', 'utf8mb4');

// Application configuration
define('APP_NAME', 'IT Helpdesk Portal');
define('APP_VERSION', '1.0.0');
define('APP_DEBUG', false); // Set to false in production

// Session configuration
define('SESSION_LIFETIME', 86400); // 24 hours
define('SESSION_NAME', 'ITSM_SESSION');

// Security
define('BCRYPT_COST', 10);
define('CSRF_TOKEN_NAME', '_token');

// File upload configuration
define('UPLOAD_MAX_SIZE', 10485760); // 10MB
define('UPLOAD_ALLOWED_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']);
define('UPLOAD_PATH', '../uploads/');

/**
 * Database Connection Class
 */
class Database {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ];
            
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            die("Database connection failed. Please contact administrator.");
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Query failed: " . $e->getMessage() . " SQL: " . $sql . " Params: " . json_encode($params));
            // For debugging: include more specific error information
            throw new Exception("Database query failed: " . $e->getMessage());
        }
    }
    
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }
    
    public function insert($table, $data) {
        $columns = implode(',', array_keys($data));
        
        // Use positional parameters (?) instead of named parameters for cPanel compatibility
        $placeholders = implode(', ', array_fill(0, count($data), '?'));
        
        $sql = "INSERT INTO `{$table}` ({$columns}) VALUES ({$placeholders})";
        $this->query($sql, array_values($data)); // Pass values as indexed array for positional parameters
        
        return $this->connection->lastInsertId();
    }
    
    public function update($table, $data, $where, $whereParams = []) {
        $setClause = [];
        
        // Use positional parameters for cPanel compatibility
        foreach (array_keys($data) as $key) {
            $setClause[] = "`{$key}` = ?";
        }
        $setClause = implode(', ', $setClause);
        
        $sql = "UPDATE `{$table}` SET {$setClause} WHERE {$where}";
        $params = array_merge(array_values($data), $whereParams);
        
        return $this->query($sql, $params);
    }
    
    public function delete($table, $where, $params = []) {
        $sql = "DELETE FROM `{$table}` WHERE {$where}";
        return $this->query($sql, $params);
    }
    
    public function count($table, $where = '1=1', $params = []) {
        $sql = "SELECT COUNT(*) as count FROM `{$table}` WHERE {$where}";
        $result = $this->fetchOne($sql, $params);
        return (int)$result['count'];
    }
}

/**
 * Utility Functions
 */
function getDb() {
    return Database::getInstance();
}

function sanitizeInput($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

function generateCsrfToken() {
    if (!isset($_SESSION[CSRF_TOKEN_NAME])) {
        $_SESSION[CSRF_TOKEN_NAME] = bin2hex(random_bytes(32));
    }
    return $_SESSION[CSRF_TOKEN_NAME];
}

function verifyCsrfToken($token) {
    return isset($_SESSION[CSRF_TOKEN_NAME]) && hash_equals($_SESSION[CSRF_TOKEN_NAME], $token);
}

function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
}

function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        jsonResponse(['error' => 'Authentication required'], 401);
    }
}

function requireRole($allowedRoles) {
    requireAuth();
    // Support multi-role users (e.g., 'admin,agent')
    $userRoles = array_map('trim', explode(',', $_SESSION['user_role']));
    $hasPermission = false;
    foreach ($userRoles as $role) {
        if (in_array($role, $allowedRoles)) {
            $hasPermission = true;
            break;
        }
    }
    if (!$hasPermission) {
        jsonResponse(['error' => 'Insufficient permissions'], 403);
    }
}

// Start session with custom configuration
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => SESSION_LIFETIME,
        'path' => '/',
        'domain' => '',
        'secure' => isset($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_name(SESSION_NAME);
    session_start();
}

// Initialize database connection
$db = getDb();
?>