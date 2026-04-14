<?php
require_once __DIR__ . '/php/config/database.php';
$db = getDb();
$log = "TOTAL TODAY CHECK-INS\n";
try {
    $s = $db->fetchAll("SELECT * FROM se_check_ins WHERE date = CURRENT_DATE");
    foreach ($s as $r) {
        $log .= "ID: [" . $r['id'] . "] | In: [" . $r['check_in_time'] . "] | Out: [" . ($r['check_out_time'] ?? 'NULL') . "] | Site: [" . $r['site_id'] . "]\n";
    }
} catch (Exception $e) {
    $log .= "ERROR: " . $e->getMessage() . "\n";
}
file_put_contents(__DIR__ . '/checkins_full.txt', $log);
?>
