<?php
// Zoho People Webhook Listener
// Receives Check-in / Check-out events and maps them into Site Engineering check_ins table

require_once __DIR__ . '/../config/database.php';
header('Content-Type: application/json');

// Log the incoming webhook for debugging
$logFile = __DIR__ . '/zoho_webhook_log.txt';
$rawPostData = file_get_contents('php://input');

$logEntry = "[" . date('Y-m-d H:i:s') . "] WEBHOOK RECEIVED\n";
$logEntry .= "METHOD: " . $_SERVER['REQUEST_METHOD'] . "\n";
$logEntry .= "GET PARAMS:\n" . print_r($_GET, true) . "\n";
$logEntry .= "POST PARAMS:\n" . print_r($_POST, true) . "\n";
$logEntry .= "RAW JSON:\n" . $rawPostData . "\n";
$logEntry .= "FULL URL: " . ($_SERVER['REQUEST_URI'] ?? '') . "\n";
$logEntry .= "--------------------------------------------------------\n";
file_put_contents($logFile, $logEntry, FILE_APPEND);

try {
    // Zoho sends data via URL query params, POST fields, or JSON body.
    // Check ALL sources to capture data regardless of how Zoho sends it.
    $data = [];
    
    // Priority 1: $_REQUEST (combines $_GET + $_POST)
    if (!empty($_REQUEST['email'])) {
        $data = $_REQUEST;
    }
    // Priority 2: POST body
    else if (!empty($_POST)) {
        $data = $_POST;
    }
    // Priority 3: Raw JSON body
    else if (!empty($rawPostData)) {
        $decoded = json_decode($rawPostData, true);
        if ($decoded) $data = $decoded;
    }
    // Priority 4: GET params directly
    else if (!empty($_GET['email'])) {
        $data = $_GET;
    }
    
    if (empty($data) || empty($data['email'])) {
        echo json_encode(["status" => "error", "message" => "No data provided. Check webhook log for details."]);
        http_response_code(400);
        exit;
    }

    $email = trim($data['email'] ?? '');
    
    // Zoho uses .in for some employees, but the portal uses .com
    // Normalizing the domain to ensure they match
    $email = str_replace('@cybaemtech.in', '@cybaemtech.com', $email);
    
    // Additional mapping for engineers using personal GMAIL accounts on Zoho
    $email_map = [
        'aniketbijwe8@gmail.com' => 'aniket.b@cybaemtech.com',
        'aniketbijwe0@gmail.com' => 'aniket.b@cybaemtech.com',
        'laxmipawar1369@gmail.com' => 'laxmi.pawar@cybaemtech.com',
        'rshgholap@gmail.com' => 'rahul.gholap@cybaemtech.com',
    ];

    if (isset($email_map[strtolower($email)])) {
        $email = $email_map[strtolower($email)];
    }

    $type = strtolower(trim($data['type'] ?? ''));
    
    if (!$email || !$type) {
        echo json_encode(["status" => "error", "message" => "Missing required fields: email='$email', type='$type'"]);
        http_response_code(400);
        exit;
    }

    $db = getDb();
    
    // 1. Find User by Email in se_profiles (Site Engg portal users)
    $userResult = $db->fetchOne("SELECT id, full_name as name FROM se_profiles WHERE LOWER(email) = LOWER(?)", [$email]);

    // Fallback exactly as before, if they are only in users table
    if (!$userResult) {
        $userResult = $db->fetchOne("SELECT id, name FROM users WHERE LOWER(email) = LOWER(?)", [$email]);
    }

    $userId = $userResult['id'] ?? 'unknown_'.uniqid();
    $userName = $userResult['name'] ?? trim($data['name'] ?? $data['user'] ?? 'Zoho User');
    
    $id = uniqid('zoho_');
    $timestamp = date('Y-m-d H:i:s');
    $todayDate = date('Y-m-d');
    
    // Extracting coordinates and location name
    $locationName = trim($data['location'] ?? '');
    
    // Clean up: if locationName contains a Zoho error JSON, discard it
    if (strpos($locationName, '"errors"') !== false || strpos($locationName, 'Form name') !== false) {
        $locationName = '';
    }
    
    $latitude = !empty($data['latitude']) ? floatval($data['latitude']) : 0;
    $longitude = !empty($data['longitude']) ? floatval($data['longitude']) : 0;

    if ($type === 'checkin') {
        // Always create a new check-in record (multiple per day allowed)
        $db->query(
            "INSERT INTO se_check_ins (id, engineer_id, date, check_in_time, location_name, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [$id, $userId, $todayDate, $timestamp, $locationName, $latitude, $longitude]
        );

        echo json_encode(["status" => "success", "message" => "Check-in logged", "user" => $userName]);
        error_log("[".date('Y-m-d H:i:s')."] CHECK-IN SUCCESS: $userName ($email)\n", 3, $logFile);

    } elseif ($type === 'checkout') {
        // Try to update the most recent open check-in
        $openCheckIn = $db->fetchOne(
            "SELECT id FROM se_check_ins WHERE engineer_id = ? AND date = ? AND check_out_time IS NULL ORDER BY check_in_time DESC LIMIT 1",
            [$userId, $todayDate]
        );

        if ($openCheckIn) {
            // Update existing open check-in with checkout time
            $db->query(
                "UPDATE se_check_ins SET check_out_time = ? WHERE id = ?",
                [$timestamp, $openCheckIn['id']]
            );
            error_log("[".date('Y-m-d H:i:s')."] CHECK-OUT SUCCESS (updated): $userName ($email)\n", 3, $logFile);
        } else {
            // No open check-in found — create a standalone checkout record so it's always visible
            $db->query(
                "INSERT INTO se_check_ins (id, engineer_id, date, check_out_time, location_name, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [$id, $userId, $todayDate, $timestamp, $locationName, $latitude, $longitude]
            );
            error_log("[".date('Y-m-d H:i:s')."] CHECK-OUT SUCCESS (new record): $userName ($email)\n", 3, $logFile);
        }

        echo json_encode(["status" => "success", "message" => "Check-out logged", "user" => $userName]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid type '$type'. Must be 'checkin' or 'checkout'"]);
        http_response_code(400);
    }

} catch (Exception $e) {
    file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] ERROR: " . $e->getMessage() . "\n", FILE_APPEND);
    echo json_encode(["status" => "error", "message" => "Internal server error: " . $e->getMessage()]);
    http_response_code(500);
}
