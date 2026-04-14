<?php
require_once __DIR__ . '/php/config/database.php';
$db = getDb();
$hash = '$2y$10$R3FtlmSo93Kv3qzUWAHLlO1DtrUrd6Vhbt47my3NeP9InG3mt0.TO';
try {
    $u = $db->fetchOne("SELECT * FROM users WHERE password = ?", [$hash]);
    if (!$u) $u = $db->fetchOne("SELECT * FROM se_profiles WHERE password_hash = ?", [$hash]);
    if ($u) {
        echo "Found for user: " . ($u['username'] ?? $u['email'] ?? 'Unknown');
    } else {
        echo "Hash not found in current tables";
    }
} catch (Exception $e) { echo $e->getMessage(); }
?>
