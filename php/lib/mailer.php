<?php
/**
 * Centralized mail helper using PHPMailer with fallback and logging.
 * Provides send_mail($to, $toName, $subject, $body, $options = [])
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once dirname(__DIR__) . '/vendor/autoload.php';

function send_mail($to, $toName, $subject, $body, $options = []) {
    $logFile = dirname(__DIR__) . '/logs/mail_debug.log';
    if (!is_dir(dirname($logFile))) {
        @mkdir(dirname($logFile), 0755, true);
    }

    // Allow overrides via environment or options
    $smtpHost = $options['host'] ?? ($_ENV['SMTP_HOST'] ?? 'mail.cybaemtech.in');
    $smtpUser = $options['username'] ?? ($_ENV['SMTP_USERNAME'] ?? 'noreply@cybaemtech.in');
    $smtpPass = $options['password'] ?? ($_ENV['SMTP_PASSWORD'] ?? 'Cybaem@2025');
    $fromEmail = $options['from'] ?? ($_ENV['MAIL_FROM'] ?? $smtpUser);
    $fromName = $options['fromName'] ?? ($_ENV['MAIL_FROM_NAME'] ?? 'Website');
    $dkimPrivateKeyFile = $options['dkim_key'] ?? ($_ENV['DKIM_PRIVATE_KEY_FILE'] ?? null);
    $dkimSelector = $options['dkim_selector'] ?? ($_ENV['DKIM_SELECTOR'] ?? 'default');

    $result = ['success' => false, 'error' => null, 'attempts' => []];

    // Debug output function: append to log file
    $debugOutput = function($str, $level) use ($logFile) {
        $ts = date('Y-m-d H:i:s');
        @file_put_contents($logFile, "[$ts] [$level] $str\n", FILE_APPEND);
    };

    // Try multiple transport options: SMTPS (465) then STARTTLS (587) then mail()
    $transports = [
        ['secure' => PHPMailer::ENCRYPTION_SMTPS, 'port' => 465, 'desc' => 'SMTPS 465'],
        ['secure' => PHPMailer::ENCRYPTION_STARTTLS, 'port' => 587, 'desc' => 'STARTTLS 587']
    ];

    foreach ($transports as $t) {
        try {
            $mail = new PHPMailer(true);
            $mail->SMTPDebug = 0;
            $mail->Debugoutput = $debugOutput;
            $mail->isSMTP();
            $mail->Host = $smtpHost;
            $mail->SMTPAuth = true;
            $mail->Username = $smtpUser;
            $mail->Password = $smtpPass;
            $mail->SMTPSecure = $t['secure'];
            $mail->Port = $t['port'];

            // Recommended to allow self-signed if provider uses internal certs
            $mail->SMTPOptions = [
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                ]
            ];

            $mail->setFrom($fromEmail, $fromName);
            $mail->addAddress($to, $toName);
            $mail->isHTML(true);
            $mail->CharSet = 'UTF-8';
            $mail->Subject = $subject;
            $mail->Body = $body;
            
            // Add DKIM signing if private key is available
            if ($dkimPrivateKeyFile && file_exists($dkimPrivateKeyFile)) {
                try {
                    $dkimPrivateKey = file_get_contents($dkimPrivateKeyFile);
                    $mail->DKIM_selector = $dkimSelector;
                    $mail->DKIM_identity = $fromEmail;
                    $mail->DKIM_private = $dkimPrivateKey;
                    $mail->DKIM_private_string = $dkimPrivateKey;
                } catch (Exception $dkimErr) {
                    error_log("DKIM setup failed: " . $dkimErr->getMessage());
                }
            }
            
            // Add custom headers to improve Gmail filtering
            $mail->addCustomHeader('List-Unsubscribe', '<mailto:noreply@cybaemtech.in>');
            $mail->addCustomHeader('Precedence', 'bulk');

            $mail->send();
            $result['success'] = true;
            $result['attempts'][] = ['transport' => $t['desc'], 'status' => 'sent'];
            return $result;
        } catch (Exception $e) {
            $err = "Transport {$t['desc']} failed: " . ($mail->ErrorInfo ?? $e->getMessage());
            $debugOutput($err, 'ERROR');
            $result['attempts'][] = ['transport' => $t['desc'], 'status' => 'failed', 'error' => $err];
            // continue to next transport
        }
    }

    // Last resort: try PHP mail() via PHPMailer
    try {
        $mail = new PHPMailer(true);
        $mail->isMail();
        $mail->setFrom($fromEmail, $fromName);
        $mail->addAddress($to, $toName);
        $mail->isHTML(true);
        $mail->CharSet = 'UTF-8';
        $mail->Subject = $subject;
        $mail->Body = $body;
        $mail->send();
        $result['success'] = true;
        $result['attempts'][] = ['transport' => 'mail()', 'status' => 'sent'];
        return $result;
    } catch (Exception $e) {
        $err = 'mail() transport failed: ' . $e->getMessage();
        $debugOutput($err, 'ERROR');
        $result['attempts'][] = ['transport' => 'mail()', 'status' => 'failed', 'error' => $err];
    }

    // All transports failed
    $result['error'] = end($result['attempts'])['error'] ?? 'Unknown error sending mail';
    return $result;
}

?>
