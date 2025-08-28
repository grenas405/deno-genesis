-- ========================================================
--  Deno Genesis Universal Schema (Multi-Tenant)
--  Database: universal_db
--  Last Updated: 2025-08-16
-- ========================================================

CREATE DATABASE IF NOT EXISTS universal_db;
USE universal_db;

-- ======================
-- Appointments
-- ======================
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_key VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  email VARCHAR(100),
  service VARCHAR(255) NOT NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_appointment (site_key, email, service, created_at),
  INDEX idx_site_email (site_key, email)
);



-- ======================
-- Admin Users
-- ======================
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_key VARCHAR(50) NOT NULL,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_site_user (site_key, username)
);

-- ===========================
-- ✅ Updated Site Settings Table
-- ===========================
CREATE TABLE IF NOT EXISTS site_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_key VARCHAR(50) NOT NULL UNIQUE,
  hero_headline VARCHAR(150) NOT NULL,
  contact_email VARCHAR(100) NOT NULL,
  business_phone VARCHAR(20) NOT NULL,
  footer_text VARCHAR(255),
  primary_color VARCHAR(10),
  secondary_color VARCHAR(10),
  about_us_text TEXT,
  facebook_url VARCHAR(255),
  instagram_url VARCHAR(255),
  twitter_url VARCHAR(255),
  tracking_code TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- ======================
-- Blog Posts
-- ======================
CREATE TABLE IF NOT EXISTS blogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_key VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(100) NOT NULL,
  summary TEXT NOT NULL,
  content LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ======================
-- Contact Messages
-- ======================
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_key VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_key VARCHAR(50) NOT NULL,
  title VARCHAR(150) NOT NULL,
  image VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ======================
-- Stripe Transactions
-- ======================
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_key VARCHAR(50) NOT NULL,
  stripe_payment_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'usd',
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- ========================================================
-- User & Privileges
-- ========================================================
CREATE USER IF NOT EXISTS 'webadmin'@'localhost' IDENTIFIED BY 'Password123!';
GRANT ALL PRIVILEGES ON universal_db.* TO 'webadmin'@'localhost';
FLUSH PRIVILEGES;
