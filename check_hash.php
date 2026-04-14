<?php
$hash = '$2y$10$R3FtlmSo93Kv3qzUWAHLlO1DtrUrd6Vhbt47my3NeP9InG3mt0.TO';
$common = ['password123', 'admin123', 'agent123', 'user123', '123456', 'password', 'welcome123', 'itsm123', 'rohan123', 'Rohan123', 'rohan@123', 'Rohan@123'];
foreach ($common as $p) {
    if (password_verify($p, $hash)) {
        echo "Match found: " . $p;
        exit;
    }
}
echo "No common match found";
?>
