<?php
/**
 * Test Enhanced Email Notifications
 */

// Include the necessary files
require_once 'php/config/database.php';
require_once 'php/helpers/email_notifications.php';

// Start session for testing
session_start();
$_SESSION['user_name'] = 'Test Admin';
$_SESSION['user_role'] = 'admin';
$_SESSION['user_email'] = 'admin@test.com';

echo "<h1>Testing Enhanced Email Notifications</h1>";

// Test 1: Admin notification for user creation
echo "<h2>Test 1: Admin User Management Notification</h2>";
$testUserData = [
    'id' => 123,
    'name' => 'John Doe',
    'email' => 'john.doe@test.com',
    'username' => 'johndoe',
    'role' => 'user',
    'department' => 'IT Support',
    'companyName' => 'Test Company Inc.',
    'contactNumber' => '+1-555-0123',
    'designation' => 'Support Specialist'
];

$result1 = notifyAdminUserManagement('created', $testUserData, 'admin@cybaemtech.in');
echo $result1 ? "✅ Admin notification sent successfully" : "❌ Failed to send admin notification";

echo "<h2>Test 2: User Welcome Email</h2>";
$welcomeUserData = [
    'username' => 'johndoe',
    'password' => 'TempPass123!',
    'name' => 'John Doe',
    'email' => 'john.doe@test.com',
    'role' => 'user',
    'department' => 'IT Support',
    'companyName' => 'Test Company Inc.'
];

$verificationLink = 'https://cybaemtech.in/itsm_app/verify.php?token=abc123';
$result2 = sendUserWelcomeEmail($welcomeUserData, $verificationLink);
echo $result2 ? "✅ Welcome email sent successfully" : "❌ Failed to send welcome email";

echo "<h2>Test 3: User Account Update Notification</h2>";
$result3 = notifyUserAccountUpdate($testUserData, ['Name', 'Department', 'Contact Number']);
echo $result3 ? "✅ User update notification sent successfully" : "❌ Failed to send user update notification";

echo "<hr>";
echo "<p><strong>Note:</strong> If all tests show ✅, the email system is working correctly!</p>";
echo "<p>Check the email addresses used in the test to see if the emails were received.</p>";
?>