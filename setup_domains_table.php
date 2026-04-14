<?php
/**
 * Setup Script: Create and populate allowed_domains table
 * This script ensures the domains table exists and has proper default domains
 */

require_once 'php/config/database.php';

try {
    $db = getDb();
    
    echo "=== Domain Management Setup ===\n";
    
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
        echo "✓ Table created successfully!\n";
    } else {
        echo "✓ Table already exists\n";
    }
    
    // Get admin user ID for created_by_id
    $adminUser = $db->fetchOne("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    $adminId = $adminUser ? $adminUser['id'] : 1;
    
    // Default domains to add
    $defaultDomains = [
        [
            'domain' => 'cybaemtech.in',
            'company_name' => 'Cybaemtech India',
            'description' => 'Main company domain for Indian operations'
        ],
        [
            'domain' => 'logenix.in',
            'company_name' => 'Logenix India',
            'description' => 'Partner company domain'
        ],
        [
            'domain' => 'test.com',
            'company_name' => 'Test Environment',
            'description' => 'Testing and development domain'
        ],
        [
            'domain' => 'localhost',
            'company_name' => 'Local Development',
            'description' => 'Local development environment'
        ]
    ];
    
    echo "\nAdding default domains...\n";
    
    foreach ($defaultDomains as $domainData) {
        // Check if domain already exists
        $existing = $db->fetchOne(
            "SELECT id FROM allowed_domains WHERE domain = ?",
            [$domainData['domain']]
        );
        
        if (!$existing) {
            $db->insert('allowed_domains', [
                'domain' => $domainData['domain'],
                'company_name' => $domainData['company_name'],
                'description' => $domainData['description'],
                'created_by_id' => $adminId,
                'is_active' => 1
            ]);
            echo "✓ Added domain: " . $domainData['domain'] . "\n";
        } else {
            echo "- Domain already exists: " . $domainData['domain'] . "\n";
        }
    }
    
    // Show current domains
    echo "\n=== Current Allowed Domains ===\n";
    $domains = $db->fetchAll("SELECT domain, company_name, is_active FROM allowed_domains ORDER BY domain");
    
    foreach ($domains as $domain) {
        $status = $domain['is_active'] ? '✓ Active' : '✗ Inactive';
        echo sprintf("%-20s %-30s %s\n", $domain['domain'], $domain['company_name'], $status);
    }
    
    echo "\n=== Setup Complete ===\n";
    echo "✓ Domain management system is now ready!\n";
    echo "✓ Authentication will now use dynamic domain checking\n";
    echo "✓ Admins can manage domains through the Settings → Domains section\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?>