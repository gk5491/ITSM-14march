<?php
require_once 'php/config/database.php';

try {
    $db = getDb();
    echo "Columns in 'users' table:\n";
    $columns = $db->fetchAll("SHOW COLUMNS FROM users");
    foreach ($columns as $column) {
        echo " - " . $column['Field'] . " (" . $column['Type'] . ")\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
