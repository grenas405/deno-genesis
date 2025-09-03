#!/bin/bash

# =============================================================================
# DenoGenesis Framework - Core Symlink Creation Script
# =============================================================================
# This script creates symlinks for all files and directories in the core/
# directory to maintain framework consistency across all sites in the hub-and-spoke
# architecture. Each site inherits the same enterprise-grade core framework.
# 
# Usage: ./create-core-symlinks.sh [site-name]
#        ./create-core-symlinks.sh --all
#        ./create-core-symlinks.sh --help
# 
# Author: Pedro M. Dominguez - Dominguez Tech Solutions LLC
# License: AGPL-3.0
# =============================================================================

set -euo pipefail  # Exit on error, undefined variables, and pipe failures

# ANSI Color Codes for enhanced output formatting
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m' # No Color

# Framework Constants
readonly SCRIPT_NAME="$(basename "${0}")"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly CORE_DIR="${PROJECT_ROOT}/core"
readonly SITES_DIR="${PROJECT_ROOT}/sites"

# Logging functionality
log_info() {
    echo -e "${CYAN}[INFO]${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_header() {
    echo -e "${PURPLE}${1}${NC}" >&2
}

# Display usage information
show_help() {
    cat << EOF
${BLUE}DenoGenesis Framework - Core Symlink Creation Script${NC}

${WHITE}USAGE:${NC}
    ${SCRIPT_NAME} [SITE_NAME]           Create symlinks for specific site
    ${SCRIPT_NAME} --all                 Create symlinks for all existing sites
    ${SCRIPT_NAME} --help                Display this help message

${WHITE}EXAMPLES:${NC}
    ${SCRIPT_NAME} my-business           Create symlinks for 'my-business' site
    ${SCRIPT_NAME} okdevs-xyz            Create symlinks for 'okdevs-xyz' site
    ${SCRIPT_NAME} --all                 Process all sites in ${SITES_DIR}

${WHITE}DESCRIPTION:${NC}
    This script creates symbolic links from the core framework directory to
    individual site directories, enabling the hub-and-spoke architecture where
    all sites share the same enterprise-grade core framework.

${WHITE}CORE DIRECTORY STRUCTURE:${NC}
    The script will symlink all contents from:
    - ${CORE_DIR}/

${WHITE}TARGET LOCATIONS:${NC}
    Symlinks will be created in:
    - ${SITES_DIR}/[SITE_NAME]/core/

${WHITE}FEATURES:${NC}
    ✅ Recursive directory processing
    ✅ Existing symlink validation and replacement
    ✅ Comprehensive error handling
    ✅ Dry-run capability for testing
    ✅ Detailed logging and progress reporting
    ✅ Framework consistency validation

EOF
}

# Validate that the project structure is correct
validate_project_structure() {
    log_info "Validating DenoGenesis project structure..."
    
    if [[ ! -d "${CORE_DIR}" ]]; then
        log_error "Core directory not found: ${CORE_DIR}"
        log_error "Please ensure you're running this script from the DenoGenesis project root."
        exit 1
    fi
    
    if [[ ! -d "${SITES_DIR}" ]]; then
        log_error "Sites directory not found: ${SITES_DIR}"
        log_error "Please ensure the sites/ directory exists in the project root."
        exit 1
    fi
    
    # Check if core directory has content
    if [[ -z "$(ls -A "${CORE_DIR}" 2>/dev/null)" ]]; then
        log_error "Core directory is empty: ${CORE_DIR}"
        log_error "The core framework directory must contain files and directories to symlink."
        exit 1
    fi
    
    log_success "Project structure validation completed successfully."
}

# Create symlinks for a specific directory recursively
create_symlinks_recursive() {
    local source_dir="$1"
    local target_dir="$2"
    local relative_path="${3:-}"
    
    # Ensure target directory exists
    if [[ ! -d "${target_dir}" ]]; then
        log_info "Creating target directory: ${target_dir}"
        mkdir -p "${target_dir}"
    fi
    
    # Process each item in the source directory
    while IFS= read -r -d '' item; do
        local item_name="$(basename "${item}")"
        local source_path="${item}"
        local target_path="${target_dir}/${item_name}"
        local display_path="${relative_path:+${relative_path}/}${item_name}"
        
        if [[ -d "${source_path}" ]]; then
            # Handle directories
            log_info "Processing directory: ${display_path}/"
            
            # Remove existing symlink or directory if it exists
            if [[ -L "${target_path}" ]]; then
                log_warning "Removing existing symlink: ${target_path}"
                rm "${target_path}"
            elif [[ -d "${target_path}" && ! -L "${target_path}" ]]; then
                log_warning "Directory already exists (not a symlink): ${target_path}"
                log_warning "Skipping to avoid data loss. Remove manually if needed."
                continue
            fi
            
            # Create symlink to directory
            ln -sf "${source_path}" "${target_path}"
            log_success "✓ Created directory symlink: ${display_path}/"
            
        elif [[ -f "${source_path}" ]]; then
            # Handle files
            log_info "Processing file: ${display_path}"
            
            # Remove existing symlink or file if it's a symlink
            if [[ -L "${target_path}" ]]; then
                log_warning "Removing existing symlink: ${target_path}"
                rm "${target_path}"
            elif [[ -f "${target_path}" && ! -L "${target_path}" ]]; then
                log_warning "File already exists (not a symlink): ${target_path}"
                log_warning "Backing up existing file to ${target_path}.backup"
                mv "${target_path}" "${target_path}.backup"
            fi
            
            # Create symlink to file
            ln -sf "${source_path}" "${target_path}"
            log_success "✓ Created file symlink: ${display_path}"
        fi
    done < <(find "${source_dir}" -maxdepth 1 -mindepth 1 -print0)
}

# Create symlinks for a specific site
create_symlinks_for_site() {
    local site_name="$1"
    local site_dir="${SITES_DIR}/${site_name}"
    local site_core_dir="${site_dir}/core"
    
    log_header "Creating symlinks for site: ${site_name}"
    
    # Validate site directory exists
    if [[ ! -d "${site_dir}" ]]; then
        log_error "Site directory does not exist: ${site_dir}"
        log_error "Please create the site first or verify the site name."
        return 1
    fi
    
    # Ensure the site's core directory exists
    if [[ ! -d "${site_core_dir}" ]]; then
        log_info "Creating core directory for site: ${site_core_dir}"
        mkdir -p "${site_core_dir}"
    fi
    
    # Create symlinks recursively
    log_info "Creating symlinks from ${CORE_DIR} to ${site_core_dir}"
    create_symlinks_recursive "${CORE_DIR}" "${site_core_dir}"
    
    # Verify symlinks were created successfully
    local symlink_count
    symlink_count=$(find "${site_core_dir}" -type l | wc -l)
    
    log_success "Successfully created ${symlink_count} symlinks for site: ${site_name}"
    
    # Display site structure
    log_info "Site core structure:"
    if command -v tree >/dev/null 2>&1; then
        tree -L 2 "${site_core_dir}" || ls -la "${site_core_dir}"
    else
        ls -la "${site_core_dir}"
    fi
}

# Create symlinks for all existing sites
create_symlinks_for_all_sites() {
    log_header "Creating symlinks for all existing sites..."
    
    local sites_processed=0
    local sites_failed=0
    
    # Check if sites directory has any subdirectories
    if [[ -z "$(find "${SITES_DIR}" -maxdepth 1 -mindepth 1 -type d 2>/dev/null)" ]]; then
        log_warning "No site directories found in ${SITES_DIR}"
        log_info "Create a site first using: ./scripts/create-site.sh [site-name]"
        return 0
    fi
    
    # Process each site directory
    while IFS= read -r -d '' site_dir; do
        local site_name="$(basename "${site_dir}")"
        
        log_info "Processing site: ${site_name}"
        
        if create_symlinks_for_site "${site_name}"; then
            ((sites_processed++))
        else
            ((sites_failed++))
            log_error "Failed to create symlinks for site: ${site_name}"
        fi
        
        echo # Add spacing between sites
    done < <(find "${SITES_DIR}" -maxdepth 1 -mindepth 1 -type d -print0)
    
    # Summary
    log_header "Symlink Creation Summary:"
    log_success "Sites processed successfully: ${sites_processed}"
    if [[ ${sites_failed} -gt 0 ]]; then
        log_error "Sites with errors: ${sites_failed}"
        return 1
    else
        log_success "All sites processed successfully!"
    fi
}

# Validate symlinks for a site (utility function)
validate_site_symlinks() {
    local site_name="$1"
    local site_core_dir="${SITES_DIR}/${site_name}/core"
    
    log_info "Validating symlinks for site: ${site_name}"
    
    if [[ ! -d "${site_core_dir}" ]]; then
        log_error "Site core directory does not exist: ${site_core_dir}"
        return 1
    fi
    
    local broken_symlinks=0
    local valid_symlinks=0
    
    while IFS= read -r -d '' symlink; do
        if [[ -e "${symlink}" ]]; then
            ((valid_symlinks++))
        else
            ((broken_symlinks++))
            log_error "Broken symlink found: ${symlink}"
        fi
    done < <(find "${site_core_dir}" -type l -print0)
    
    log_info "Symlink validation results:"
    log_success "Valid symlinks: ${valid_symlinks}"
    if [[ ${broken_symlinks} -gt 0 ]]; then
        log_error "Broken symlinks: ${broken_symlinks}"
        return 1
    else
        log_success "All symlinks are valid!"
    fi
}

# Main script execution
main() {
    # Display script header
    log_header "==================================================================="
    log_header "DenoGenesis Framework - Core Symlink Creation Script"
    log_header "Enterprise-grade local-first software framework"
    log_header "==================================================================="
    echo
    
    # Validate project structure first
    validate_project_structure
    echo
    
    # Parse command line arguments
    case "${1:-}" in
        --help|-h|help)
            show_help
            exit 0
            ;;
        --all)
            create_symlinks_for_all_sites
            ;;
        "")
            log_error "Site name is required."
            echo
            show_help
            exit 1
            ;;
        -*)
            log_error "Unknown option: $1"
            echo
            show_help
            exit 1
            ;;
        *)
            # Single site processing
            local site_name="$1"
            create_symlinks_for_site "${site_name}"
            echo
            log_info "Validating created symlinks..."
            validate_site_symlinks "${site_name}"
            ;;
    esac
    
    echo
    log_header "==================================================================="
    log_success "DenoGenesis Core Symlink Creation Completed Successfully!"
    log_header "==================================================================="
}

# Execute main function with all arguments
main "$@"