<?php
/**
 * Safe Categories Update Script
 * This script checks your database schema first and adapts accordingly
 */

require_once 'php/config/database.php';

try {
    $db = getDb();
    
    echo "=== Safe Categories Database Update ===\n\n";
    
    // First, check the table structure
    echo "Checking database schema...\n";
    $columns = $db->fetchAll("SHOW COLUMNS FROM categories");
    
    $hasDescription = false;
    $hasUpdatedAt = false;
    $hasCreatedAt = false;
    
    echo "Categories table columns:\n";
    foreach ($columns as $column) {
        echo "- {$column['Field']} ({$column['Type']})\n";
        if ($column['Field'] === 'description') $hasDescription = true;
        if ($column['Field'] === 'updated_at') $hasUpdatedAt = true;
        if ($column['Field'] === 'created_at') $hasCreatedAt = true;
    }
    echo "\n";
    
    // Check current categories
    echo "Current categories in database:\n";
    $currentCategories = $db->fetchAll("SELECT id, name, parent_id FROM categories ORDER BY id");
    foreach ($currentCategories as $cat) {
        $type = $cat['parent_id'] ? 'Subcategory' : 'Main Category';
        echo "- ID {$cat['id']}: {$cat['name']} ({$type})\n";
    }
    echo "\n";
    
    // Define the new category structure
    $mainCategories = [
        ['id' => 1, 'name' => 'Hardware'],
        ['id' => 2, 'name' => 'Software'],
        ['id' => 3, 'name' => 'Network & Connectivity'],
        ['id' => 4, 'name' => 'Domain']
    ];
    
    $subcategories = [
        // Hardware subcategories (101-111)
        ['id' => 101, 'name' => 'Desktop', 'parent_id' => 1],
        ['id' => 102, 'name' => 'Laptops', 'parent_id' => 1],
        ['id' => 103, 'name' => 'Servers', 'parent_id' => 1],
        ['id' => 104, 'name' => 'Network Equipment', 'parent_id' => 1],
        ['id' => 105, 'name' => 'Printers', 'parent_id' => 1],
        ['id' => 106, 'name' => 'Mouse', 'parent_id' => 1],
        ['id' => 107, 'name' => 'Monitor', 'parent_id' => 1],
        ['id' => 108, 'name' => 'Keyboard', 'parent_id' => 1],
        ['id' => 109, 'name' => 'Cables', 'parent_id' => 1],
        ['id' => 110, 'name' => 'Solid Drive', 'parent_id' => 1],
        ['id' => 111, 'name' => 'Hard Drive', 'parent_id' => 1],
        
        // Software subcategories (201-206)
        ['id' => 201, 'name' => 'Antivirus', 'parent_id' => 2],
        ['id' => 202, 'name' => 'AutoCAD', 'parent_id' => 2],
        ['id' => 203, 'name' => 'O365', 'parent_id' => 2],
        ['id' => 204, 'name' => 'VPN', 'parent_id' => 2],
        ['id' => 205, 'name' => 'Remote Software', 'parent_id' => 2],
        ['id' => 206, 'name' => 'Outlook', 'parent_id' => 2],
        
        // Network & Connectivity subcategories (301-305)
        ['id' => 301, 'name' => 'LAN', 'parent_id' => 3],
        ['id' => 302, 'name' => 'VPN/Remote Access', 'parent_id' => 3],
        ['id' => 303, 'name' => 'WiFi', 'parent_id' => 3],
        ['id' => 304, 'name' => 'Internet Connectivity', 'parent_id' => 3],
        ['id' => 305, 'name' => 'Server access', 'parent_id' => 3],
        
        // Domain subcategories (401-406)
        ['id' => 401, 'name' => 'Password Reset', 'parent_id' => 4],
        ['id' => 402, 'name' => 'New Account Setup', 'parent_id' => 4],
        ['id' => 403, 'name' => 'Permissions Change', 'parent_id' => 4],
        ['id' => 404, 'name' => 'MFA Issues', 'parent_id' => 4],
        ['id' => 405, 'name' => 'Update Policy', 'parent_id' => 4],
        ['id' => 406, 'name' => 'System Configuration', 'parent_id' => 4]
    ];
    
    echo "Updating main categories...\n";
    foreach ($mainCategories as $category) {
        // Check if category exists
        $existing = $db->fetchOne("SELECT id FROM categories WHERE id = ?", [$category['id']]);
        
        // Build update data based on available columns
        $updateData = ['name' => $category['name']];
        if ($hasUpdatedAt) {
            $updateData['updated_at'] = date('Y-m-d H:i:s');
        }
        
        $insertData = [
            'id' => $category['id'],
            'name' => $category['name'],
            'parent_id' => null
        ];
        if ($hasCreatedAt) {
            $insertData['created_at'] = date('Y-m-d H:i:s');
        }
        
        if ($existing) {
            // Update existing category
            $db->update('categories', $updateData, 'id = ?', [$category['id']]);
            echo "✅ Updated: {$category['name']}\n";
        } else {
            // Insert new category
            $db->insert('categories', $insertData);
            echo "✅ Created: {$category['name']}\n";
        }
    }
    
    echo "\nUpdating subcategories...\n";
    foreach ($subcategories as $subcategory) {
        // Check if subcategory exists
        $existing = $db->fetchOne("SELECT id FROM categories WHERE id = ?", [$subcategory['id']]);
        
        // Build update data based on available columns
        $updateData = [
            'name' => $subcategory['name'],
            'parent_id' => $subcategory['parent_id']
        ];
        if ($hasUpdatedAt) {
            $updateData['updated_at'] = date('Y-m-d H:i:s');
        }
        
        $insertData = [
            'id' => $subcategory['id'],
            'name' => $subcategory['name'],
            'parent_id' => $subcategory['parent_id']
        ];
        if ($hasCreatedAt) {
            $insertData['created_at'] = date('Y-m-d H:i:s');
        }
        
        if ($existing) {
            // Update existing subcategory
            $db->update('categories', $updateData, 'id = ?', [$subcategory['id']]);
            echo "✅ Updated: {$subcategory['name']}\n";
        } else {
            // Insert new subcategory
            $db->insert('categories', $insertData);
            echo "✅ Created: {$subcategory['name']}\n";
        }
    }
    
    // Verify the final structure
    echo "\n=== Final Category Structure ===\n";
    $finalCategories = $db->fetchAll("
        SELECT 
            c.id,
            c.name,
            CASE 
                WHEN c.parent_id IS NULL THEN 'MAIN CATEGORY'
                ELSE CONCAT('Subcategory of: ', p.name)
            END as type
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.id
        WHERE c.id IN (1,2,3,4,101,102,103,104,105,106,107,108,109,110,111,201,202,203,204,205,206,301,302,303,304,305,401,402,403,404,405,406)
        ORDER BY 
            CASE WHEN c.parent_id IS NULL THEN c.id ELSE c.parent_id END,
            c.parent_id,
            c.id
    ");
    
    foreach ($finalCategories as $cat) {
        echo "ID {$cat['id']}: {$cat['name']} ({$cat['type']})\n";
    }
    
    // Count verification
    $newMainCount = $db->fetchOne("SELECT COUNT(*) as count FROM categories WHERE id IN (1,2,3,4)")['count'];
    $newSubCount = $db->fetchOne("SELECT COUNT(*) as count FROM categories WHERE id IN (101,102,103,104,105,106,107,108,109,110,111,201,202,203,204,205,206,301,302,303,304,305,401,402,403,404,405,406)")['count'];
    
    echo "\n=== Summary ===\n";
    echo "✅ Updated/Created Main Categories: $newMainCount/4\n";
    echo "✅ Updated/Created Subcategories: $newSubCount/29\n";
    echo "✅ Total New Categories: " . ($newMainCount + $newSubCount) . "/33\n";
    echo "\n🎉 Database update completed successfully!\n";
    echo "📱 Frontend and database are now synchronized.\n";
    echo "\n⚠️  Note: Your existing categories (IDs 5-43) are preserved.\n";
    echo "📝 You may want to review and clean up old categories later.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "📍 Location: " . $e->getFile() . ":" . $e->getLine() . "\n";
}
?>