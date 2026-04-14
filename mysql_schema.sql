-- =====================================================
-- MYSQL SCHEMA FOR CPANEL PHPMYADMIN
-- IT Helpdesk Portal Database Schema (Converted from PostgreSQL)
-- =====================================================

-- =====================================================
-- 1. CREATE DATABASE (Run this first)
-- =====================================================
-- CREATE DATABASE IF NOT EXISTS `itsm_helpdesk` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `itsm_helpdesk`;

-- =====================================================
-- 2. CREATE TABLES
-- =====================================================

-- Users table with role-based access control
CREATE TABLE `users` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'user',
    `company_name` VARCHAR(255) NULL,
    `department` VARCHAR(255) NULL,
    `contact_number` VARCHAR(50) NULL,
    `designation` VARCHAR(255) NULL,
    `verification_token` VARCHAR(255) NULL,
    `is_verified` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_users_username` (`username`),
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_verification_token` (`verification_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories for tickets (supports hierarchical structure)
CREATE TABLE `categories` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `parent_id` INT(11) NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tickets table with complete workflow support
CREATE TABLE `tickets` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(500) NOT NULL,
    `description` TEXT NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'open',
    `priority` VARCHAR(50) NOT NULL DEFAULT 'medium',
    `support_type` VARCHAR(50) NOT NULL DEFAULT 'remote',
    `contact_email` VARCHAR(255) NULL,
    `contact_name` VARCHAR(255) NULL,
    `contact_phone` VARCHAR(50) NULL,
    `contact_department` VARCHAR(255) NULL,
    `category_id` INT(11) NOT NULL,
    `subcategory_id` INT(11) NULL,
    `created_by_id` INT(11) NOT NULL,
    `assigned_to_id` INT(11) NULL,
    `due_date` TIMESTAMP NULL,
    `attachment_url` VARCHAR(500) NULL,
    `attachment_name` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`subcategory_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`assigned_to_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_tickets_status` (`status`),
    INDEX `idx_tickets_priority` (`priority`),
    INDEX `idx_tickets_created_by` (`created_by_id`),
    INDEX `idx_tickets_assigned_to` (`assigned_to_id`),
    INDEX `idx_tickets_category` (`category_id`),
    INDEX `idx_tickets_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comments on tickets
CREATE TABLE `comments` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `ticket_id` INT(11) NOT NULL,
    `user_id` INT(11) NOT NULL,
    `content` TEXT NOT NULL,
    `is_internal` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
    INDEX `idx_comments_ticket` (`ticket_id`),
    INDEX `idx_comments_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FAQs for knowledge base
CREATE TABLE `faqs` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `question` VARCHAR(500) NOT NULL,
    `answer` TEXT NOT NULL,
    `category_id` INT(11) NULL,
    `view_count` INT(11) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
    INDEX `idx_faqs_category` (`category_id`),
    INDEX `idx_faqs_view_count` (`view_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chatbot messages for persistent chat history
CREATE TABLE `chat_messages` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `user_id` INT(11) NOT NULL,
    `message` TEXT NOT NULL,
    `is_from_bot` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
    INDEX `idx_chat_messages_user` (`user_id`),
    INDEX `idx_chat_messages_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Journey Templates/Types
CREATE TABLE `journey_templates` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `color` VARCHAR(20) DEFAULT '#3B82F6',
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Journeys (instances of templates)
CREATE TABLE `user_journeys` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `template_id` INT(11) NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `version` VARCHAR(50) DEFAULT '1.0',
    `status` VARCHAR(50) NOT NULL DEFAULT 'draft',
    `personas` JSON NULL,
    `prerequisites` TEXT NULL,
    `entry_points` JSON NULL,
    `success_criteria` TEXT NULL,
    `pain_points` TEXT NULL,
    `improvement_notes` TEXT NULL,
    `created_by_id` INT(11) NOT NULL,
    `last_updated_by_id` INT(11) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`template_id`) REFERENCES `journey_templates`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
    FOREIGN KEY (`last_updated_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_user_journeys_status` (`status`),
    INDEX `idx_user_journeys_created_by` (`created_by_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Journey Steps (the actual workflow steps)
CREATE TABLE `journey_steps` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `journey_id` INT(11) NOT NULL,
    `step_number` INT(11) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `user_actions` JSON NULL,
    `system_responses` JSON NULL,
    `expected_outcomes` JSON NULL,
    `error_scenarios` JSON NULL,
    `screenshot_placeholder` VARCHAR(500) NULL,
    `notes` TEXT NULL,
    `is_optional` BOOLEAN DEFAULT FALSE,
    `estimated_duration` VARCHAR(100) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`journey_id`) REFERENCES `user_journeys`(`id`) ON DELETE CASCADE,
    INDEX `idx_journey_steps_journey` (`journey_id`),
    INDEX `idx_journey_steps_number` (`step_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comments and collaboration on journeys
CREATE TABLE `journey_comments` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `journey_id` INT(11) NULL,
    `step_id` INT(11) NULL,
    `user_id` INT(11) NOT NULL,
    `content` TEXT NOT NULL,
    `type` VARCHAR(50) DEFAULT 'comment',
    `is_resolved` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`journey_id`) REFERENCES `user_journeys`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`step_id`) REFERENCES `journey_steps`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Journey exports/shares
CREATE TABLE `journey_exports` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `journey_id` INT(11) NOT NULL,
    `export_type` VARCHAR(50) NOT NULL,
    `export_data` JSON NULL,
    `share_token` VARCHAR(255) NULL,
    `expires_at` TIMESTAMP NULL,
    `created_by_id` INT(11) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`journey_id`) REFERENCES `user_journeys`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Session table for PHP sessions
CREATE TABLE `sessions` (
    `session_id` VARCHAR(128) NOT NULL,
    `session_data` TEXT NOT NULL,
    `expires` INT(11) NOT NULL,
    PRIMARY KEY (`session_id`),
    INDEX `idx_sessions_expires` (`expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Allowed domains for company registration restriction
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

-- =====================================================
-- 3. INSERT DEMO DATA
-- =====================================================

-- Insert demo users (passwords are hashed for: admin123, agent123, user123)
INSERT INTO `users` (`username`, `password`, `name`, `email`, `role`, `company_name`, `department`, `contact_number`, `designation`, `is_verified`) VALUES
('admin', '$2b$10$af0vnH5V.fzyiq1sF1FFe.Z.yrJGT3MxTnR5U1fih7yc9LbZNb0.S', 'Admin User', 'admin@company.com', 'admin', 'Tech Corp', 'IT', '+1-555-0001', 'System Administrator', 1),
('agent', '$2b$10$1OtfRyQzC2mKVM1OFSN3M.LapbKF/mBXDOs9BiYKYMLq2qfh7c/Re', 'Agent User', 'agent@company.com', 'agent', 'Tech Corp', 'IT Support', '+1-555-0002', 'Support Specialist', 1),
('user', '$2b$10$39XQvg6mMgn/PyiHmJrMg.9uAtmbQ1kZPoo0aqBO3sjLvTyRc6Qta', 'Regular User', 'user@company.com', 'user', 'Tech Corp', 'Marketing', '+1-555-0003', 'Marketing Manager', 1),
('john.doe', '$2b$10$6Xq3h8c2Z1.T7Q9w3V5h1OjY4S8N6Z2K1L3M4B5.C6D7E8F9G0H1I2J3', 'John Doe', 'john.doe@company.com', 'user', 'Tech Corp', 'Sales', '+1-555-0004', 'Sales Representative', 1),
('jane.smith', '$2b$10$6Xq3h8c2Z1.T7Q9w3V5h1OjY4S8N6Z2K1L3M4B5.C6D7E8F9G0H1I2J3', 'Jane Smith', 'jane.smith@company.com', 'agent', 'Tech Corp', 'IT Support', '+1-555-0005', 'Senior Support Analyst', 1);

-- Insert categories and subcategories
INSERT INTO `categories` (`name`, `parent_id`) VALUES
('Network Issues', NULL),
('Hardware Problems', NULL),
('Software Issues', NULL),
('Account & Access', NULL),
('Security', NULL),
('Wi-Fi Connection', 1),
('VPN Issues', 1),
('Internet Connectivity', 1),
('Network Printing', 1),
('Printer Problems', 2),
('Computer Hardware', 2),
('Mobile Devices', 2),
('Peripherals', 2),
('Application Crashes', 3),
('Installation Issues', 3),
('Operating System', 3),
('Updates & Patches', 3),
('Password Reset', 4),
('User Permissions', 4),
('Account Lockout', 4),
('New User Setup', 4),
('Antivirus Issues', 5),
('Firewall Problems', 5),
('Phishing Reports', 5),
('Data Backup', 5);

-- Insert sample tickets
INSERT INTO `tickets` (`title`, `description`, `status`, `priority`, `category_id`, `subcategory_id`, `created_by_id`, `assigned_to_id`) VALUES
('Cannot connect to Wi-Fi', 'Unable to connect to office Wi-Fi network. Getting authentication error when trying to connect.', 'open', 'high', 1, 6, 4, 2),
('Printer not working', 'Office printer on 2nd floor is not responding. Red light is blinking constantly.', 'in_progress', 'medium', 2, 10, 3, 2),
('Email application crashes', 'Outlook keeps crashing when trying to send emails with large attachments over 10MB.', 'resolved', 'low', 3, 14, 4, 5),
('VPN connection timeout', 'VPN connection keeps timing out after 30 minutes of inactivity.', 'open', 'medium', 1, 7, 3, 2),
('Password reset request', 'Need password reset for domain account. Cannot login to workstation.', 'resolved', 'high', 4, 18, 4, 5);

-- Insert sample FAQs
INSERT INTO `faqs` (`question`, `answer`, `category_id`, `view_count`) VALUES
('How do I connect to the company Wi-Fi?', 'Go to Settings > Wi-Fi > Select "CompanyWiFi" > Enter your domain credentials (username and password)', 1, 45),
('How do I reset my password?', 'Contact your system administrator through the helpdesk portal or call the IT support line at ext. 1234', 4, 67),
('What should I do if my computer won''t start?', 'Check power cable connection, try a different power outlet, ensure power button is pressed firmly. If issue persists, contact IT support.', 2, 23),
('How do I install new software?', 'Submit a software installation request ticket through the portal. Admin approval may be required for licensed software.', 3, 34),
('How do I access company VPN?', 'Download the company VPN client from the IT portal, use your domain credentials to connect. Contact IT if you need the installation file.', 1, 56);

-- Insert sample allowed domains
INSERT INTO `allowed_domains` (`domain`, `company_name`, `description`, `created_by_id`) VALUES
('cybaemtech.com', 'Cybaemtech Corporation', 'Main company domain for all employees', 1),
('cybaemtech.in', 'Cybaemtech India', 'Indian subsidiary domain', 1),
('contractor.cybaemtech.com', 'Cybaemtech Contractors', 'Domain for authorized contractors and partners', 1),
('techcorp.com', 'Tech Corp Ltd', 'Client company - Tech Corp employees', 1),
('partner.com', 'Partner Organization', 'Approved partner organization access', 1);

-- =====================================================
-- 4. CREATE VIEWS FOR REPORTS
-- =====================================================

-- View for tickets with user and category information
CREATE VIEW `tickets_with_details` AS
SELECT 
    t.*,
    c.name as category_name,
    sc.name as subcategory_name,
    cb.name as created_by_name,
    cb.email as created_by_email,
    at.name as assigned_to_name,
    at.email as assigned_to_email
FROM tickets t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN categories sc ON t.subcategory_id = sc.id
LEFT JOIN users cb ON t.created_by_id = cb.id
LEFT JOIN users at ON t.assigned_to_id = at.id;

-- View for dashboard statistics
CREATE VIEW `dashboard_stats` AS
SELECT 
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tickets,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets,
    AVG(CASE WHEN status IN ('resolved', 'closed') 
        THEN TIMESTAMPDIFF(HOUR, created_at, updated_at)
        END) as avg_resolution_hours
FROM tickets;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Your MySQL database is now ready for cPanel hosting!
-- Demo credentials: admin/admin123, agent/agent123, user/user123

-- =====================================================
-- Project bug reports table
-- Added to support the Bug Review feature (matches existing users.id INT(11) type)
-- Use DROP TABLE IF EXISTS before running in phpMyAdmin if an earlier failed attempt exists.
CREATE TABLE `project_bug_reports` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `comment` TEXT NOT NULL,
    `created_by` INT(11) DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `resolution_status` VARCHAR(32) NOT NULL DEFAULT 'not-resolved',
    `screenshot_path` VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_project_bug_reports_created_by` (`created_by`),
    CONSTRAINT `fk_project_bug_reports_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;