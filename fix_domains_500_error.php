<?php
/**
 * Quick Fix: Create allowed_domains table if it doesn't exist
 * Upload this file to your server and run it once to fix the 500 error
 */

// Include database connection
require_once 'php/config/database.php';

try {
    $db = getDb();
    
    echo "=== Domains Table Setup ===\n";
    
    // Check if table exists
    $tableExists = $db->fetchOne("SHOW TABLES LIKE 'allowed_domains'");
    
    if (!$tableExists) {
        echo "Creating allowed_domains table...\n";
        
        // Create table
        $createTableSQL = "
        CREATE TABLE `allowed_domains` (
            `id` INT(11) NOT NULL AUTO_INCREMENT,
            `domain` VARCHAR(255) NOT NULL UNIQUE,
            `company_name` VARCHAR(255) NOT NULL,
            `description` TEXT NULL,
            `is_active` BOOLEAN DEFAULT TRUE,
            `created_by_id` INT(11) NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            INDEX `idx_allowed_domains_domain` (`domain`),
            INDEX `idx_allowed_domains_active` (`is_active`),
            INDEX `idx_allowed_domains_created_by` (`created_by_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $db->query($createTableSQL);
        echo "✅ Table created successfully!\n";
    } else {
        echo "✅ Table already exists\n";
    }
    
    // Get admin user ID for created_by_id
    $adminUser = $db->fetchOne("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    $adminId = $adminUser ? $adminUser['id'] : 1;
    
    // Check if we have any domains
    $domainCount = $db->fetchOne("SELECT COUNT(*) as count FROM allowed_domains");
    
    if (!$domainCount || $domainCount['count'] == 0) {
        echo "Adding default domains...\n";
        
        // Default domains to add
        $defaultDomains = [
            [
                'domain' => 'cybaemtech.in',
                'company_name' => 'Cybaemtech India',
                'description' => 'Main company domain for Indian operations',
                'created_by_id' => $adminId,
                'is_active' => 1
            ],
            [
                'domain' => 'logenix.in',
                'company_name' => 'Logenix India',
                'description' => 'Partner company domain',
                'created_by_id' => $adminId,
                'is_active' => 1
            ],
            [
                'domain' => 'gmail.com',
                'company_name' => 'Gmail Users',
                'description' => 'Testing domain for Gmail users',
                'created_by_id' => $adminId,
                'is_active' => 1
            ]
        ];
        
        foreach ($defaultDomains as $domainData) {
            $db->insert('allowed_domains', $domainData);
            echo "✅ Added domain: " . $domainData['domain'] . "\n";
        }
    } else {
        echo "✅ Domains already exist (" . $domainCount['count'] . " total)\n";
    }
    
    // Show current domains
    echo "\n=== Current Allowed Domains ===\n";
    $domains = $db->fetchAll("SELECT domain, company_name, is_active FROM allowed_domains ORDER BY domain");
    
    foreach ($domains as $domain) {
        $status = $domain['is_active'] ? '✅ Active' : '❌ Inactive';
        echo sprintf("%-20s %-30s %s\n", $domain['domain'], $domain['company_name'], $status);
    }
    
    echo "\n✅ Setup complete! You can now add domains through the admin panel.\n";
    echo "📍 Navigate to Settings → Domains to manage domains.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?>