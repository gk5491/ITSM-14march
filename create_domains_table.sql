-- =====================================================
-- QUICK FIX: Create allowed_domains table
-- Run this in phpMyAdmin to fix the domains API 500 error
-- =====================================================

-- Create the allowed_domains table
CREATE TABLE `allowed_domains` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `domain` VARCHAR(255) NOT NULL UNIQUE,
    `company_name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_by_id` INT(11) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
    INDEX `idx_allowed_domains_domain` (`domain`),
    INDEX `idx_allowed_domains_active` (`is_active`),
    INDEX `idx_allowed_domains_created_by` (`created_by_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample allowed domains
INSERT INTO `allowed_domains` (`domain`, `company_name`, `description`, `created_by_id`) VALUES
('cybaemtech.com', 'Cybaemtech Corporation', 'Main company domain for all employees', 1),
('cybaemtech.in', 'Cybaemtech India', 'Indian subsidiary domain', 1),
('gmail.com', 'Gmail Users', 'Temporary access for testing purposes', 1),
('outlook.com', 'Outlook Users', 'Microsoft email users', 1);

-- Verify the table was created successfully
SELECT 'allowed_domains table created successfully!' as status;
SELECT COUNT(*) as domain_count FROM `allowed_domains`;
SELECT * FROM `allowed_domains`;