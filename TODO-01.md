# Documentation Reorganization TODO

**Priority:** HIGH  
**Estimated Time:** 45-60 minutes  
**Impact:** Framework consistency, developer experience  
**Date Created:** September 11, 2025

---

## 🎯 **Objective**

Reorganize documentation from the current flat `docs/framework/` structure to the new numbered directory system for improved navigation, AI collaboration, and developer experience.

---

## 📋 **File Movement Plan**

### ✅ **Completed Moves**
- [ ] None yet - ready to begin

### 🔄 **Files to Relocate**

#### **From `docs/framework/` to `docs/02-framework/`**
```bash
# Core framework documentation
mv docs/framework/architecture.md docs/02-framework/architecture.md
mv docs/framework/component-architecture.md docs/02-framework/component-architecture.md
```

#### **From `docs/framework/` to `docs/05-frontend/`**
```bash
# Frontend-specific documentation
mv docs/framework/frontend-documentation.md docs/05-frontend/ui-guidelines.md
```

#### **From `docs/framework/` to `docs/07-deployment/`**
```bash
# Deployment and service management
mv docs/framework/systemd-service-pattern.md docs/07-deployment/systemd-services.md
# Note: Fix filename typo (pattern -> patterns) during move
```

---

## 📁 **Directory Structure Verification**

### **Step 1: Ensure Target Directories Exist**
```bash
# Create numbered directory structure if missing
mkdir -p docs/01-getting-started
mkdir -p docs/02-framework
mkdir -p docs/03-development
mkdir -p docs/04-api-reference
mkdir -p docs/05-frontend
mkdir -p docs/06-backend
mkdir -p docs/07-deployment
mkdir -p docs/08-business
mkdir -p docs/09-industries
mkdir -p docs/10-advanced
mkdir -p docs/11-community
mkdir -p docs/12-examples
mkdir -p docs/13-reference
mkdir -p docs/14-appendices

# Add README.md files to main directories
touch docs/02-framework/README.md
touch docs/05-frontend/README.md
touch docs/07-deployment/README.md
```

### **Step 2: Verify Current Structure**
```bash
# Check what files exist in docs/framework/
ls -la docs/framework/

# Expected files to move:
# - architecture.md
# - component-architecture.md
# - frontend-documentation.md
# - systemd-service-pattern.md (or systemd-service-patterns.md)
```

---

## 🔧 **Implementation Steps**

### **Phase 1: Core Framework Documentation (5 minutes)**
- [ ] Move `docs/framework/architecture.md` → `docs/02-framework/architecture.md`
- [ ] Move `docs/framework/component-architecture.md` → `docs/02-framework/component-architecture.md`
- [ ] Verify content remains intact after move

### **Phase 2: Frontend Documentation (5 minutes)**
- [ ] Move `docs/framework/frontend-documentation.md` → `docs/05-frontend/ui-guidelines.md`
- [ ] Update any internal references to new filename
- [ ] Verify content formatting is preserved

### **Phase 3: Deployment Documentation (5 minutes)**
- [ ] Move `docs/framework/systemd-service-pattern.md` → `docs/07-deployment/systemd-services.md`
- [ ] Fix filename typo during move (pattern → services)
- [ ] Verify SystemD patterns are properly categorized

### **Phase 4: Cleanup and Validation (10 minutes)**
- [ ] Remove empty `docs/framework/` directory (if empty)
- [ ] Update any cross-references in other documentation files
- [ ] Verify all moved files open and display correctly
- [ ] Check for broken internal links

### **Phase 5: Update Navigation (15 minutes)**
- [ ] Update main `docs/README.md` to reflect new structure
- [ ] Add section READMEs if missing
- [ ] Update any table of contents or navigation references
- [ ] Test documentation navigation flow

---

## 🔍 **Validation Checklist**

### **File Integrity**
- [ ] All files moved successfully without corruption
- [ ] File permissions preserved during move
- [ ] Content formatting intact (markdown rendering)
- [ ] No duplicate files left in old locations

### **Link Validation**
- [ ] Internal links updated to new paths
- [ ] Cross-references between documents work
- [ ] No broken links in documentation
- [ ] Navigation flows logically

### **Structure Compliance**
- [ ] Files in correct numbered directories
- [ ] Filenames follow naming conventions (lowercase, hyphens)
- [ ] Directory structure matches documentation plan
- [ ] README files exist where needed

---

## 🚨 **Risk Mitigation**

### **Backup Strategy**
```bash
# Create backup before reorganization
cp -r docs/ docs_backup_$(date +%Y%m%d_%H%M%S)
```

### **Rollback Plan**
If issues arise:
1. Stop reorganization immediately
2. Restore from backup: `cp -r docs_backup_* docs/`
3. Identify and fix specific issues
4. Resume reorganization incrementally

### **Testing Approach**
- Test each move individually before proceeding
- Verify documentation renders correctly after each phase
- Check with AI tools that navigation still works
- Validate with team members if available

---

## 📈 **Success Criteria**

### **Primary Goals**
- [ ] All documentation files organized in numbered directory structure
- [ ] No broken links or missing files
- [ ] Improved navigation and discoverability
- [ ] AI-friendly documentation structure implemented

### **Secondary Benefits**
- [ ] Better developer onboarding experience
- [ ] Clearer separation of concerns in documentation
- [ ] Foundation for future documentation expansion
- [ ] Alignment with framework architecture principles

---

## 🏷️ **Tags**
`#documentation` `#organization` `#developer-experience` `#framework` `#high-priority`

---

## 📝 **Post-Implementation Notes**

### **Document Changes Made**
- Record any unexpected issues encountered
- Note any additional files discovered during reorganization
- Update this TODO with actual time taken vs. estimates
- Document any deviations from the planned structure

### **Next Steps After Completion**
- [ ] Review documentation structure with team
- [ ] Plan content creation for empty directory sections
- [ ] Consider automation for future documentation organization
- [ ] Update development workflows to reference new structure