<?php
require_once 'php/config/database.php';
$db = getDb();
$count = $db->query("UPDATE se_check_ins SET location_name = '' WHERE location_name = 'Zoho People (Auto-sync)'")->rowCount();
echo "Cleaned up $count records.\n";
