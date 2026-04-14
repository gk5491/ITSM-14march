<?php
require_once 'php/config/database.php';
$db = getDb();
$today = date('Y-m-d');
$checkins = $db->fetchAll("SELECT c.*, p.full_name FROM se_check_ins c LEFT JOIN se_profiles p ON c.engineer_id = p.id WHERE c.date = ? ORDER BY c.check_in_time DESC", [$today]);
echo "Records for $today: " . count($checkins) . "\n\n";
echo json_encode($checkins, JSON_PRETTY_PRINT);
