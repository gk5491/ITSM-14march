<?php
require_once 'php/config/database.php';
$db = getDb();
$cols = $db->fetchAll("DESCRIBE project_bug_reports");
foreach ($cols as $col) {
    echo $col['Field'] . " (" . $col['Type'] . ") - Null: " . $col['Null'] . ", Default: " . $col['Default'] . "\n";
}
?>
