<?php
/**
 * Fix for registration issues by updating the order of operations:
 * 1. First check if user exists
 * 2. Then create user only if they don't exist
 * 3. Finally send verification email
 */

// Get the correct path to database config regardless of working directory
$configPath = dirname(__DIR__) . '/config/database.php';
if (!file_exists($configPath)) {
    $configPath = __DIR__ . '/php/config/database.php';
}
require_once $configPath;

// Corrected registration function
function fixedHandleRegister($request) {
    $username = sanitizeInput($request['username'] ?? '');
    $password = $request['password'] ?? '';
    $name = sanitizeInput($request['name'] ?? '');
    $email = sanitizeInput($request['email'] ?? '');
    $companyName = sanitizeInput($request['companyName'] ?? '');
    $department = sanitizeInput($request['department'] ?? '');
    
    if (empty($username) || empty($password) || empty($name) || empty($email)) {
        return ['error' => 'Username, password, name, and email are required', 'status' => 400];
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['error' => 'Invalid email format', 'status' => 400];
    }

    $db = getDb();
    
    // 1. First check if email domain is allowed
    $emailDomain = strtolower(substr(strrchr($email, "@"), 1));
    if (!isDomainAllowed($db, $emailDomain)) {
        return ['error' => 'Registration is restricted to authorized domains', 'status' => 403];
    }
    
    // 2. Check if user exists BEFORE trying to create
    $existingUser = $db->fetchOne(
        "SELECT id FROM users WHERE username = ? OR email = ?",
        [$username, $email]
    );
    
    if ($existingUser) {
        return ['error' => 'Username or email already exists', 'status' => 400];
    }
    
    try {
        // 3. Create verification token
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $verificationToken = bin2hex(random_bytes(32));
        
        // 4. Prepare user data
        $userData = [
            'username' => $username,
            'password' => $hashedPassword,
            'name' => $name,
            'email' => $email,
            'role' => 'user',
            'company_name' => !empty($companyName) ? $companyName : null,
            'department' => !empty($department) ? $department : null,
            'verification_token' => $verificationToken,
            'is_verified' => 0
        ];
        
        // 5. Insert user
        $userId = $db->insert('users', $userData);
        
        if (!$userId) {
            throw new Exception('Failed to create user account');
        }
        
        // 6. Send verification email
        $verificationLink = "https://cybaemtech.in/itsm_app/verify.php?token=$verificationToken";
        $subject = "Welcome to ITSM Portal - Verify Your Email";
        $message = "Hello $name,<br><br>Your account has been created successfully.<br><br>" .
                  "Please click the link below to verify your email and activate your account:<br><br>" .
                  "<a href='$verificationLink'>$verificationLink</a><br><br>" .
                  "Your login details:<br>" .
                  "Username: $username<br>" .
                  "Please keep your login credentials secure.<br><br>" .
                  "Thank you!";
        
        require_once dirname(__DIR__) . '/vendor/autoload.php';
        
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        
        // Server settings
        $mail->isSMTP();
        $mail->Host = 'mail.cybaemtech.in';
        $mail->SMTPAuth = true;
        $mail->Username = 'noreply@cybaemtech.in';
        $mail->Password = 'Cybaem@2025';
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port = 465;
        $mail->SMTPDebug = 2;
        
        // Recipients
        $mail->setFrom('noreply@cybaemtech.in', 'ITSM Portal');
        $mail->addAddress($email, $name);
        
        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $message;
        
        if (!$mail->send()) {
            // Log email error but don't fail registration
            error_log("Failed to send verification email: " . $mail->ErrorInfo);
        }
        
        // Get created user data for response
        $user = $db->fetchOne(
            "SELECT id, username, name, email, role, company_name, department, created_at, is_verified FROM users WHERE id = ?", 
            [$userId]
        );
        
        return ['user' => $user, 'status' => 201];
        
    } catch (Exception $e) {
        error_log("Registration error: " . $e->getMessage());
        return ['error' => 'Registration failed: ' . $e->getMessage(), 'status' => 500];
    }
}

// Helper function
function sanitizeInput($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

// Test the fix if this file is run directly
if (php_sapi_name() === 'cli' || isset($_GET['test'])) {
    $testRequest = [
        'username' => 'testuser',
        'password' => 'testpass',
        'name' => 'Test User',
        'email' => 'test@cybaemtech.in',
        'companyName' => 'Test Company',
        'department' => 'IT'
    ];
    
    $result = fixedHandleRegister($testRequest);
    print_r($result);
}
?>