<?php
/**
 * Test Domain API Connection
 * This script tests if the domains API is working correctly
 */

echo "=== Testing Domain API ===\n";

// Test 1: Check if file exists and is readable
$domainsFile = 'php/api/domains.php';
if (file_exists($domainsFile)) {
    echo "✅ domains.php file exists\n";
} else {
    echo "❌ domains.php file not found\n";
    exit(1);
}

// Test 2: Check PHP syntax
$syntaxCheck = shell_exec("php -l $domainsFile 2>&1");
if (strpos($syntaxCheck, 'No syntax errors') !== false) {
    echo "✅ PHP syntax is valid\n";
} else {
    echo "❌ PHP syntax error: $syntaxCheck\n";
    exit(1);
}

// Test 3: Check for database class usage
$content = file_get_contents($domainsFile);
if (strpos($content, 'function getAllDomains($db)') !== false) {
    echo "✅ getAllDomains function uses \$db parameter\n";
} else {
    echo "❌ getAllDomains still uses \$pdo parameter\n";
}

if (strpos($content, 'function createDomain($db)') !== false) {
    echo "✅ createDomain function uses \$db parameter\n";
} else {
    echo "❌ createDomain still uses \$pdo parameter\n";
}

// Test 4: Check for PDO vs Database class usage
$pdoCount = substr_count($content, '$pdo->');
$dbCount = substr_count($content, '$db->');

echo "PDO usage count: $pdoCount\n";
echo "Database class usage count: $dbCount\n";

if ($pdoCount > 0) {
    echo "⚠️  Warning: Still using PDO methods, should be converted to Database class\n";
} else {
    echo "✅ All methods converted to Database class\n";
}

echo "\n=== Recommendations ===\n";
if ($pdoCount > 0) {
    echo "• Convert remaining \$pdo-> calls to \$db-> calls\n";
    echo "• Update PDO methods to Database class methods\n";
}

echo "• Run the fix_domains_500_error.php script to ensure table exists\n";
echo "• Test domain addition through admin panel\n";
?>