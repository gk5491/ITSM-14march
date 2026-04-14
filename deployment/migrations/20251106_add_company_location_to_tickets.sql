-- Migration: Add company_name and location to tickets table
-- Date: 2025-11-06
-- Apply this in phpMyAdmin or MySQL client. Make sure you have a DB backup before running.

-- 1) Add columns with safe defaults so existing rows are valid
ALTER TABLE `tickets`
  ADD COLUMN `company_name` VARCHAR(255) NOT NULL DEFAULT '' AFTER `contact_department`,
  ADD COLUMN `location` VARCHAR(255) NOT NULL DEFAULT '' AFTER `company_name`;

-- 2) (Optional) If you want to add indexes for faster queries by company_name or location:
-- CREATE INDEX idx_tickets_company_name ON tickets(company_name);
-- CREATE INDEX idx_tickets_location ON tickets(location);

-- Rollback (to revert the migration):
-- ALTER TABLE `tickets` DROP COLUMN `location`, DROP COLUMN `company_name`;

-- Notes:
-- - This migration sets empty string as default to avoid breaking existing inserts that don't supply these fields.
-- - After deploying code that requires companyName and location in the application, consider updating records to meaningful values where available.
-- - If you prefer NULLable columns instead, modify the ALTER statement to allow NULL and remove NOT NULL/default.
