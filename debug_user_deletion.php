<?php
/**
 * Debug User Deletion Data Issue
 */

// Include the necessary files
require_once 'php/config/database.php';
require_once 'php/helpers/email_notifications.php';

// Start session for testing
session_start();
$_SESSION['user_name'] = 'Debug Admin';
$_SESSION['user_role'] = 'admin';
$_SESSION['user_email'] = 'debug@test.com';

echo "<h1>🔍 Debugging User Deletion Data Issue</h1>";

$db = getDb();

// First, let's see what users exist in the database
echo "<h2>1. Current Users in Database:</h2>";
try {
    $users = $db->fetchAll("SELECT id, username, name, email, role, company_name, department, contact_number, designation FROM users LIMIT 5");
    
    if (empty($users)) {
        echo "<p style='color: red;'>❌ No users found in database!</p>";
    } else {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr style='background: #f0f0f0;'>";
        echo "<th>ID</th><th>Username</th><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Company</th></tr>";
        
        foreach ($users as $user) {
            echo "<tr>";
            echo "<td>" . htmlspecialchars($user['id']) . "</td>";
            echo "<td>" . htmlspecialchars($user['username'] ?? 'NULL') . "</td>";
            echo "<td>" . htmlspecialchars($user['name'] ?? 'NULL') . "</td>";
            echo "<td>" . htmlspecialchars($user['email'] ?? 'NULL') . "</td>";
            echo "<td>" . htmlspecialchars($user['role'] ?? 'NULL') . "</td>";
            echo "<td>" . htmlspecialchars($user['department'] ?? 'NULL') . "</td>";
            echo "<td>" . htmlspecialchars($user['company_name'] ?? 'NULL') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Database error: " . htmlspecialchars($e->getMessage()) . "</p>";
}

// Test with the first user if exists
if (!empty($users)) {
    $testUser = $users[0];
    echo "<h2>2. Testing with User ID: " . htmlspecialchars($testUser['id']) . "</h2>";
    
    // Simulate what happens during deletion
    $userId = $testUser['id'];
    
    echo "<h3>Fetching user data (as done during deletion):</h3>";
    try {
        $user = $db->fetchOne("SELECT id, username, name, email, role, company_name, department, contact_number, designation, created_at FROM users WHERE id = ?", [$userId]);
        
        echo "<pre style='background: #f5f5f5; padding: 10px; border-radius: 5px;'>";
        echo "Raw user data from database:\n";
        print_r($user);
        echo "</pre>";
        
        if ($user) {
            // Convert data as done in the actual deletion function
            $deletedUserInfo = [
                'id' => $user['id'] ?? 'Unknown ID',
                'username' => $user['username'] ?? 'Unknown Username',
                'name' => $user['name'] ?? 'Unknown User',
                'email' => $user['email'] ?? 'Unknown Email',
                'role' => $user['role'] ?? 'user',
                'companyName' => $user['company_name'] ?? 'Not Specified',
                'department' => $user['department'] ?? 'Not Specified',
                'contactNumber' => $user['contact_number'] ?? 'Not Specified',
                'designation' => $user['designation'] ?? 'Not Specified',
                'createdAt' => $user['created_at'] ?? date('Y-m-d H:i:s')
            ];
            
            echo "<pre style='background: #e8f5e8; padding: 10px; border-radius: 5px;'>";
            echo "Converted data for email:\n";
            print_r($deletedUserInfo);
            echo "</pre>";
            
            // Test sending the email
            echo "<h3>Testing Email Send:</h3>";
            $result = notifyAdminUserManagement('deleted', $deletedUserInfo, 'test@cybaemtech.in');
            
            if ($result) {
                echo "<p style='color: green;'>✅ Email sent successfully!</p>";
                echo "<p>The email should now contain the actual user data shown above.</p>";
            } else {
                echo "<p style='color: red;'>❌ Email sending failed!</p>";
            }
        } else {
            echo "<p style='color: red;'>❌ User not found with ID: " . htmlspecialchars($userId) . "</p>";
        }
        
    } catch (Exception $e) {
        echo "<p style='color: red;'>❌ Error during test: " . htmlspecialchars($e->getMessage()) . "</p>";
    }
} else {
    echo "<p>No users available for testing.</p>";
}

echo "<hr>";
echo "<p><strong>Instructions:</strong></p>";
echo "<ol>";
echo "<li>Check the debug output above to see what data is actually in the database</li>";
echo "<li>If users show NULL values, that's why the email shows 'N/A'</li>";
echo "<li>If data looks good here but email still shows N/A, check the email template</li>";
echo "<li>Check the server logs for the debug messages we added</li>";
echo "</ol>";
?>