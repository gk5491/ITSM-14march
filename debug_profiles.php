<?php
require_once __DIR__ . '/php/config/database.php';
$db = getDb();
print_r($db->fetchAll("SELECT id, email, full_name, role FROM se_profiles"));
