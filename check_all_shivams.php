<?php
require_once __DIR__ . '/php/config/database.php';
$db = getDb();
$profiles = $db->fetchAll("SELECT id, email, role FROM se_profiles WHERE email LIKE '%shivam%'");
foreach ($profiles as $p) {
    echo "ID: {$p['id']} | Email: {$p['email']} | SE Role: {$p['role']}\n";
}
?>
