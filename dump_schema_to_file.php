<?php
require_once 'php/config/database.php';
$db = getDb();
$res = $db->fetchAll("DESCRIBE se_check_ins");
file_put_contents('schema_out.txt', var_export($res, true));
?>
