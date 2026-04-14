<?php
require_once 'php/config/database.php';
$db = getDb();
$res = $db->fetchAll("SELECT * FROM se_assignments LIMIT 5");
file_put_contents('assignments_out.txt', var_export($res, true));
?>
