<?php
require_once __DIR__ . '/php/config/database.php';
$db = getDb();
$log = "CHECK-INS DEBUG\n";
try {
    $s = $db->fetchAll("SELECT * FROM se_check_ins ORDER BY created_at DESC LIMIT 5");
    foreach ($s as $r) {
        $log .= "ID: [" . $r['id'] . "] | EngID: [" . $r['engineer_id'] . "] | In: [" . $r['check_in_time'] . "] | Out: [" . ($r['check_out_time'] ?? 'NULL') . "]\n";
    }
} catch (Exception $e) {
    $log .= "ERROR: " . $e->getMessage() . "\n";
}
file_put_contents(__DIR__ . '/check_db_checkins.php', "<?php\n // DUMP\n"); // dummy
file_put_contents(__DIR__ . '/checkins_out.txt', $log);
?>
