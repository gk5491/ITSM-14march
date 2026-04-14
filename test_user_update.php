<?php
/**
 * Test script to verify user update functionality
 */

session_start();

// Set up test session (admin user)
$_SESSION['user_id'] = 1;
$_SESSION['user_role'] = 'admin';

// Test the API
$api_url = 'https://cybaemtech.in/itsm_app/php/api/users.php?id=1';

$test_data = [
    'name' => 'Test Updated Name',
    'email' => 'updated@test.com',
    'companyName' => 'Updated Company',
    'department' => 'Updated Department',
    'contactNumber' => '1234567890',
    'designation' => 'Updated Position'
];

$options = [
    'http' => [
        'header' => "Content-type: application/json\r\n",
        'method' => 'PUT',
        'content' => json_encode($test_data)
    ]
];

$context = stream_context_create($options);
$result = file_get_contents($api_url, false, $context);

echo "API Response:\n";
echo $result;
echo "\n\nResponse Headers:\n";
print_r($http_response_header);
?>