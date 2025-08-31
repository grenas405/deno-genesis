# TODO: Add Config Directory Structure

## 📋 Task Overview
Create a centralized `config/` directory to organize all infrastructure and deployment configuration files, following DenoGenesis framework patterns.

## 🎯 Objectives
- [ ] Create main `config/` directory in project root
- [ ] Organize configuration files by category
- [ ] Align with existing DenoGenesis architecture patterns
- [ ] Improve project maintainability and deployment consistency

## 📁 Directory Structure to Create

```
config/
├── systemd/                 # SystemD service configurations
│   ├── templates/          # Service file templates
│   │   └── denogenesis-site.service.template
│   └── active/             # Currently deployed service files
│       ├── domtech.service
│       ├── heavenlyroofing.service
│       ├── okdevs.service
│       ├── pedromdominguez.service
│       └── efficientmovers.service
├── nginx/                   # Nginx reverse proxy configs
│   ├── sites-available/    # Available site configurations
│   └── sites-enabled/      # Enabled site configurations
├── database/               # Database configuration
│   ├── schemas/            # Database schema definitions
│   ├── migrations/         # Database migration scripts
│   └── init.sql           # Initial database setup
├── deployment/             # Deployment automation
│   ├── scripts/            # Deployment and update scripts
│   │   ├── deploy-site.sh
│   │   ├── update-framework.sh
│   │   └── health-check.sh
│   └── environments/       # Environment-specific configs
│       ├── production.env.template
│       ├── staging.env.template
│       └── development.env.template
└── monitoring/             # Monitoring and logging
    ├── logrotate.conf      # Log rotation configuration
    ├── health-checks.json  # Health check endpoints
    └── alerts.json         # Monitoring alert rules
```

## ✅ Implementation Steps

### Step 1: Create Directory Structure
- [ ] Create main `config/` directory
- [ ] Create all subdirectories as outlined above
- [ ] Add appropriate `.gitkeep` files for empty directories

### Step 2: Move Existing Configs
- [ ] Move any existing systemd service files to `config/systemd/active/`
- [ ] Move nginx configurations to `config/nginx/`
- [ ] Create templates from existing service files

### Step 3: Create Templates
- [ ] Create systemd service template following DenoGenesis patterns
- [ ] Create nginx site configuration template
- [ ] Create environment variable templates

### Step 4: Update Documentation
- [ ] Update README.md to reference config directory
- [ ] Document configuration management workflows
- [ ] Add deployment procedure documentation

### Step 5: Create Management Scripts
- [ ] Script to generate service files from templates
- [ ] Script to deploy configurations to system locations
- [ ] Script to validate configuration consistency

## 🔗 Related Framework Components
- Aligns with `/home/admin/deno-genesis/core/config/` pattern
- Supports the centralized architecture model
- Enables consistent systemd service management across all sites

## 🎯 Success Criteria
- [ ] All configuration files organized in logical structure
- [ ] Templates can generate site-specific configurations
- [ ] Deployment process uses centralized configurations
- [ ] Framework updates don't break existing site configs

## 📝 Notes
- Follow DenoGenesis security hardening patterns for all service files
- Maintain port isolation (3000-3004) across all configurations
- Ensure all configs support the multi-tenant database architecture
- Include proper restart delays and dependency management

## ⏰ Priority
**High** - Infrastructure organization is critical for maintainable deployments

## 🏷️ Tags
`#infrastructure` `#configuration` `#systemd` `#deployment` `#denogenesis`