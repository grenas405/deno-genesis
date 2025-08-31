# Deno Genesis Installation Guide

This guide will walk you through the complete installation process for the Deno Genesis project, including all required dependencies and database setup.

## Prerequisites

Before beginning, ensure you have:
- A Linux-based system (Ubuntu/Debian recommended)
- `sudo` privileges for package installation
- Git installed on your system
- Basic terminal/command line familiarity

## Installation Steps

### 1. Clone the Repository

First, clone the Deno Genesis repository to your local machine:

```bash
git clone https://github.com/grenas405/deno-genesis
cd deno-genesis
```

### 2. Install Deno

Install Deno using the official installation script:

```bash
curl -fsSL https://deno.land/install.sh | sh
```

After installation, add Deno to your PATH by adding this line to your shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
export PATH="$HOME/.deno/bin:$PATH"
```

Then reload your shell configuration:

```bash
source ~/.bashrc  # or ~/.zshrc depending on your shell
```

Verify the installation:

```bash
deno --version
```

### 3. Update System Package Manager

Update your system's package manager to ensure you have access to the latest packages:

```bash
sudo apt update
```

### 4. Install MariaDB Server

Install MariaDB server, which will serve as the database backend for the project:

```bash
sudo apt install mariadb-server
```

During installation, you may be prompted to set a root password. If not prompted, you can secure the installation later.

### 5. Secure MariaDB Installation (Recommended)

After installation, run the security script to improve MariaDB's security:

```bash
sudo mysql_secure_installation
```

Follow the prompts to:
- Set a root password (if not already set)
- Remove anonymous users
- Disallow root login remotely
- Remove test database
- Reload privilege tables

### 6. Configure MariaDB for Deno Genesis

Run the provided setup script to configure MariaDB specifically for the Deno Genesis project:

```bash
./core/utils/setup-mariadb.sh
```

This script will:
- Create the necessary database schema
- Set up required user permissions
- Initialize any default data or configurations
- Configure optimal settings for the project

### 7. Verify Installation

To verify everything is working correctly:

1. Check that Deno is installed and accessible:
   ```bash
   deno --version
   ```

2. Verify MariaDB is running:
   ```bash
   sudo systemctl status mariadb
   ```

3. Test database connectivity (if applicable based on your project structure):
   ```bash
   deno run --allow-net --allow-read your-db-test-file.ts
   ```

## Next Steps

After completing the installation:

1. Review the project's `README.md` for project-specific configuration
2. Check for any environment variables that need to be set
3. Review the project structure and main entry points
4. Run any additional setup commands specific to your development workflow

## Troubleshooting

### Common Issues

**Deno not found after installation:**
- Ensure you've added Deno to your PATH and reloaded your shell configuration
- Try opening a new terminal window

**MariaDB service not starting:**
- Check service status: `sudo systemctl status mariadb`
- Start the service manually: `sudo systemctl start mariadb`
- Enable auto-start: `sudo systemctl enable mariadb`

**Permission denied when running setup script:**
- Make the script executable: `chmod +x ./core/utils/setup-mariadb.sh`
- Ensure you're in the correct directory (project root)

**Database connection issues:**
- Verify MariaDB is running and accepting connections
- Check that the setup script completed successfully
- Review database credentials and connection strings

## Additional Resources

- [Deno Official Documentation](https://deno.land/manual)
- [MariaDB Documentation](https://mariadb.org/documentation/)
- [Project Repository](https://github.com/grenas405/deno-genesis)

For project-specific issues, please refer to the repository's issue tracker or documentation.