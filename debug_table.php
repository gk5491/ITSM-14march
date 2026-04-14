<?php
require_once 'php/config/database.php';
$db = getDb();
$cols = $db->fetchAll("DESCRIBE project_bug_reports");
echo json_encode($cols);
?>
