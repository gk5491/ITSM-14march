<?php
require_once 'php/config/database.php';
$db = getDb();

function addColumnIfMissing($db, $table, $column, $definition) {
    $cols = $db->fetchAll("DESCRIBE $table");
    $exists = false;
    foreach ($cols as $col) {
        if ($col['Field'] === $column) {
            $exists = true;
            break;
        }
    }
    if (!$exists) {
        echo "Adding $column to $table...\n";
        $db->query("ALTER TABLE $table ADD COLUMN $column $definition");
    } else {
        echo "$column already exists in $table.\n";
    }
}

try {
    addColumnIfMissing($db, 'se_check_ins', 'site_id', 'VARCHAR(50) AFTER engineer_id');
    addColumnIfMissing($db, 'se_daily_reports', 'site_id', 'VARCHAR(50) AFTER client_id');
    echo "Database maintenance complete.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
