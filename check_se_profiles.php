<?php
require_once __DIR__ . '/php/config/database.php';
$db = getDb();

// Show rohan's se_profile
$p = $db->fetchOne("SELECT * FROM se_profiles WHERE LOWER(email) = 'rohan@cybaemtech.com'");
echo "SE Profile: ";
print_r($p);

// Also show aniket
$p2 = $db->fetchOne("SELECT * FROM se_profiles WHERE LOWER(email) = 'aniket.b@cybaemtech.com'");
echo "Aniket SE Profile: ";
print_r($p2);
?>
