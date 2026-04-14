<?php
require_once __DIR__ . '/php/config/database.php';
$db = getDb();
$u = $db->fetchOne("SELECT id, email, role FROM users WHERE email = 'rohan@cybaemtech.com'");
print_r($u);
?>
