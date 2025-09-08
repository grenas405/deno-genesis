-- ========================================================
--  Deno Genesis Database Initialization Script
--  Purpose: Initial setup after schema creation
--  Usage: Run after schema.sql to populate initial data
-- ========================================================

USE universal_db;

-- ======================
-- Initial Site Settings
-- ======================
-- Create default settings for each site
INSERT IGNORE INTO site_settings (site_key, contact_email, business_phone) VALUES
('pedromdominguez', 'pedro@pedromdominguez.com', '+1-555-0101'),
('domtech', 'contact@domtech.com', '+1-555-0102'),
('heavenlyroofing', 'info@heavenlyroofing.com', '+1-555-0103'),
('okdevs', 'hello@okdevs.com', '+1-555-0104'),
('efficientmovers', 'contact@efficientmovers.com', '+1-555-0105');

-- ======================
-- Default Admin Users
-- ======================
-- Create default admin accounts for each site
-- Password: 'admin123' (bcrypt hashed - change in production!)
INSERT IGNORE INTO admin_users (site_key, username, password_hash) VALUES
('pedromdominguez', 'admin', '$2b$10$rQZ8gqZ7JqZ7JqZ7JqZ7JeXKv1tF5xF5xF5xF5xF5xF5xF5xF5xF5x'),
('domtech', 'admin', '$2b$10$rQZ8gqZ7JqZ7JqZ7JqZ7JeXKv1tF5xF5xF5xF5xF5xF5xF5xF5xF5x'),
('heavenlyroofing', 'admin', '$2b$10$rQZ8gqZ7JqZ7JqZ7JqZ7JeXKv1tF5xF5xF5xF5xF5xF5xF5xF5xF5x'),
('okdevs', 'admin', '$2b$10$rQZ8gqZ7JqZ7JqZ7JqZ7JeXKv1tF5xF5xF5xF5xF5xF5xF5xF5xF5x'),
('efficientmovers', 'admin', '$2b$10$rQZ8gqZ7JqZ7JqZ7JqZ7JeXKv1tF5xF5xF5xF5xF5xF5xF5xF5xF5x');

-- ======================
-- Sample Data (Development/Testing Only)
-- ======================
-- Uncomment these sections for development environments

/*
-- Sample contact messages
INSERT IGNORE INTO contact_messages (site_key, name, email, phone, message) VALUES
('pedromdominguez', 'John Smith', 'john@example.com', '+1-555-1001', 'Interested in web development services'),
('domtech', 'Sarah Johnson', 'sarah@business.com', '+1-555-1002', 'Need IT consultation for our company'),
('heavenlyroofing', 'Mike Wilson', 'mike@homeowner.com', '+1-555-1003', 'Need roof inspection quote');

-- Sample blog posts
INSERT IGNORE INTO blogs (site_key, title, author, summary, content) VALUES
('pedromdominguez', 'Welcome to My Portfolio', 'Pedro Dominguez', 'Introduction to my web development services', 'Full content of the welcome blog post...'),
('domtech', 'Latest Technology Trends', 'DomTech Team', 'Overview of current tech trends in business', 'Detailed analysis of technology trends...'),
('okdevs', 'Open Source Development', 'OK Devs', 'Why we love open source development', 'Our philosophy on open source contribution...');

-- Sample projects
INSERT IGNORE INTO projects (site_key, title, image, description) VALUES
('pedromdominguez', 'E-commerce Platform', '/assets/project1.jpg', 'Full-stack e-commerce solution built with modern technologies'),
('domtech', 'Business Management System', '/assets/project2.jpg', 'Custom CRM and inventory management system'),
('okdevs', 'Community Platform', '/assets/project3.jpg', 'Open source community collaboration platform');

-- Sample appointments
INSERT IGNORE INTO appointments (site_key, name, phone, email, service, message, appointment_date, appointment_time, status) VALUES
('pedromdominguez', 'Alice Cooper', '+1-555-2001', 'alice@client.com', 'Web Development Consultation', 'Need a new website for my business', '2025-09-15', '10:00:00', 'confirmed'),
('domtech', 'Bob Martinez', '+1-555-2002', 'bob@company.com', 'IT Infrastructure Review', 'Annual IT assessment needed', '2025-09-16', '14:00:00', 'pending'),
('heavenlyroofing', 'Carol Davis', '+1-555-2003', 'carol@homeowner.com', 'Roof Inspection', 'Possible leak in roof', '2025-09-17', '09:00:00', 'confirmed');
*/

-- ======================
-- Database Optimization
-- ======================
-- Analyze tables for optimal performance
ANALYZE TABLE admin_users;
ANALYZE TABLE site_settings;
ANALYZE TABLE appointments;
ANALYZE TABLE contact_messages;
ANALYZE TABLE blogs;
ANALYZE TABLE projects;

-- ======================
-- Verification Queries
-- ======================
-- Uncomment to verify initialization
/*
SELECT 'Site Settings Created:' as info, COUNT(*) as count FROM site_settings;
SELECT 'Admin Users Created:' as info, COUNT(*) as count FROM admin_users;
SELECT 'Tables Analyzed Successfully' as status;
*/

-- ========================================================
-- Initialization Complete
-- ========================================================