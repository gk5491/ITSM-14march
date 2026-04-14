<?php
require_once __DIR__ . '/php/config/database.php';
$db = getDb();

// Fix Shivam: Set ITSM role to 'agent' and SE profile role to 'hr'
// His ITSM role is 'admin,agent' which causes him to get admin view
$db->query("UPDATE users SET role = 'agent' WHERE email = 'shivam.jagtap@cybaemtech.com'");
echo "Updated Shivam ITSM role to 'agent'\n";

$db->query("UPDATE se_profiles SET role = 'hr' WHERE LOWER(email) = 'shivam.jagtap@cybaemtech.com'");
echo "Updated Shivam SE role to 'hr'\n";

// Confirm Rohan is still admin (he already is, just validate)
$rohan = $db->fetchOne("SELECT email, role FROM users WHERE email = 'rohan@cybaemtech.com'");
echo "Rohan ITSM role: {$rohan['role']} (should be admin)\n";

$rohanSE = $db->fetchOne("SELECT email, role FROM se_profiles WHERE LOWER(email) = 'rohan@cybaemtech.com'");
echo "Rohan SE role: {$rohanSE['role']} (should be admin)\n";

// Re-verify Shivam
$shivam = $db->fetchOne("SELECT email, role FROM users WHERE email = 'shivam.jagtap@cybaemtech.com'");
$shivamSE = $db->fetchOne("SELECT email, role FROM se_profiles WHERE LOWER(email) = 'shivam.jagtap@cybaemtech.com'");
echo "Shivam ITSM role: {$shivam['role']}\n";
echo "Shivam SE role: {$shivamSE['role']}\n";
echo "\nDone! Shivam will now see HR view, Rohan will see Admin view.\n";
?>
