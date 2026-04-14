<?php
session_start();
if (!isset($_SESSION['test_counter'])) {
    $_SESSION['test_counter'] = 0;
}
$_SESSION['test_counter']++;
echo "Session counter: " . $_SESSION['test_counter'] . "\n";
echo "Session ID: " . session_id() . "\n";
echo "Session save path: " . session_save_path() . "\n";
if (is_writable(session_save_path())) {
    echo "Session save path is WRITABLE\n";
} else {
    echo "Session save path is NOT WRITABLE\n";
}
?>
