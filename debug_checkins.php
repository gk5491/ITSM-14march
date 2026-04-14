<?php
require_once 'php/config/database.php';
$db = getDb();
$checkins = $db->fetchAll("SELECT c.*, p.full_name FROM se_check_ins c LEFT JOIN se_profiles p ON c.engineer_id = p.id ORDER BY c.created_at DESC LIMIT 20");
echo json_encode($checkins, JSON_PRETTY_PRINT);
