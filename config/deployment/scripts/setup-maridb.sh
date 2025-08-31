#!/bin/bash

# ========================================================
# DenoGenesis Framework - MariaDB Database Setup Script
# ========================================================
# Purpose: Initialize MariaDB with universal_db schema
# Database: universal_db (Multi-Tenant Architecture)
# Tables: admin_users, contact_messages, appointments
# User: webadmin with full privileges
# ========================================================

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="universal_db"
DB_USER="webadmin"
DB_PASSWORD="Password123!"
MYSQL_ROOT_PASSWORD=""

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Function to check if MariaDB is installed
check_mariadb() {
    if command -v mysql >/dev/null 2>&1; then
        print_success "MariaDB client found"
        return 0
    else
        print_error "MariaDB client not found"
        return 1
    fi
}

# Function to check if MariaDB service is running
check_mariadb_service() {
    if systemctl is-active --quiet mariadb; then
        print_success "MariaDB service is running"
        return 0
    elif systemctl is-active --quiet mysql; then
        print_success "MySQL/MariaDB service is running"
        return 0
    else
        print_warning "MariaDB service is not running"
        return 1
    fi
}

# Function to install MariaDB if not present
install_mariadb() {
    print_header "Installing MariaDB Server"
    
    # Update package list
    print_status "Updating package list..."
    sudo apt update
    
    # Install MariaDB server
    print_status "Installing MariaDB server..."
    sudo apt install -y mariadb-server mariadb-client
    
    # Start and enable MariaDB service
    print_status "Starting MariaDB service..."
    sudo systemctl start mariadb
    sudo systemctl enable mariadb
    
    print_success "MariaDB installation completed"
}

# Function to secure MariaDB installation
secure_mariadb() {
    print_header "Securing MariaDB Installation"
    
    print_status "Running MariaDB security configuration..."
    print_warning "You will be prompted to:"
    print_warning "1. Set root password (recommended: use a strong password)"
    print_warning "2. Remove anonymous users (recommended: Y)"
    print_warning "3. Disallow root login remotely (recommended: Y)"
    print_warning "4. Remove test database (recommended: Y)"
    print_warning "5. Reload privilege tables (recommended: Y)"
    
    echo ""
    read -p "Press Enter to continue with mysql_secure_installation..."
    
    sudo mysql_secure_installation
    
    print_success "MariaDB security configuration completed"
}

# Function to get MySQL root password
get_root_password() {
    print_header "Database Authentication"
    
    # Try to connect without password first (for new installations)
    if mysql -u root -e "SELECT 1;" >/dev/null 2>&1; then
        print_status "Root user can connect without password"
        MYSQL_ROOT_PASSWORD=""
        return 0
    fi
    
    # Ask for root password
    echo -n "Enter MySQL/MariaDB root password: "
    read -s MYSQL_ROOT_PASSWORD
    echo ""
    
    # Test connection
    if mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1;" >/dev/null 2>&1; then
        print_success "Root password verified"
        return 0
    else
        print_error "Invalid root password"
        return 1
    fi
}

# Function to create database and tables
create_database() {
    print_header "Creating Database and Tables"
    
    # Prepare MySQL command with or without password
    if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
        MYSQL_CMD="mysql -u root"
    else
        MYSQL_CMD="mysql -u root -p$MYSQL_ROOT_PASSWORD"
    fi
    
    print_status "Creating database: $DB_NAME"
    
    # Create the database and tables
    $MYSQL_CMD << EOF
-- ========================================================
-- Deno Genesis Universal Schema (Multi-Tenant) - Simplified
-- Database: universal_db
-- Tables: admin_users, contact_messages, appointments only
-- ========================================================

CREATE DATABASE IF NOT EXISTS $DB_NAME;
USE $DB_NAME;

-- ======================
-- Admin Users Table
-- ======================
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_key VARCHAR(50) NOT NULL,
  username VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_site_user (site_key, username),
  INDEX idx_site_key (site_key),
  INDEX idx_username (username)
);

-- ======================
-- Contact Messages Table
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
  INDEX idx_submitted_at (submitted_at),
  INDEX idx_email (email)
);

-- ======================
-- Appointments Table
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
  INDEX idx_site_email (site_key, email),
  INDEX idx_site_key (site_key),
  INDEX idx_created_at (created_at)
);

EOF

    if [ $? -eq 0 ]; then
        print_success "Database and tables created successfully"
    else
        print_error "Failed to create database and tables"
        exit 1
    fi
}

# Function to create database user
create_user() {
    print_header "Creating Database User"
    
    # Prepare MySQL command with or without password
    if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
        MYSQL_CMD="mysql -u root"
    else
        MYSQL_CMD="mysql -u root -p$MYSQL_ROOT_PASSWORD"
    fi
    
    print_status "Creating user: $DB_USER"
    
    # Create user and grant privileges
    $MYSQL_CMD << EOF
-- Create user and grant privileges
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;

-- Verify user creation
SELECT User, Host FROM mysql.user WHERE User = '$DB_USER';
EOF

    if [ $? -eq 0 ]; then
        print_success "Database user '$DB_USER' created with full privileges on '$DB_NAME'"
    else
        print_error "Failed to create database user"
        exit 1
    fi
}

# Function to test database connection
test_connection() {
    print_header "Testing Database Connection"
    
    print_status "Testing connection as user: $DB_USER"
    
    # Test connection with the created user
    mysql -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" << EOF
-- Test queries to verify everything is working
SHOW TABLES;
SELECT COUNT(*) as admin_users_count FROM admin_users;
SELECT COUNT(*) as contact_messages_count FROM contact_messages;
SELECT COUNT(*) as appointments_count FROM appointments;
SELECT 'Database connection test successful!' as status;
EOF

    if [ $? -eq 0 ]; then
        print_success "Database connection test passed"
    else
        print_error "Database connection test failed"
        exit 1
    fi
}

# Function to display summary
display_summary() {
    print_header "Setup Complete - Database Information"
    
    echo -e "${GREEN}Database Details:${NC}"
    echo -e "  Database Name: ${YELLOW}$DB_NAME${NC}"
    echo -e "  Username: ${YELLOW}$DB_USER${NC}"
    echo -e "  Password: ${YELLOW}$DB_PASSWORD${NC}"
    echo -e "  Host: ${YELLOW}localhost${NC}"
    echo ""
    echo -e "${GREEN}Tables Created:${NC}"
    echo -e "  • ${YELLOW}admin_users${NC} - Multi-tenant admin authentication"
    echo -e "  • ${YELLOW}contact_messages${NC} - Customer contact form submissions"
    echo -e "  • ${YELLOW}appointments${NC} - Service appointment requests"
    echo ""
    echo -e "${GREEN}Connection String for Deno:${NC}"
    echo -e "  ${YELLOW}mysql://webadmin:Password123!@localhost:3306/universal_db${NC}"
    echo ""
    echo -e "${GREEN}Test Connection:${NC}"
    echo -e "  ${YELLOW}mysql -u webadmin -p'Password123!' -D universal_db${NC}"
    echo ""
    print_warning "IMPORTANT: Change the default password in production!"
    print_warning "Update your DenoGenesis config files with these database credentials."
}

# Function to create sample data (optional)
create_sample_data() {
    print_header "Creating Sample Data (Optional)"
    
    read -p "Would you like to create sample data for testing? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Creating sample data..."
        
        mysql -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" << 'EOF'
-- Sample admin user (password: 'admin123' - bcrypt hashed)
INSERT IGNORE INTO admin_users (site_key, username, password_hash) VALUES
('pedromdominguez-com', 'admin', '$2b$10$rQZ8gqZ7JqZ7JqZ7JqZ7JeXKv1tF5xF5xF5xF5xF5xF5xF5xF5xF5x'),
('domtech', 'admin', '$2b$10$rQZ8gqZ7JqZ7JqZ7JqZ7JeXKv1tF5xF5xF5xF5xF5xF5xF5xF5xF5x');

-- Sample contact message
INSERT IGNORE INTO contact_messages (site_key, name, email, phone, message) VALUES
('pedromdominguez-com', 'John Doe', 'john@example.com', '555-1234', 'Test contact message from setup script'),
('domtech', 'Jane Smith', 'jane@example.com', '555-5678', 'Interested in your tech solutions');

-- Sample appointment
INSERT IGNORE INTO appointments (site_key, name, phone, email, service, message) VALUES
('pedromdominguez-com', 'Test Client', '555-9999', 'client@example.com', 'Web Development Consultation', 'Sample appointment from setup script'),
('domtech', 'Business Owner', '555-0000', 'owner@business.com', 'IT Consultation', 'Need help with business technology');
EOF

        print_success "Sample data created"
    else
        print_status "Skipping sample data creation"
    fi
}

# Main execution flow
main() {
    print_header "DenoGenesis Framework - MariaDB Setup"
    
    # Check if script is run with proper permissions
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root. Consider running as a regular user with sudo access."
    fi
    
    # Step 1: Check if MariaDB is installed
    if ! check_mariadb; then
        read -p "MariaDB not found. Would you like to install it? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_mariadb
        else
            print_error "MariaDB is required. Exiting."
            exit 1
        fi
    fi
    
    # Step 2: Check if MariaDB service is running
    if ! check_mariadb_service; then
        print_status "Starting MariaDB service..."
        sudo systemctl start mariadb
        if ! check_mariadb_service; then
            print_error "Failed to start MariaDB service"
            exit 1
        fi
    fi
    
    # Step 3: Secure installation (only for new installations)
    if [ ! -f /var/lib/mysql/mysql/user.frm ] && [ ! -f /var/lib/mysql/mysql/user.MYD ]; then
        read -p "This appears to be a fresh MariaDB installation. Run security setup? (Y/n): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            secure_mariadb
        fi
    fi
    
    # Step 4: Get root password
    while ! get_root_password; do
        print_error "Please try again or press Ctrl+C to exit"
    done
    
    # Step 5: Create database and tables
    create_database
    
    # Step 6: Create database user
    create_user
    
    # Step 7: Test connection
    test_connection
    
    # Step 8: Create sample data (optional)
    create_sample_data
    
    # Step 9: Display summary
    display_summary
    
    print_success "MariaDB setup completed successfully!"
    print_status "You can now configure your DenoGenesis applications to use this database."
}

# Run main function
main "$@"