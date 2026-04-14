<?php
/**
 * Domains API Diagnostic Tool
 * Use this to troubleshoot the 500 Internal Server Error
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>🔍 Domains API Diagnostic</h2>";

// Test 1: Check if database config exists
echo "<h3>1. Database Configuration</h3>";
$configPath = __DIR__ . '/php/config/database.php';
if (!file_exists($configPath)) {
    echo "❌ <strong>ERROR:</strong> Database config file not found at: $configPath<br>";
} else {
    echo "✅ Database config file exists<br>";
    
    try {
        require_once $configPath;
        echo "✅ Database config loaded successfully<br>";
        
        // Test database connection
        $db = getDb();
        echo "✅ Database connection established<br>";
        
    } catch (Exception $e) {
        echo "❌ <strong>ERROR:</strong> Database connection failed: " . $e->getMessage() . "<br>";
    }
}

// Test 2: Check if session config exists
echo "<h3>2. Session Configuration</h3>";
$sessionPath = __DIR__ . '/php/config/session.php';
if (!file_exists($sessionPath)) {
    echo "⚠️ <strong>WARNING:</strong> Session config file not found at: $sessionPath<br>";
    echo "This will use fallback session settings<br>";
} else {
    echo "✅ Session config file exists<br>";
}

// Test 3: Check if allowed_domains table exists
echo "<h3>3. Database Tables</h3>";
try {
    if (isset($db)) {
        // Check users table
        $usersCheck = $db->fetchOne("SHOW TABLES LIKE 'users'");
        if ($usersCheck) {
            echo "✅ Users table exists<br>";
            
            // Check if users table has verification fields
            $columns = $db->fetchAll("SHOW COLUMNS FROM users");
            $hasVerificationToken = false;
            $hasIsVerified = false;
            
            foreach ($columns as $column) {
                if ($column['Field'] === 'verification_token') {
                    $hasVerificationToken = true;
                }
                if ($column['Field'] === 'is_verified') {
                    $hasIsVerified = true;
                }
            }
            
            if ($hasVerificationToken && $hasIsVerified) {
                echo "✅ Users table has verification fields<br>";
            } else {
                echo "⚠️ <strong>WARNING:</strong> Users table missing verification fields<br>";
                echo "Need to run migration script or add fields manually<br>";
            }
        } else {
            echo "❌ <strong>ERROR:</strong> Users table not found<br>";
        }
        
        // Check allowed_domains table
        $domainsCheck = $db->fetchOne("SHOW TABLES LIKE 'allowed_domains'");
        if ($domainsCheck) {
            echo "✅ Allowed_domains table exists<br>";
            
            // Count domains
            $domainCount = $db->fetchOne("SELECT COUNT(*) as count FROM allowed_domains");
            echo "📊 Current domains count: " . $domainCount['count'] . "<br>";
            
        } else {
            echo "❌ <strong>ERROR:</strong> Allowed_domains table NOT found<br>";
            echo "<strong>This is likely causing the 500 error!</strong><br>";
        }
    }
} catch (Exception $e) {
    echo "❌ <strong>ERROR:</strong> Database query failed: " . $e->getMessage() . "<br>";
}

// Test 4: Check domains API directly
echo "<h3>4. Domains API Test</h3>";
try {
    // Simulate the domains API call
    $_GET[''] = ''; // Simulate GET request
    $_SERVER['REQUEST_METHOD'] = 'GET';
    
    // Check if domains.php exists
    $domainsApiPath = __DIR__ . '/php/api/domains.php';
    if (!file_exists($domainsApiPath)) {
        echo "❌ <strong>ERROR:</strong> domains.php not found at: $domainsApiPath<br>";
    } else {
        echo "✅ domains.php file exists<br>";
        echo "🔄 Testing API call...<br>";
        
        // Note: We can't actually include domains.php here as it would interfere with headers
        // But we can check file permissions and syntax
        
        if (is_readable($domainsApiPath)) {
            echo "✅ domains.php is readable<br>";
        } else {
            echo "❌ <strong>ERROR:</strong> domains.php is not readable<br>";
        }
    }
    
} catch (Exception $e) {
    echo "❌ <strong>ERROR:</strong> API test failed: " . $e->getMessage() . "<br>";
}

// Test 5: Recommendations
echo "<h3>5. 🎯 Recommendations</h3>";

if (!isset($domainsCheck) || !$domainsCheck) {
    echo "<div style='background: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 10px 0;'>";
    echo "<strong>PRIMARY ISSUE: Missing allowed_domains table</strong><br>";
    echo "<strong>Solution:</strong><br>";
    echo "1. Go to phpMyAdmin<br>";
    echo "2. Select your database<br>";
    echo "3. Run this SQL:<br>";
    echo "<textarea style='width: 100%; height: 150px; font-family: monospace;'>";
    echo "CREATE TABLE `allowed_domains` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `domain` VARCHAR(255) NOT NULL UNIQUE,
    `company_name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_by_id` INT(11) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
    INDEX `idx_allowed_domains_domain` (`domain`),
    INDEX `idx_allowed_domains_active` (`is_active`),
    INDEX `idx_allowed_domains_created_by` (`created_by_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `allowed_domains` (`domain`, `company_name`, `description`, `created_by_id`) VALUES
('cybaemtech.com', 'Cybaemtech Corporation', 'Main company domain', 1),
('cybaemtech.in', 'Cybaemtech India', 'Indian subsidiary', 1),
('gmail.com', 'Gmail Users', 'For testing', 1);";
    echo "</textarea>";
    echo "</div>";
}

if (!isset($hasVerificationToken) || !$hasVerificationToken) {
    echo "<div style='background: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 10px 0;'>";
    echo "<strong>SECONDARY ISSUE: Missing verification fields</strong><br>";
    echo "<strong>Solution:</strong> Run the migration script at:<br>";
    echo "<a href='/itsm_app/migrate_verification.php' target='_blank'>https://cybaemtech.in/itsm_app/migrate_verification.php</a>";
    echo "</div>";
}

echo "<div style='background: #e8f5e8; padding: 15px; border-left: 4px solid #4caf50; margin: 10px 0;'>";
echo "<strong>After fixing the issues above:</strong><br>";
echo "1. The domains API should work<br>";
echo "2. Settings page should load without errors<br>";
echo "3. You can add/edit domains successfully<br>";
echo "</div>";

echo "<hr>";
echo "<p><em>This diagnostic completed at: " . date('Y-m-d H:i:s') . "</em></p>";
?>