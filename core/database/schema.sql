-- ========================================================
--  Deno Genesis Universal Schema (Multi-Tenant) - Cleaned
--  Database: universal_db
--  Last Updated: 2025-09-07
-- ========================================================

CREATE DATABASE IF NOT EXISTS universal_db;
USE universal_db;

-- ======================
-- Admin Users
-- ======================
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_key VARCHAR(50) NOT NULL,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_site_user (site_key, username),
  INDEX idx_site_key (site_key)
);

-- ======================
-- Essential Site Settings
-- ======================
CREATE TABLE IF NOT EXISTS site_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_key VARCHAR(50) NOT NULL UNIQUE,
  contact_email VARCHAR(100) NOT NULL,
  business_phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_site_key (site_key)
);

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
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  appointment_date DATE,
  appointment_time TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_site_key (site_key),
  INDEX idx_site_email (site_key, email),
  INDEX idx_appointment_date (site_key, appointment_date),
  INDEX idx_status (status)
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_site_key (site_key)
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
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_site_key (site_key),
  INDEX idx_submitted_at (submitted_at)
);

-- ======================
-- Projects
-- ======================
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_key VARCHAR(50) NOT NULL,
  title VARCHAR(150) NOT NULL,
  image VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_site_key (site_key)
);

-- ========================================================
-- User & Privileges
-- ========================================================
CREATE USER IF NOT EXISTS 'webadmin'@'localhost' IDENTIFIED BY 'Password123!';
GRANT ALL PRIVILEGES ON universal_db.* TO 'webadmin'@'localhost';
FLUSH PRIVILEGES;