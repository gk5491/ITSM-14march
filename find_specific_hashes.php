<?php
require_once __DIR__ . '/php/config/database.php';
$db = getDb();
try {
    $s = $db->fetchAll("SELECT email, password FROM users WHERE email LIKE '%aniket%' OR email LIKE '%rohan%'");
    foreach ($s as $r) {
        echo $r['email'] . " => " . $r['password'] . "\n";
    }
} catch (Exception $e) { echo $e->getMessage(); }
?>
