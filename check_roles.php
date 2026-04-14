<?php
require_once __DIR__ . '/php/config/database.php';
$db = getDb();

$users = $db->fetchAll("SELECT id, email, role FROM users WHERE email LIKE '%shivam%' OR email LIKE '%rohan%'");
echo "=== ITSM Users ===\n";
foreach ($users as $u) {
    echo "ID: {$u['id']} | Email: {$u['email']} | Role: {$u['role']}\n";
}

echo "\n=== SE Profiles ===\n";
$profiles = $db->fetchAll("SELECT id, email, role FROM se_profiles WHERE LOWER(email) LIKE '%shivam%' OR LOWER(email) LIKE '%rohan%'");
foreach ($profiles as $p) {
    echo "ID: {$p['id']} | Email: {$p['email']} | SE Role: {$p['role']}\n";
}
?>
