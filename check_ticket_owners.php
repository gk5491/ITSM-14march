<?php
require_once 'php/config/database.php';
$db = getDb();
$res = $db->fetchAll("SELECT created_by_id, COUNT(*) as count FROM tickets GROUP BY created_by_id");
foreach ($res as $row) {
    echo "User ID: " . $row['created_by_id'] . " has " . $row['count'] . " tickets.\n";
}
?>
