<?php
require_once 'php/config/database.php';
$db = getDb();
$count = $db->fetchOne("SELECT COUNT(*) as cnt FROM project_bug_reports");
echo "Total bug reports: " . $count['cnt'] . "\n";

if ($count['cnt'] == 0) {
    echo "Inserting dummy bug report...\n";
    $db->insert('project_bug_reports', [
        'comment' => 'Initial test bug report to verify visibility',
        'created_by' => 47, // shivam's ID
        'resolution_status' => 'not-resolved',
        'screenshot_path' => null
    ]);
    echo "Inserted.\n";
}
?>
