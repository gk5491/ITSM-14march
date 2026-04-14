<?php
require_once 'php/config/database.php';

// Get test credentials from request
$testEmail = $_GET['email'] ?? '';
$testUsername = $_GET['username'] ?? '';

if (empty($testEmail) && empty($testUsername)) {
    die("Please provide email and/or username parameters to test");
}

$db = getDb();

// Check for exact matches
$exactMatch = $db->fetchOne(
    "SELECT id, username, email FROM users WHERE username = ? OR email = ?",
    [$testUsername, $testEmail]
);

// Check for case-insensitive email matches
$caseInsensitiveMatch = $db->fetchOne(
    "SELECT id, username, email FROM users WHERE LOWER(email) = LOWER(?)",
    [$testEmail]
);

echo "Testing registration for:\n";
echo "Email: " . htmlspecialchars($testEmail) . "\n";
echo "Username: " . htmlspecialchars($testUsername) . "\n\n";

echo "Exact match results:\n";
var_dump($exactMatch);
echo "\n\n";

echo "Case-insensitive email match results:\n";
var_dump($caseInsensitiveMatch);

// Check email verification status
if (!empty($testEmail)) {
    $verificationStatus = $db->fetchOne(
        "SELECT id, email, is_verified, verification_token FROM users WHERE email = ?",
        [$testEmail]
    );
    
    echo "\n\nVerification status:\n";
    var_dump($verificationStatus);
}
?>