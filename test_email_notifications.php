<?php
/**
 * Test Email Notifications
 * This script tests the email notification system
 */

require_once 'php/config/database.php';
require_once 'php/helpers/email_notifications.php';

// Test data
$ticketData = [
    'id' => 123,
    'title' => 'Test Ticket',
    'description' => 'This is a test ticket for email notifications',
    'priority' => 'high',
    'status' => 'open',
    'createdBy' => [
        'name' => 'John Doe',
        'email' => 'john.doe@example.com'
    ],
    'assignedTo' => [
        'name' => 'Jane Smith',
        'email' => 'jane.smith@example.com'
    ]
];

$userData = [
    'name' => 'John Doe',
    'email' => 'john.doe@example.com'
];

$adminData = [
    'name' => 'Admin User',
    'email' => 'admin@example.com'
];

// Test notifications
echo "Testing email notifications...\n";

// Test user ticket creation notification
echo "1. Testing user ticket creation notification...\n";
$result = notifyUserTicketCreation($ticketData, $userData);
echo $result ? "   SUCCESS\n" : "   FAILED\n";

// Test admin ticket creation notification
echo "2. Testing admin ticket creation notification...\n";
$result = notifyAdminTicketCreation($ticketData, $adminData);
echo $result ? "   SUCCESS\n" : "   FAILED\n";

// Test agent ticket assignment notification
echo "3. Testing agent ticket assignment notification...\n";
$result = notifyAgentTicketAssignment($ticketData, $adminData); // Using admin as agent for test
echo $result ? "   SUCCESS\n" : "   FAILED\n";

// Test user ticket assignment notification
echo "4. Testing user ticket assignment notification...\n";
$result = notifyUserTicketAssignment($ticketData, $userData);
echo $result ? "   SUCCESS\n" : "   FAILED\n";

// Test admin ticket assignment notification
echo "5. Testing admin ticket assignment notification...\n";
$result = notifyAdminTicketAssignment($ticketData, $adminData);
echo $result ? "   SUCCESS\n" : "   FAILED\n";

// Test admin user management notification
echo "6. Testing admin user management notification...\n";
$result = notifyAdminUserManagement('created', $userData, $adminData['email']);
echo $result ? "   SUCCESS\n" : "   FAILED\n";

echo "\nEmail notification tests completed.\n";
?>