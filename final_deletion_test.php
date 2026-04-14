<?php
/**
 * Final Test: User Deletion Email with Complete Data
 */

// Include the necessary files
require_once 'php/config/database.php';
require_once 'php/helpers/email_notifications.php';

// Start session for testing
session_start();
$_SESSION['user_name'] = 'System Administrator';
$_SESSION['user_role'] = 'admin';
$_SESSION['user_email'] = 'admin@cybaemtech.in';

echo "<h1>🎯 Final Test: User Deletion Email with Complete Data</h1>";

// Simulate realistic user data that would be captured before deletion
$realisticUserData = [
    'id' => 789,
    'username' => 'john.smith', 
    'name' => 'John Smith',
    'email' => 'john.smith@company.com',
    'role' => 'agent',
    'companyName' => 'Tech Solutions Inc.',
    'department' => 'IT Support',
    'contactNumber' => '+1-555-0199',
    'designation' => 'Senior Support Agent',
    'createdAt' => '2024-03-15 09:30:00'
];

echo "<div style='background: #f0f9ff; border: 1px solid #0ea5e9; padding: 16px; border-radius: 8px; margin: 16px 0;'>";
echo "<h2 style='color: #0284c7; margin: 0 0 12px 0;'>📋 User Data Being Sent to Email Template:</h2>";
echo "<table style='width: 100%; border-collapse: collapse; background: white;'>";
echo "<tr style='background: #f8fafc;'><th style='text-align: left; padding: 8px; border: 1px solid #e2e8f0;'>Field</th><th style='text-align: left; padding: 8px; border: 1px solid #e2e8f0;'>Value</th></tr>";

foreach ($realisticUserData as $field => $value) {
    echo "<tr>";
    echo "<td style='padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;'>" . htmlspecialchars($field) . "</td>";
    echo "<td style='padding: 8px; border: 1px solid #e2e8f0;'>" . htmlspecialchars($value) . "</td>";
    echo "</tr>";
}
echo "</table>";
echo "</div>";

echo "<h2>📧 Sending User Deletion Notification...</h2>";

$result = notifyAdminUserManagement('deleted', $realisticUserData, 'admin@cybaemtech.in');

if ($result) {
    echo "<div style='background: #f0fdf4; border: 1px solid #16a34a; color: #15803d; padding: 16px; border-radius: 8px; margin: 16px 0;'>";
    echo "<h3 style='color: #15803d; margin: 0 0 12px 0;'>✅ Success! Email Sent Successfully</h3>";
    echo "<p style='margin: 0;'>The user deletion notification has been sent with the complete user details shown above.</p>";
    echo "</div>";
    
    echo "<div style='background: #fffbeb; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 16px 0;'>";
    echo "<h3 style='color: #d97706; margin: 0 0 12px 0;'>📧 Email Content Should Now Show:</h3>";
    echo "<ul style='color: #92400e; margin: 0; padding-left: 20px;'>";
    echo "<li>✅ <strong>Name:</strong> " . htmlspecialchars($realisticUserData['name']) . " (instead of 'Unknown User')</li>";
    echo "<li>✅ <strong>Email:</strong> " . htmlspecialchars($realisticUserData['email']) . " (instead of 'N/A')</li>";
    echo "<li>✅ <strong>Username:</strong> " . htmlspecialchars($realisticUserData['username']) . " (instead of 'N/A')</li>";
    echo "<li>✅ <strong>Role:</strong> " . htmlspecialchars($realisticUserData['role']) . " (with proper color coding)</li>";
    echo "<li>✅ <strong>Department:</strong> " . htmlspecialchars($realisticUserData['department']) . " (instead of 'N/A')</li>";
    echo "<li>✅ <strong>Company:</strong> " . htmlspecialchars($realisticUserData['companyName']) . " (instead of 'N/A')</li>";
    echo "<li>✅ <strong>Contact:</strong> " . htmlspecialchars($realisticUserData['contactNumber']) . " (instead of 'N/A')</li>";
    echo "<li>✅ <strong>Designation:</strong> " . htmlspecialchars($realisticUserData['designation']) . " (instead of 'N/A')</li>";
    echo "<li>✅ <strong>Special deletion warning</strong> indicating the account has been permanently removed</li>";
    echo "<li>✅ <strong>Complete audit trail</strong> with admin info and timestamp</li>";
    echo "</ul>";
    echo "</div>";
    
    echo "<div style='background: #dbeafe; border: 1px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 16px 0;'>";
    echo "<h3 style='color: #1d4ed8; margin: 0 0 12px 0;'>🔧 What Was Fixed:</h3>";
    echo "<ol style='color: #1e40af; margin: 0; padding-left: 20px;'>";
    echo "<li><strong>Database Query:</strong> Now fetches complete user data before deletion</li>";
    echo "<li><strong>Data Mapping:</strong> Properly maps database fields to expected format</li>";
    echo "<li><strong>Default Values:</strong> Uses descriptive defaults instead of NULL</li>";
    echo "<li><strong>Email Template:</strong> Removed fallback '?? N/A' that was overriding provided data</li>";
    echo "<li><strong>Error Handling:</strong> Added debugging and better error messages</li>";
    echo "</ol>";
    echo "</div>";
    
} else {
    echo "<div style='background: #fef2f2; border: 1px solid #ef4444; color: #dc2626; padding: 16px; border-radius: 8px; margin: 16px 0;'>";
    echo "<h3 style='color: #dc2626; margin: 0 0 12px 0;'>❌ Email Send Failed</h3>";
    echo "<p style='margin: 0;'>There was an issue sending the email. Check server logs for details.</p>";
    echo "</div>";
}

echo "<hr style='margin: 32px 0;'>";

echo "<div style='background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #6366f1;'>";
echo "<h3 style='color: #4338ca; margin: 0 0 12px 0;'>📝 Instructions for Testing on Live Server:</h3>";
echo "<ol style='color: #4338ca; margin: 0; padding-left: 20px;'>";
echo "<li>Create a test user with complete profile information</li>";
echo "<li>Delete the user through the admin interface</li>";
echo "<li>Check the admin email inbox for the deletion notification</li>";
echo "<li>Verify that all user details show actual values instead of 'N/A'</li>";
echo "<li>Confirm the special deletion warning is displayed</li>";
echo "</ol>";
echo "</div>";

echo "<p style='margin-top: 24px; font-size: 14px; color: #6b7280;'>";
echo "Generated on: " . date('Y-m-d H:i:s') . " | ";
echo "Session User: " . ($_SESSION['user_name'] ?? 'Unknown') . " | ";
echo "User Role: " . ($_SESSION['user_role'] ?? 'Unknown');
echo "</p>";
?>