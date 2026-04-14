<?php
require_once 'php/config/database.php';

try {
    $db = getDb();
    $email = 'shivam.jagtap@cybaemtech.com';
    $newPassword = 'Cybaem@909$';
    $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 10]);
    
    echo "Attempting to fix user: $email\n";
    
    // Check if user exists
    $user = $db->fetchOne("SELECT * FROM users WHERE email = ?", [$email]);
    
    if ($user) {
        $updateData = [
            'password' => $hashedPassword,
            'is_verified' => 1
        ];
        
        // Also ensure username is set correctly if they prefer to login with email
        // We'll leave username as is ('shivam') but verify they can login with email
        
        $db->update('users', $updateData, 'id = ?', [$user['id']]);
        echo "✅ User updated successfully!\n";
        echo "Password set to: $newPassword\n";
        echo "Verified set to: 1\n";
    } else {
        echo "❌ User '$email' not found. Creating new user...\n";
        $insertData = [
            'username' => 'shivam',
            'email' => $email,
            'password' => $hashedPassword,
            'name' => 'Shivam Jagtap',
            'role' => 'admin',
            'is_verified' => 1,
            'company_name' => 'Cybaemtech',
            'created_at' => date('Y-m-d H:i:s')
        ];
        $db->insert('users', $insertData);
        echo "✅ User created successfully!\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
