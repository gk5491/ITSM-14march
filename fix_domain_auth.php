<?php
/**
 * Fix Domain Authorization for Login
 */

// Include the necessary files
require_once 'php/config/database.php';

echo "<h1>🔧 Fixing Domain Authorization Issue</h1>";

try {
    $db = getDb();
    
    // Check if allowed_domains table exists
    echo "<h2>1. Checking allowed_domains table...</h2>";
    $tableExists = $db->fetchOne("SHOW TABLES LIKE 'allowed_domains'");
    
    if (!$tableExists) {
        echo "<p style='color: orange;'>⚠️ allowed_domains table does not exist. Creating it...</p>";
        
        // Create the allowed_domains table
        $createTable = "
        CREATE TABLE allowed_domains (
            id INT AUTO_INCREMENT PRIMARY KEY,
            domain VARCHAR(255) NOT NULL UNIQUE,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )";
        
        $db->query($createTable);
        echo "<p style='color: green;'>✅ allowed_domains table created successfully!</p>";
    } else {
        echo "<p style='color: green;'>✅ allowed_domains table exists.</p>";
    }
    
    // Check current allowed domains
    echo "<h2>2. Current allowed domains:</h2>";
    $domains = $db->fetchAll("SELECT * FROM allowed_domains");
    
    if (empty($domains)) {
        echo "<p style='color: orange;'>⚠️ No domains found in allowed_domains table.</p>";
    } else {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr style='background: #f0f0f0;'><th>ID</th><th>Domain</th><th>Active</th><th>Created</th></tr>";
        foreach ($domains as $domain) {
            $status = $domain['is_active'] ? '✅ Active' : '❌ Inactive';
            echo "<tr>";
            echo "<td>" . htmlspecialchars($domain['id']) . "</td>";
            echo "<td>" . htmlspecialchars($domain['domain']) . "</td>";
            echo "<td>" . $status . "</td>";
            echo "<td>" . htmlspecialchars($domain['created_at']) . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
    // Add logenix.in domain if not exists
    echo "<h2>3. Adding logenix.in domain...</h2>";
    $existingDomain = $db->fetchOne("SELECT * FROM allowed_domains WHERE domain = ?", ['logenix.in']);
    
    if ($existingDomain) {
        if ($existingDomain['is_active']) {
            echo "<p style='color: green;'>✅ logenix.in is already allowed and active.</p>";
        } else {
            // Activate the domain
            $db->query("UPDATE allowed_domains SET is_active = 1 WHERE domain = ?", ['logenix.in']);
            echo "<p style='color: green;'>✅ logenix.in domain activated!</p>";
        }
    } else {
        // Insert the domain
        $db->insert('allowed_domains', [
            'domain' => 'logenix.in',
            'is_active' => 1
        ]);
        echo "<p style='color: green;'>✅ logenix.in domain added to allowed list!</p>";
    }
    
    // Also add cybaemtech.in for good measure
    echo "<h2>4. Adding cybaemtech.in domain...</h2>";
    $existingCybaem = $db->fetchOne("SELECT * FROM allowed_domains WHERE domain = ?", ['cybaemtech.in']);
    
    if (!$existingCybaem) {
        $db->insert('allowed_domains', [
            'domain' => 'cybaemtech.in',
            'is_active' => 1
        ]);
        echo "<p style='color: green;'>✅ cybaemtech.in domain added to allowed list!</p>";
    } else {
        echo "<p style='color: green;'>✅ cybaemtech.in already exists.</p>";
    }
    
    // Show final status
    echo "<h2>5. Final allowed domains list:</h2>";
    $finalDomains = $db->fetchAll("SELECT * FROM allowed_domains WHERE is_active = 1");
    
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr style='background: #e8f5e8;'><th>Domain</th><th>Status</th><th>Added</th></tr>";
    foreach ($finalDomains as $domain) {
        echo "<tr>";
        echo "<td>" . htmlspecialchars($domain['domain']) . "</td>";
        echo "<td style='color: green;'>✅ Active</td>";
        echo "<td>" . htmlspecialchars($domain['created_at']) . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    echo "<hr>";
    echo "<div style='background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 12px; border-radius: 5px; margin-top: 20px;'>";
    echo "<h3>✅ Domain Authorization Fixed!</h3>";
    echo "<p>The user with email <strong>HiteshITsupport@logenix.in</strong> should now be able to login successfully.</p>";
    echo "<p><strong>Username:</strong> hitesh</p>";
    echo "<p><strong>Domain:</strong> logenix.in (now authorized)</p>";
    echo "</div>";
    
} catch (Exception $e) {
    echo "<div style='background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 12px; border-radius: 5px;'>";
    echo "<h3>❌ Error occurred:</h3>";
    echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
    echo "</div>";
    
    echo "<h3>Alternative Solution:</h3>";
    echo "<p>If the database connection fails, you can manually disable domain checking by modifying the auth.php file.</p>";
}
?>