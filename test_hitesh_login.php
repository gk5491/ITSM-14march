<?php
/**
 * Test Login for Hitesh User
 */

echo "<h1>🧪 Testing Login for Hitesh User</h1>";

// Test data for the user
$loginData = [
    'username' => 'hitesh',
    'password' => 'Pass@123',
    'email' => 'HiteshITsupport@logenix.in'
];

echo "<div style='background: #f0f9ff; border: 1px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 16px 0;'>";
echo "<h2 style='color: #1d4ed8; margin: 0 0 12px 0;'>📋 Login Test Details:</h2>";
echo "<p><strong>Username:</strong> " . htmlspecialchars($loginData['username']) . "</p>";
echo "<p><strong>Email:</strong> " . htmlspecialchars($loginData['email']) . "</p>";
echo "<p><strong>Domain:</strong> logenix.in</p>";
echo "<p><strong>Password:</strong> [Hidden for security]</p>";
echo "</div>";

// Test the domain extraction logic
$email = $loginData['email'];
$emailDomain = strtolower(substr(strrchr($email, "@"), 1));

echo "<h2>🔍 Domain Check Analysis:</h2>";
echo "<p><strong>Extracted Domain:</strong> " . htmlspecialchars($emailDomain) . "</p>";

// Check if domain is in our allowed list
$allowedDomains = ['cybaemtech.in', 'logenix.in', 'test.com', 'localhost'];
$domainAllowed = in_array($emailDomain, $allowedDomains);

if ($domainAllowed) {
    echo "<p style='color: green;'>✅ Domain '" . htmlspecialchars($emailDomain) . "' is in the hardcoded allowed domains list</p>";
} else {
    echo "<p style='color: red;'>❌ Domain '" . htmlspecialchars($emailDomain) . "' is NOT in the hardcoded allowed domains list</p>";
}

echo "<h2>📝 Allowed Domains List:</h2>";
echo "<ul>";
foreach ($allowedDomains as $domain) {
    $highlight = ($domain === $emailDomain) ? " style='background: #dcfce7; font-weight: bold;'" : "";
    echo "<li$highlight>" . htmlspecialchars($domain) . "</li>";
}
echo "</ul>";

// Simulate the API call
echo "<h2>🚀 Simulating Login API Call:</h2>";

$apiUrl = 'https://cybaemtech.in/itsm_app/php/api/auth.php?action=login';
$postData = json_encode([
    'username' => $loginData['username'],
    'password' => $loginData['password']
]);

$options = [
    'http' => [
        'header'  => "Content-Type: application/json\r\n",
        'method'  => 'POST',
        'content' => $postData
    ]
];

echo "<p><strong>API Endpoint:</strong> " . htmlspecialchars($apiUrl) . "</p>";
echo "<p><strong>Request Method:</strong> POST</p>";
echo "<p><strong>Request Data:</strong></p>";
echo "<pre style='background: #f5f5f5; padding: 10px; border-radius: 5px;'>";
echo json_encode([
    'username' => $loginData['username'],
    'password' => '[HIDDEN]'
], JSON_PRETTY_PRINT);
echo "</pre>";

$context = stream_context_create($options);
$result = @file_get_contents($apiUrl, false, $context);

if ($result !== false) {
    $response = json_decode($result, true);
    
    if (isset($response['error'])) {
        echo "<div style='background: #fef2f2; border: 1px solid #ef4444; color: #dc2626; padding: 16px; border-radius: 8px; margin: 16px 0;'>";
        echo "<h3 style='color: #dc2626; margin: 0 0 12px 0;'>❌ Login Failed</h3>";
        echo "<p><strong>Error:</strong> " . htmlspecialchars($response['error']) . "</p>";
        echo "</div>";
        
        if (strpos($response['error'], 'domain is no longer authorized') !== false) {
            echo "<div style='background: #fffbeb; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 16px 0;'>";
            echo "<h3 style='color: #d97706; margin: 0 0 12px 0;'>🔧 Domain Authorization Issue</h3>";
            echo "<p>The domain check is still failing. This could be because:</p>";
            echo "<ul style='color: #92400e;'>";
            echo "<li>The allowed_domains table doesn't have logenix.in</li>";
            echo "<li>The hardcoded domain list isn't being checked properly</li>";
            echo "<li>There's a caching issue with the code</li>";
            echo "</ul>";
            echo "<p><strong>Solution:</strong> Run the fix_domain_auth.php script to add the domain to the database.</p>";
            echo "</div>";
        }
    } else {
        echo "<div style='background: #f0fdf4; border: 1px solid #16a34a; color: #15803d; padding: 16px; border-radius: 8px; margin: 16px 0;'>";
        echo "<h3 style='color: #15803d; margin: 0 0 12px 0;'>✅ Login Successful!</h3>";
        echo "<p>User logged in successfully. Response:</p>";
        echo "<pre style='background: white; padding: 10px; border-radius: 5px; color: #1f2937;'>";
        echo json_encode($response, JSON_PRETTY_PRINT);
        echo "</pre>";
        echo "</div>";
    }
} else {
    echo "<div style='background: #fef2f2; border: 1px solid #ef4444; color: #dc2626; padding: 16px; border-radius: 8px; margin: 16px 0;'>";
    echo "<h3 style='color: #dc2626; margin: 0 0 12px 0;'>❌ API Call Failed</h3>";
    echo "<p>Could not connect to the API endpoint. This could be due to:</p>";
    echo "<ul>";
    echo "<li>Network connectivity issues</li>";
    echo "<li>Server configuration problems</li>";
    echo "<li>CORS or authentication issues</li>";
    echo "</ul>";
    echo "</div>";
}

echo "<hr style='margin: 32px 0;'>";
echo "<div style='background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #6366f1;'>";
echo "<h3 style='color: #4338ca; margin: 0 0 12px 0;'>🛠️ Next Steps:</h3>";
echo "<ol style='color: #4338ca;'>";
echo "<li>If login still fails, run the <code>fix_domain_auth.php</code> script</li>";
echo "<li>Check if the user's email is verified in the database</li>";
echo "<li>Verify the password hash in the database matches</li>";
echo "<li>Check server logs for additional error details</li>";
echo "</ol>";
echo "</div>";
?>