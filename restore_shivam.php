<?php
require_once __DIR__ . '/php/config/database.php';
$db = getDb();
$db->query("UPDATE users SET role = 'admin,agent' WHERE email = 'shivam.jagtap@cybaemtech.com'");
echo "Shivam ITSM role set to 'admin,agent'\n";
?>
