<?php
require_once 'php/config/database.php';
$db = getDb();
$res = $db->fetchAll("SELECT id, email, role, engineer_id FROM se_profiles");
file_put_contents('profiles_out.txt', var_export($res, true));
?>
