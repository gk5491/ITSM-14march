<?php
// Mock session for shivam (admin)
session_id('test_shivam_session');
session_start();
$_SESSION['user_id'] = 47;
$_SESSION['user_role'] = 'admin,agent';
$_SESSION['user_email'] = 'shivam.jagtap@cybaemtech.com';

// Mock GET params
$_GET['filter'] = 'all';

// Capture output of handleGetTickets
require_once 'php/api/tickets.php';

// Note: handleGetTickets calls jsonResponse which exits.
// Since we are running in CLI, we might need a different approach to test.
// But we just want to see if the SQL works and returns rows.

$db = getDb();
$sql = "
    SELECT 
        t.*,
        c.name as category_name,
        sc.name as subcategory_name,
        cb.name as created_by_name,
        cb.email as created_by_email,
        cb.contact_number as created_by_contact_number,
        at.name as assigned_to_name,
        at.email as assigned_to_email
    FROM tickets t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN categories sc ON t.subcategory_id = sc.id
    LEFT JOIN users cb ON t.created_by_id = cb.id
    LEFT JOIN users at ON t.assigned_to_id = at.id
    WHERE 1=1
";
$tickets = $db->fetchAll($sql);
echo "Total tickets query result: " . count($tickets) . "\n";
if (count($tickets) > 0) {
    echo "First ticket title: " . $tickets[0]['title'] . "\n";
}
?>
