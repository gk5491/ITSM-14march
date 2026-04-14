<?php
require_once __DIR__ . '/php/config/database.php';
$db = getDb();

$email = 'shivam.jagtap@cybaemtech.com';
$user = $db->fetchOne("SELECT * FROM users WHERE email = ?", [$email]);
$seProfile = $db->fetchOne("SELECT * FROM se_profiles WHERE LOWER(email) = LOWER(?)", [$email]);

echo "=== DB STATE ===\n";
echo "ITSM Role: " . $user['role'] . "\n";
echo "SE Role: " . ($seProfile['role'] ?? 'NOT FOUND') . "\n";
echo "SE ID: " . ($seProfile['id'] ?? 'N/A') . "\n";

// Test handleGetUser-like logic
session_start();
$_SESSION['user_id'] = $user['id'];
$_SESSION['site_engg_user_id'] = $seProfile['id'];

$seRoleResult = $db->fetchOne("SELECT role FROM se_profiles WHERE id = ?", [$_SESSION['site_engg_user_id']]);
echo "SE Role from fetch: " . ($seRoleResult['role'] ?? 'NULL') . "\n";
?>
