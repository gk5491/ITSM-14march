<?php
require_once 'php/config/database.php';

// Set appropriate headers
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="itsm_backup_' . date('Y-m-d_H-i-s') . '.sql"');

try {
    $db = getDb();
    $tables = $db->fetchAll("SHOW TABLES");
    
    $output = "-- ITSM Helpdesk Backup - " . date('Y-m-d H:i:s') . "\n\n";
    
    foreach ($tables as $table) {
        $tableName = array_values($table)[0];
        
        // Get create table syntax
        $createTable = $db->fetchOne("SHOW CREATE TABLE `$tableName`");
        $output .= "\n\n" . $createTable['Create Table'] . ";\n\n";
        
        // Get table data
        $rows = $db->fetchAll("SELECT * FROM `$tableName`");
        foreach ($rows as $row) {
            $values = array_map(function($value) {
                if ($value === null) return 'NULL';
                return "'" . addslashes($value) . "'";
            }, $row);
            
            $output .= "INSERT INTO `$tableName` VALUES (" . implode(",", $values) . ");\n";
        }
    }
    
    echo $output;
    
} catch (Exception $e) {
    die("Backup failed: " . $e->getMessage());
}
?>