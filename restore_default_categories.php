<?php
/**
 * Script to restore default categories
 */

// Allow running from CLI
$_SERVER['HTTP_ORIGIN'] = 'http://localhost:5173';
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['CONTENT_TYPE'] = 'application/json';

// Include the categories API file
require_once __DIR__ . '/php/api/categories.php';

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

foreach ($categories as $category) {
    // Create parent category
    $request = ['name' => $category['name']];
    $_POST = $request;
    
    ob_start();
    handleCreateCategory($request);
    $response = ob_get_clean();
    $parentCategory = json_decode($response, true);
    
    if (isset($parentCategory['id'])) {
        // Create subcategories
        foreach ($category['subcategories'] as $subName) {
            $request = [
                'name' => $subName,
                'parentId' => $parentCategory['id']
            ];
            $_POST = $request;
            
            ob_start();
            handleCreateCategory($request);
            ob_get_clean();
        }
    }
}

echo "Categories restored successfully!\n";
?>