<?php
require_once __DIR__ . '/php/config/database.php';

$categories = [
    ["name" => "Hardware", "subcategories" => [
        "Desktop", "Laptops", "Servers", "Network Equipment", "Printers", 
        "Mouse", "Monitor", "Keyboard", "Cables", "Solid Drive", "Hard Drive"
    ]],
    ["name" => "Software", "subcategories" => [
        "Antivirus", "AutoCAD", "O365", "VPN", "Remote Software", "Outlook"
    ]],
    ["name" => "Network & Connectivity", "subcategories" => [
        "LAN", "VPN/Remote Access", "WiFi", "Internet Connectivity", "Server access"
    ]],
    ["name" => "Domain", "subcategories" => [
        "Password Reset", "New Account Setup", "Permissions Change", "MFA Issues",
        "Update Policy", "System Configuration"
    ]]
];

$db = getDb();

foreach ($categories as $category) {
    // Create main category
    $categoryId = $db->insert('categories', [
        'name' => $category['name'],
        'parent_id' => null
    ]);
    
    if ($categoryId) {
        // Create subcategories
        foreach ($category['subcategories'] as $subName) {
            $db->insert('categories', [
                'name' => $subName,
                'parent_id' => $categoryId
            ]);
        }
    }
}

echo "Categories restored successfully!\n";
?>