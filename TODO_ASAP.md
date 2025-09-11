# TODO_ASAP.md - Critical Database Schema Reorganization

## 🚨 **URGENT: Database Schema Organization & Consistency**

**Priority:** CRITICAL  
**Estimated Time:** 30-45 minutes  
**Impact:** Framework integrity, deployment consistency  
**Date Created:** September 10, 2025

---

## 🎯 **Immediate Actions Required**

### **1. Move Database Schema to Config Directory**
**Status:** ❌ Not Started  
**Time:** 5 minutes

```bash
# Create the proper directory structure
mkdir -p config/database/schemas
mkdir -p config/database/migrations

# Move the schema file
mv core/database/schema.sql config/database/schemas/universal_schema.sql
```

### **2. Fix Schema Inconsistencies**
**Status:** ❌ Not Started  
**Time:** 15 minutes

**Problem:** Three different versions of schema exist:
- `core/database/schema.sql` (7 tables)
- `config/deployment/scripts/setup-maridb.sh` (3 tables only)
- Documentation references are misaligned

**Action Required:**
- [ ] Standardize on `universal_schema.sql` as single source of truth
- [ ] Update setup script to include ALL tables:
  - ✅ `admin_users`
  - ✅ `contact_messages` 
  - ✅ `appointments`
  - ❌ `site_settings` (MISSING)
  - ❌ `blogs` (MISSING)
  - ❌ `projects` (MISSING)
  - ❌ `transactions` (MISSING)

### **3. Update Setup Script**
**Status:** ❌ Not Started  
**Time:** 10 minutes

```bash
# File to modify:
config/deployment/scripts/setup-maridb.sh
```

**Required Changes:**
- [ ] Add missing table definitions (site_settings, blogs, projects, transactions)
- [ ] Fix field definition inconsistencies
- [ ] Ensure index consistency
- [ ] Update references to point to new schema location

### **4. Update All References**
**Status:** ❌ Not Started  
**Time:** 10 minutes

**Files that need updating:**
- [ ] Any deployment scripts referencing old schema path
- [ ] Documentation files mentioning schema location
- [ ] Core database client imports (if any)
- [ ] README.md installation instructions

---

## 🛠️ **Detailed Implementation Steps**

### **Step 1: Directory Structure Creation**
```bash
cd /home/admin/deno-genesis

# Create config directory structure (if not exists)
mkdir -p config/database/schemas
mkdir -p config/database/migrations
mkdir -p config/systemd/templates
mkdir -p config/systemd/active
mkdir -p config/nginx/sites-available
mkdir -p config/nginx/sites-enabled
mkdir -p config/deployment/scripts
mkdir -p config/deployment/environments
mkdir -p config/monitoring

# Add gitkeep files for empty directories
touch config/database/migrations/.gitkeep
touch config/nginx/sites-available/.gitkeep
touch config/nginx/sites-enabled/.gitkeep
touch config/deployment/environments/.gitkeep
touch config/monitoring/.gitkeep
```

### **Step 2: Move Schema File**
```bash
# Move and rename schema file
mv core/database/schema.sql config/database/schemas/universal_schema.sql

# Verify the move
ls -la config/database/schemas/
```

### **Step 3: Create Complete Schema (Fix Inconsistencies)**

Create new file: `config/database/schemas/universal_schema.sql` with ALL tables:

```sql
-- ========================================================
--  Deno Genesis Universal Schema (Multi-Tenant)
--  Database: universal_db
--  Last Updated: 2025-09-10
--  Location: config/database/schemas/universal_schema.sql
-- ========================================================

CREATE DATABASE IF NOT EXISTS universal_db;
USE universal_db;

-- Include ALL 7 tables with consistent field definitions
-- (Full schema content to be added)
```

### **Step 4: Update Setup Script**

Modify `config/deployment/scripts/setup-maridb.sh`:

```bash
# Update the schema creation section to source from:
# config/database/schemas/universal_schema.sql
# Instead of inline SQL definitions
```

### **Step 5: Update Documentation**

**Files to update:**
- [ ] `INSTALLATION.md` - Update schema reference paths
- [ ] `README.md` - Update any database setup instructions
- [ ] `docs/framework/architecture.md` - Update directory structure
- [ ] Any other files referencing old schema path

---

## 🔍 **Validation Checklist**

### **Post-Implementation Verification:**
- [ ] Schema file exists at `config/database/schemas/universal_schema.sql`
- [ ] Old schema file removed from `core/database/schema.sql`
- [ ] Setup script creates ALL 7 tables consistently
- [ ] No broken references to old schema location
- [ ] Database setup script runs without errors
- [ ] All sites can connect to database properly

### **Test Commands:**
```bash
# Test schema creation
cd /home/admin/deno-genesis
./config/deployment/scripts/setup-maridb.sh

# Verify all tables were created
mysql -u webadmin -p'Password123!' -D universal_db -e "SHOW TABLES;"

# Count should show 7 tables:
# admin_users, appointments, blogs, contact_messages, projects, site_settings, transactions
```

---

## ⚠️ **Risk Assessment**

### **Low Risk Actions:**
- Moving schema file (no functionality impact)
- Creating directory structure

### **Medium Risk Actions:**
- Updating setup script (test thoroughly)
- Updating references (could break deployment if missed)

### **Mitigation Strategy:**
1. **Backup first:** Copy current working files before changes
2. **Test incrementally:** Test setup script after each change
3. **Document changes:** Update all relevant documentation
4. **Validate thoroughly:** Run complete setup process after changes

---

## 🎯 **Success Criteria**

### **Completion Definition:**
- [ ] Single source of truth for database schema established
- [ ] All infrastructure configs organized under `config/`
- [ ] Zero schema drift between setup script and main schema
- [ ] All references updated and functional
- [ ] Documentation reflects new organization

### **Framework Integrity Maintained:**
- [ ] `core/` directory contains only framework logic
- [ ] `config/` directory contains all infrastructure configuration
- [ ] DenoGenesis architecture principles maintained
- [ ] No version drift introduced

---

## 📝 **Notes**

### **Why This is Critical:**
1. **Schema Drift:** Currently have 3 different versions of database schema
2. **Architecture Violation:** Database schema in `core/` violates separation of concerns
3. **Deployment Risk:** Inconsistent schemas could cause production issues
4. **Maintenance Overhead:** Multiple schema definitions are hard to maintain

### **Framework Alignment:**
This reorganization aligns with the DenoGenesis principle that `core/` should contain framework logic only, while `config/` should contain infrastructure and deployment configurations.

---

## 🏷️ **Tags**
`#critical` `#database` `#schema` `#architecture` `#infrastructure` `#deployment` `#asap`