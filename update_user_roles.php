<?php
/**
 * Update User Roles Script
 * Set shivam.jagtap@cybaemtech.com to both admin and agent
 */

// Get the correct path to database config
$configPath = dirname(__FILE__) . '/php/config/database.php';
if (!file_exists($configPath)) {
    $configPath = __DIR__ . '/php/config/database.php';
}
require_once $configPath;

try {
    $db = getDb();
    
    // Update the user's role to support both admin and agent
    $result = $db->update(
        'users',
        ['role' => 'admin,agent'],
        'email = ?',
        ['shivam.jagtap@cybaemtech.com']
    );
    
    // Verify the update
    $user = $db->fetchOne(
        "SELECT id, name, email, role FROM users WHERE email = ?",
        ['shivam.jagtap@cybaemtech.com']
    );
    
    if ($user) {
        echo "✓ User role updated successfully\n";
        echo "User: " . $user['name'] . "\n";
        echo "Email: " . $user['email'] . "\n";
        echo "Role: " . $user['role'] . "\n";
    } else {
        echo "✗ User not found\n";
    }
    
} catch (Exception $e) {
    echo "Error updating user role: " . $e->getMessage() . "\n";
    exit(1);
}
?>
