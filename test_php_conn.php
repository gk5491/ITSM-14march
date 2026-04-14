<?php
require_once 'php/config/database.php';

try {
    $db = getDb();
    $result = $db->fetchOne("SELECT COUNT(*) as count FROM users");
    echo "✅ Success: PHP connected to database. Found " . $result['count'] . " users.\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
