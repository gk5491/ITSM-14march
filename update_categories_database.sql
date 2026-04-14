-- =====================================================
-- Update Categories and Subcategories Database
-- Run this to match frontend category structure
-- =====================================================

-- Clear existing categories (be careful in production!)
-- DELETE FROM categories WHERE 1=1;

-- Or better approach: Update existing categories to match new structure
-- First, let's see what we have
SELECT 'Current categories before update:' as status;
SELECT * FROM categories ORDER BY id;

-- Insert/Update main categories with specific IDs
INSERT INTO categories (id, name, parent_id, description, created_at) VALUES
(1, 'Hardware', NULL, 'Physical computer components and devices', NOW()),
(2, 'Software', NULL, 'Software applications and programs', NOW()),
(3, 'Network & Connectivity', NULL, 'Network and internet connectivity issues', NOW()),
(4, 'Domain', NULL, 'Domain, accounts and permissions management', NOW())
ON DUPLICATE KEY UPDATE 
name = VALUES(name),
description = VALUES(description),
updated_at = NOW();

-- Insert Hardware subcategories (101-111)
INSERT INTO categories (id, name, parent_id, description, created_at) VALUES
(101, 'Desktop', 1, 'Desktop computer issues', NOW()),
(102, 'Laptops', 1, 'Laptop computer issues', NOW()),
(103, 'Servers', 1, 'Server hardware problems', NOW()),
(104, 'Network Equipment', 1, 'Routers, switches, and network hardware', NOW()),
(105, 'Printers', 1, 'Printer hardware issues', NOW()),
(106, 'Mouse', 1, 'Computer mouse problems', NOW()),
(107, 'Monitor', 1, 'Display and monitor issues', NOW()),
(108, 'Keyboard', 1, 'Keyboard hardware problems', NOW()),
(109, 'Cables', 1, 'Cable connectivity issues', NOW()),
(110, 'Solid Drive', 1, 'SSD storage device issues', NOW()),
(111, 'Hard Drive', 1, 'HDD storage device issues', NOW())
ON DUPLICATE KEY UPDATE 
name = VALUES(name),
description = VALUES(description),
updated_at = NOW();

-- Insert Software subcategories (201-206)
INSERT INTO categories (id, name, parent_id, description, created_at) VALUES
(201, 'Antivirus', 2, 'Antivirus software issues', NOW()),
(202, 'AutoCAD', 2, 'AutoCAD application problems', NOW()),
(203, 'O365', 2, 'Microsoft Office 365 issues', NOW()),
(204, 'VPN', 2, 'VPN software problems', NOW()),
(205, 'Remote Software', 2, 'Remote access software issues', NOW()),
(206, 'Outlook', 2, 'Microsoft Outlook problems', NOW())
ON DUPLICATE KEY UPDATE 
name = VALUES(name),
description = VALUES(description),
updated_at = NOW();

-- Insert Network & Connectivity subcategories (301-305)
INSERT INTO categories (id, name, parent_id, description, created_at) VALUES
(301, 'LAN', 3, 'Local Area Network issues', NOW()),
(302, 'VPN/Remote Access', 3, 'VPN and remote access connectivity', NOW()),
(303, 'WiFi', 3, 'Wireless network problems', NOW()),
(304, 'Internet Connectivity', 3, 'Internet connection issues', NOW()),
(305, 'Server access', 3, 'Server connectivity problems', NOW())
ON DUPLICATE KEY UPDATE 
name = VALUES(name),
description = VALUES(description),
updated_at = NOW();

-- Insert Domain subcategories (401-406)
INSERT INTO categories (id, name, parent_id, description, created_at) VALUES
(401, 'Password Reset', 4, 'Password reset requests', NOW()),
(402, 'New Account Setup', 4, 'New user account creation', NOW()),
(403, 'Permissions Change', 4, 'User permission modifications', NOW()),
(404, 'MFA Issues', 4, 'Multi-factor authentication problems', NOW()),
(405, 'Update Policy', 4, 'Policy update requests', NOW()),
(406, 'System Configuration', 4, 'System configuration changes', NOW())
ON DUPLICATE KEY UPDATE 
name = VALUES(name),
description = VALUES(description),
updated_at = NOW();

-- Verify the updates
SELECT 'Updated categories structure:' as status;
SELECT 
    c.id,
    c.name,
    CASE 
        WHEN c.parent_id IS NULL THEN 'MAIN CATEGORY'
        ELSE CONCAT('Subcategory of: ', p.name)
    END as type,
    c.description
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id
ORDER BY 
    CASE WHEN c.parent_id IS NULL THEN c.id ELSE c.parent_id END,
    c.parent_id,
    c.id;

-- Count check
SELECT 'Category counts:' as status;
SELECT 
    CASE WHEN parent_id IS NULL THEN 'Main Categories' ELSE 'Subcategories' END as type,
    COUNT(*) as count
FROM categories
GROUP BY CASE WHEN parent_id IS NULL THEN 'Main Categories' ELSE 'Subcategories' END;

SELECT 'Database update completed successfully!' as status;