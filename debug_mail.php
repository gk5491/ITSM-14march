<?php
require_once dirname(__DIR__) . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

$mail = new PHPMailer(true);

try {
    // Server settings
    $mail->SMTPDebug = SMTP::DEBUG_SERVER;
    $mail->isSMTP();
    $mail->Host = 'mail.cybaemtech.in';
    $mail->SMTPAuth = true;
    $mail->Username = 'noreply@cybaemtech.in';
    $mail->Password = 'Cybaem@2025';
    $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = 465;

    // Test recipients
    $mail->setFrom('noreply@cybaemtech.in', 'ITSM Portal');
    $mail->addAddress('test@example.com', 'Test User');

    // Content
    $mail->isHTML(true);
    $mail->Subject = 'Test Email';
    $mail->Body = 'This is a test email to verify SMTP settings are working.';

    $mail->send();
    echo "Test email sent successfully\n";
    echo "Debug log:\n";
    echo $mail->ErrorInfo;
} catch (Exception $e) {
    echo "Email could not be sent. Mailer Error: {$mail->ErrorInfo}\n";
    echo "Full error: " . $e->getMessage() . "\n";
    
    // Check SMTP connection
    echo "\nTesting SMTP connection...\n";
    $smtp = fsockopen('mail.cybaemtech.in', 465, $errno, $errstr, 30);
    if (!$smtp) {
        echo "SMTP connection failed: $errstr ($errno)\n";
    } else {
        echo "SMTP connection successful\n";
        fclose($smtp);
    }
}
?>