<?php
require_once __DIR__ . '/php/config/database.php';
$db = getDb();

$email = 'shivam.jagtap@cybaemtech.com';

// 1. Force SE role to 'hr'
$db->query("UPDATE se_profiles SET role = 'hr' WHERE LOWER(email) = LOWER(?)", [$email]);
echo "Forced SE role to 'hr' in DB.\n";

// 2. Clear his session by updating session table if it exists, or just tell user to re-login
// Since I can't easily wipe a specific user's PHP session file, I'll update the SE role sync to ALWAYS fetch it if missing.

echo "Ready for Shivam to re-login.\n";
?>
