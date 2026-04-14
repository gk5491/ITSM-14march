<?php
/**
 * Test User Deletion Email with Proper Data
 */

// Include the necessary files
require_once 'php/config/database.php';
require_once 'php/helpers/email_notifications.php';

// Start session for testing
session_start();
$_SESSION['user_name'] = 'Test Admin';
$_SESSION['user_role'] = 'admin';
$_SESSION['user_email'] = 'admin@test.com';

echo "<h1>Testing User Deletion Email with Complete Data</h1>";

// Test user data that would be captured before deletion
$deletedUserData = [
    'id' => 456,
    'username' => 'deleted_user',
    'name' => 'Jane Smith', 
    'email' => 'jane.smith@company.com',
    'role' => 'agent',
    'companyName' => 'ABC Corporation',
    'department' => 'Customer Support',
    'contactNumber' => '+1-555-9876',
    'designation' => 'Senior Support Agent',
    'createdAt' => '2024-01-15 10:30:00'
];

echo "<h2>Sending User Deletion Notification</h2>";
echo "<p><strong>User being deleted:</strong> " . htmlspecialchars($deletedUserData['name']) . " (" . htmlspecialchars($deletedUserData['email']) . ")</p>";

$result = notifyAdminUserManagement('deleted', $deletedUserData, 'admin@cybaemtech.in');

if ($result) {
    echo "<div style='background: #dcfce7; border: 1px solid #16a34a; color: #15803d; padding: 12px; border-radius: 6px; margin: 16px 0;'>";
    echo "✅ <strong>Success!</strong> User deletion notification sent successfully with complete user details.";
    echo "</div>";
    
    echo "<h3>Email should now contain:</h3>";
    echo "<ul>";
    echo "<li>✅ Complete user name: " . htmlspecialchars($deletedUserData['name']) . "</li>";
    echo "<li>✅ User email: " . htmlspecialchars($deletedUserData['email']) . "</li>";
    echo "<li>✅ Username: " . htmlspecialchars($deletedUserData['username']) . "</li>";
    echo "<li>✅ Role: " . htmlspecialchars($deletedUserData['role']) . "</li>";
    echo "<li>✅ Department: " . htmlspecialchars($deletedUserData['department']) . "</li>";
    echo "<li>✅ Company: " . htmlspecialchars($deletedUserData['companyName']) . "</li>";
    echo "<li>✅ Contact: " . htmlspecialchars($deletedUserData['contactNumber']) . "</li>";
    echo "<li>✅ Designation: " . htmlspecialchars($deletedUserData['designation']) . "</li>";
    echo "<li>✅ Special deletion warning message</li>";
    echo "</ul>";
} else {
    echo "<div style='background: #fef2f2; border: 1px solid #ef4444; color: #dc2626; padding: 12px; border-radius: 6px; margin: 16px 0;'>";
    echo "❌ <strong>Failed!</strong> Could not send user deletion notification.";
    echo "</div>";
}

echo "<hr>";
echo "<p><strong>Note:</strong> Check the admin email inbox to verify that all user details are properly displayed instead of 'N/A'.</p>";
?>