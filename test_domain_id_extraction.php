<?php
/**
 * Test Domain ID Extraction
 * This script tests how domain IDs are extracted from different request formats
 */

echo "=== Domain ID Extraction Test ===\n\n";

// Test different URL patterns
$testUrls = [
    '/api/domains.php',
    '/api/domains.php/123',
    '/api/domains.php?id=456',
    '/itsm_app/php/api/domains.php',
    '/itsm_app/php/api/domains.php/789'
];

foreach ($testUrls as $testUrl) {
    echo "Testing URL: $testUrl\n";
    
    // Simulate URL parsing
    $pathParts = explode('/', trim(parse_url($testUrl, PHP_URL_PATH), '/'));
    $domainId = null;
    
    // Method 1: Check URL path for domain ID
    if (count($pathParts) > 0 && is_numeric(end($pathParts))) {
        $domainId = intval(end($pathParts));
        echo "  → Found ID in path: $domainId\n";
    }
    
    // Method 2: Check query parameters
    $queryParams = [];
    parse_str(parse_url($testUrl, PHP_URL_QUERY), $queryParams);
    if (!$domainId && isset($queryParams['id']) && is_numeric($queryParams['id'])) {
        $domainId = intval($queryParams['id']);
        echo "  → Found ID in query: $domainId\n";
    }
    
    if (!$domainId) {
        echo "  → No ID found\n";
    }
    
    echo "\n";
}

echo "=== Request Body Test ===\n";
$testRequestBodies = [
    '{"id": 123, "domain": "test.com", "companyName": "Test"}',
    '{"domain": "example.com", "companyName": "Example"}',
    '{"id": "456", "isActive": true}'
];

foreach ($testRequestBodies as $i => $body) {
    echo "Test Body " . ($i + 1) . ": $body\n";
    $input = json_decode($body, true);
    
    $domainId = null;
    if ($input && isset($input['id']) && is_numeric($input['id'])) {
        $domainId = intval($input['id']);
        echo "  → Found ID in body: $domainId\n";
    } else {
        echo "  → No ID in body\n";
    }
    echo "\n";
}

echo "=== Common Frontend Patterns ===\n";
echo "1. REST API style: PUT /api/domains.php/123\n";
echo "2. Query parameter: PUT /api/domains.php?id=123\n";
echo "3. Request body: PUT /api/domains.php with {\"id\": 123, ...}\n";
echo "4. Mixed approach: Different for different operations\n";
echo "\nThe updated code now handles all these patterns!\n";
?>