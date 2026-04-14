<?php
require_once 'php/config/database.php';

try {
    $db = getDb();
    $username = 'shivam.jagtap@cybaemtech.com';
    $user = $db->fetchOne("SELECT * FROM users WHERE username = ? OR email = ?", [$username, $username]);
    
    if ($user) {
        echo "✅ User found!\n";
        echo "ID: " . $user['id'] . "\n";
        echo "Username: " . $user['username'] . "\n";
        echo "Email: " . $user['email'] . "\n";
        echo "Name: " . $user['name'] . "\n";
        echo "Role: " . $user['role'] . "\n";
        // Do not echo password, but we can check if it looks like a hash
        echo "Password hash starts with: " . substr($user['password'], 0, 10) . "...\n";
    } else {
        echo "❌ User '$username' not found in database.\n";
        
        // List a few users to see what data looks like
        echo "\nExisting users (first 5):\n";
        $users = $db->fetchAll("SELECT username, email FROM users LIMIT 5");
        foreach ($users as $u) {
            echo " - " . $u['username'] . " (" . $u['email'] . ")\n";
        }
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
