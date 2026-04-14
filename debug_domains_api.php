<?php
/**
 * Debug Domain API Issue
 * This script helps identify the exact cause of the 500 error
 */

// Start session to maintain authentication context
session_start();

// Mock admin session for testing (remove in production)
$_SESSION['user_id'] = 1;
$_SESSION['role'] = 'admin';

echo "Content-Type: text/plain\n\n";
echo "=== Domain API Debug ===\n\n";

try {
    // Include database connection
    require_once 'php/config/database.php';
    
    echo "✅ Database config loaded successfully\n";
    
    // Test database connection
    $db = getDb();
    echo "✅ Database connection established\n";
    
    // Test table existence
    echo "\nChecking allowed_domains table...\n";
    $tableExists = $db->fetchOne("SHOW TABLES LIKE 'allowed_domains'");
    
    if ($tableExists) {
        echo "✅ allowed_domains table exists\n";
        
        // Count existing domains
        $count = $db->fetchOne("SELECT COUNT(*) as count FROM allowed_domains");
        echo "📊 Current domains count: " . $count['count'] . "\n";
        
        // Show existing domains
        $domains = $db->fetchAll("SELECT domain, company_name, is_active FROM allowed_domains LIMIT 5");
        echo "\nExisting domains:\n";
        foreach ($domains as $domain) {
            $status = $domain['is_active'] ? 'Active' : 'Inactive';
            echo "  - {$domain['domain']} ({$domain['company_name']}) [$status]\n";
        }
    } else {
        echo "❌ allowed_domains table does NOT exist\n";
        echo "💡 Solution: Run the table creation script\n";
    }
    
    // Test domain creation simulation
    echo "\n=== Testing Domain Creation Logic ===\n";
    
    $testInput = [
        'domain' => 'test.com',
        'companyName' => 'Test Company',
        'description' => 'Test domain for debugging'
    ];
    
    echo "Test input: " . json_encode($testInput) . "\n";
    
    // Validate domain format
    $domain = strtolower(trim($testInput['domain']));
    if (filter_var("test@" . $domain, FILTER_VALIDATE_EMAIL)) {
        echo "✅ Domain format is valid\n";
    } else {
        echo "❌ Domain format is invalid\n";
    }
    
    // Check if domain already exists (only if table exists)
    if ($tableExists) {
        $existing = $db->fetchOne("SELECT id FROM allowed_domains WHERE domain = ?", [$domain]);
        if ($existing) {
            echo "⚠️  Domain already exists with ID: " . $existing['id'] . "\n";
        } else {
            echo "✅ Domain is available for creation\n";
        }
    }
    
    echo "\n=== Conclusion ===\n";
    if (!$tableExists) {
        echo "🔧 MAIN ISSUE: allowed_domains table doesn't exist\n";
        echo "📋 ACTION: Create the table using fix_domains_500_error.php\n";
    } else {
        echo "✅ Database setup appears correct\n";
        echo "🔍 Check server error logs for specific error details\n";
    }
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "📍 File: " . $e->getFile() . " Line: " . $e->getLine() . "\n";
    echo "🔧 This is likely the cause of the 500 error\n";
}

echo "\n=== Next Steps ===\n";
echo "1. Upload this debug script to your server\n";
echo "2. Run it to see the exact error\n";
echo "3. If table missing, run fix_domains_500_error.php\n";
echo "4. Test domain addition again\n";
?>