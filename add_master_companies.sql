-- Add master company list to allowed_domains table
-- These companies will be available in the Company Name filter dropdown

-- Insert companies (using created_by_id = 1 which should be the admin user)
INSERT INTO `allowed_domains` (`domain`, `company_name`, `description`, `created_by_id`, `is_active`) VALUES
('creativveconstructiions.com', 'Creativve Constructiions', 'Construction company', 1, 1),
('denasa.com', 'Denasa Buildcon', 'Building and construction services', 1, 1),
('designcurve.com', 'Designcurve Technologies Pvt. Ltd.', 'Technology services provider', 1, 1),
('sarthakindia.com', 'Sarthak India', 'Indian business services', 1, 1),
('satellitebuildcon.com', 'Satellite Buildcon', 'Construction and infrastructure', 1, 1),
('logenix.com', 'LOGENIX SERVICES PRIVATE LIMITED', 'Logistics services', 1, 1),
('vevrapackaging.com', 'Vevra Packaging Pvt. Ltd.', 'Packaging solutions provider', 1, 1),
('abninterarch.com', 'ABN Interarch Pvt. LTD', 'Architecture and interior design', 1, 1),
('harshalbuildcon.com', 'Harshal Buildcon LLP', 'Construction partnership', 1, 1),
('shramajivischool.com', 'Shramajivi High School', 'Educational institution', 1, 1)
ON DUPLICATE KEY UPDATE 
    company_name = VALUES(company_name), 
    description = VALUES(description),
    is_active = 1;

-- Note: You can run this SQL script in phpMyAdmin or MySQL client to add these companies.
-- After running this script, the companies will be available in the Company Name dropdown.
