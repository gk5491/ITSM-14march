<?php
require_once __DIR__ . '/php/config/database.php';
$db = getDb();
$now = date('Y-m-d H:i:s');
$db->query("UPDATE se_check_ins SET check_out_time = ?, updated_at = ? WHERE check_out_time IS NULL AND date = CURRENT_DATE", [$now, $now]);
echo "Cleanup attempted. User's open check-ins should now be closed.";
?>
