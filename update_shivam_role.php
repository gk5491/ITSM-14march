<?php
require_once __DIR__ . '/php/config/database.php';
$db = getDb();
$db->query("UPDATE se_profiles SET role = 'admin,hr,engineer' WHERE LOWER(email) = 'shivam.jagtap@cybaemtech.com'");
echo "Done.";
