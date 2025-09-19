#!/bin/bash

set -e

# ========================================================
# Comprehensive Neovim Setup Script for Deno Development
# ========================================================
# 
# This script generates a complete Neovim configuration 
# optimized for Deno TypeScript development with:
# - Modern lazy.nvim plugin management
# - Deno LSP with TypeScript conflict resolution
# - Database-aware completion for multi-tenant apps
# - Performance optimizations
# - Automated backup and installation
#
# Usage:
#   chmod +x setup-nvim.sh
#   ./setup-nvim.sh [OPTIONS]
#
# Options:
#   --minimal       Install minimal configuration
#   --backup-only   Only backup existing config
#   --skip-plugins  Skip plugin installation
#   --verbose       Show detailed output
#   --help          Show this help message
#
# ========================================================

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Script configuration
SCRIPT_NAME="$(basename "$0")"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

# Default options
MINIMAL=false
BACKUP_ONLY=false
SKIP_PLUGINS=false
VERBOSE=false

# Platform detection
detect_platform() {
    local os_name
    os_name="$(uname -s)"
    
    case "$os_name" in
        Linux*)
            echo "linux"
            ;;
        Darwin*)
            echo "macos"
            ;;
        CYGWIN*|MINGW*|MSYS*)
            echo "windows"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# Get platform-specific paths
get_config_paths() {
    local platform="$1"
    
    case "$platform" in
        linux|macos)
            NVIM_CONFIG_PATH="${XDG_CONFIG_HOME:-$HOME/.config}/nvim"
            NVIM_DATA_PATH="${XDG_DATA_HOME:-$HOME/.local/share}/nvim"
            NVIM_STATE_PATH="${XDG_STATE_HOME:-$HOME/.local/state}/nvim"
            ;;
        windows)
            NVIM_CONFIG_PATH="$HOME/AppData/Local/nvim"
            NVIM_DATA_PATH="$HOME/AppData/Local/nvim-data"
            NVIM_STATE_PATH="$HOME/AppData/Local/nvim-state"
            ;;
        *)
            log_error "Unsupported platform: $platform"
            exit 1
            ;;
    esac
}

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_header() {
    echo -e "\n${BLUE}═══${NC} ${PURPLE}$1${NC} ${BLUE}═══${NC}"
}

log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${CYAN}[DEBUG]${NC} $1"
    fi
}

# Show usage information
show_usage() {
    cat << EOF
${SCRIPT_NAME} - Neovim Setup Script for Deno Development

USAGE:
    ${SCRIPT_NAME} [OPTIONS]

OPTIONS:
    --minimal       Install minimal configuration (fewer plugins)
    --backup-only   Only backup existing configuration
    --skip-plugins  Skip automatic plugin installation
    --verbose       Enable verbose output
    --help          Show this help message

EXAMPLES:
    ${SCRIPT_NAME}                  # Full installation
    ${SCRIPT_NAME} --minimal        # Minimal setup
    ${SCRIPT_NAME} --backup-only    # Backup only
    ${SCRIPT_NAME} --verbose        # Detailed output

FEATURES:
    • Modern lazy.nvim plugin management
    • Deno LSP with TypeScript conflict resolution
    • Database-aware completion for multi-tenant development
    • Performance-optimized configuration
    • Automatic backup of existing configurations
    • Cross-platform support (Linux, macOS, Windows)

EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --minimal)
                MINIMAL=true
                shift
                ;;
            --backup-only)
                BACKUP_ONLY=true
                shift
                ;;
            --skip-plugins)
                SKIP_PLUGINS=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check version requirements
check_version() {
    local cmd="$1"
    local min_version="$2"
    local version_flag="$3"
    
    if ! command_exists "$cmd"; then
        return 1
    fi
    
    local current_version
    current_version=$($cmd $version_flag 2>/dev/null | head -n1 | grep -oE '[0-9]+\.[0-9]+([0-9\.]*)?')
    
    if [ -z "$current_version" ]; then
        return 1
    fi
    
    # Simple version comparison (assumes semantic versioning)
    local min_major min_minor
    min_major=$(echo "$min_version" | cut -d. -f1)
    min_minor=$(echo "$min_version" | cut -d. -f2)
    
    local cur_major cur_minor
    cur_major=$(echo "$current_version" | cut -d. -f1)
    cur_minor=$(echo "$current_version" | cut -d. -f2)
    
    if [ "$cur_major" -gt "$min_major" ]; then
        return 0
    elif [ "$cur_major" -eq "$min_major" ] && [ "$cur_minor" -ge "$min_minor" ]; then
        return 0
    else
        return 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_header "Checking Prerequisites"
    
    local missing_deps=()
    
    # Check Neovim
    if ! check_version "nvim" "0.8" "--version"; then
        missing_deps+=("neovim >= 0.8")
    else
        local nvim_version
        nvim_version=$(nvim --version | head -n1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
        log_info "Neovim version: $nvim_version ✓"
    fi
    
    # Check Deno
    if ! command_exists "deno"; then
        missing_deps+=("deno")
    else
        local deno_version
        deno_version=$(deno --version | head -n1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
        log_info "Deno version: $deno_version ✓"
    fi
    
    # Check essential tools
    local essential_tools=("git" "curl" "unzip")
    for tool in "${essential_tools[@]}"; do
        if ! command_exists "$tool"; then
            missing_deps+=("$tool")
        else
            log_verbose "$tool found ✓"
        fi
    done
    
    # Check optional but recommended tools
    local optional_tools=("rg" "fd" "fzf" "gcc" "make")
    for tool in "${optional_tools[@]}"; do
        if ! command_exists "$tool"; then
            log_warn "Optional tool missing: $tool (recommended for better experience)"
        else
            log_verbose "Optional tool found: $tool ✓"
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies:"
        for dep in "${missing_deps[@]}"; do
            log_error "  - $dep"
        done
        
        log_info "\nInstallation suggestions:"
        log_info "  Neovim: https://neovim.io/doc/user/install.html"
        log_info "  Deno: curl -fsSL https://deno.land/install.sh | sh"
        log_info "  ripgrep: https://github.com/BurntSushi/ripgrep#installation"
        
        exit 1
    fi
    
    log_success "All prerequisites satisfied"
}

# Backup existing configuration
backup_configuration() {
    log_header "Backing Up Existing Configuration"
    
    local config_exists=false
    local data_exists=false
    local state_exists=false
    
    # Check what exists
    [ -d "$NVIM_CONFIG_PATH" ] && config_exists=true
    [ -d "$NVIM_DATA_PATH" ] && data_exists=true
    [ -d "$NVIM_STATE_PATH" ] && state_exists=true
    
    if [ "$config_exists" = false ] && [ "$data_exists" = false ] && [ "$state_exists" = false ]; then
        log_info "No existing Neovim configuration found"
        return 0
    fi
    
    # Create backup directory
    local backup_dir="$HOME/.nvim-backup-$TIMESTAMP"
    mkdir -p "$backup_dir"
    
    # Backup configuration
    if [ "$config_exists" = true ]; then
        log_info "Backing up configuration directory..."
        cp -r "$NVIM_CONFIG_PATH" "$backup_dir/config"
        log_verbose "Configuration backed up to: $backup_dir/config"
    fi
    
    # Backup data
    if [ "$data_exists" = true ]; then
        log_info "Backing up data directory..."
        cp -r "$NVIM_DATA_PATH" "$backup_dir/data"
        log_verbose "Data backed up to: $backup_dir/data"
    fi
    
    # Backup state
    if [ "$state_exists" = true ]; then
        log_info "Backing up state directory..."
        cp -r "$NVIM_STATE_PATH" "$backup_dir/state"
        log_verbose "State backed up to: $backup_dir/state"
    fi
    
    log_success "Backup completed: $backup_dir"
    
    # If backup-only mode, exit here
    if [ "$BACKUP_ONLY" = true ]; then
        log_info "Backup-only mode completed. Exiting."
        exit 0
    fi
    
    # Remove existing directories for fresh install
    [ "$config_exists" = true ] && rm -rf "$NVIM_CONFIG_PATH"
    [ "$data_exists" = true ] && rm -rf "$NVIM_DATA_PATH"
    [ "$state_exists" = true ] && rm -rf "$NVIM_STATE_PATH"
    
    log_info "Existing configuration removed for fresh installation"
}

# Create directory structure
create_directory_structure() {
    log_header "Creating Directory Structure"
    
    local directories=(
        "$NVIM_CONFIG_PATH"
        "$NVIM_CONFIG_PATH/lua"
        "$NVIM_CONFIG_PATH/lua/config"
        "$NVIM_CONFIG_PATH/lua/plugins"
        "$NVIM_CONFIG_PATH/snippets"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        log_verbose "Created directory: $dir"
    done
    
    log_success "Directory structure created"
}

# Generate init.lua
create_init_lua() {
    log_verbose "Creating init.lua..."
    
    cat > "$NVIM_CONFIG_PATH/init.lua" << 'EOF'
-- Neovim Configuration for Deno Genesis TypeScript Development
-- Auto-generated by setup-nvim.sh

vim.g.mapleader = " "
vim.g.maplocalleader = "\\"

-- Disable unnecessary providers for better performance
vim.g.loaded_python3_provider = 0
vim.g.loaded_ruby_provider = 0
vim.g.loaded_perl_provider = 0
vim.g.loaded_node_provider = 0

-- Bootstrap lazy.nvim
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system({
    "git",
    "clone",
    "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--branch=stable",
    lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

-- Load core configuration
require("config.options")
require("config.keymaps")
require("config.autocmds")

-- Setup plugins with performance optimizations
require("lazy").setup("plugins", {
  defaults = {
    lazy = false,
    version = false,
  },
  performance = {
    cache = {
      enabled = true,
    },
    reset_packpath = true,
    rtp = {
      disabled_plugins = {
        "gzip",
        "matchit",
        "matchparen",
        "netrwPlugin",
        "tarPlugin",
        "tohtml",
        "tutor",
        "zipPlugin",
      },
    },
  },
  install = { colorscheme = { "tokyonight" } },
  checker = { enabled = true, notify = false },
  change_detection = { notify = false },
})
EOF
}

# Generate options.lua
create_options_lua() {
    log_verbose "Creating config/options.lua..."
    
    cat > "$NVIM_CONFIG_PATH/lua/config/options.lua" << 'EOF'
-- Neovim options optimized for Deno TypeScript development

local opt = vim.opt

-- Performance optimizations
opt.lazyredraw = true
opt.updatetime = 250
opt.timeoutlen = 300
opt.ttimeoutlen = 10

-- File handling
opt.backup = false
opt.writebackup = false
opt.swapfile = false
opt.undofile = true
opt.undolevels = 10000
opt.autoread = true
opt.hidden = true

-- Editor behavior
opt.clipboard = "unnamedplus"
opt.completeopt = "menu,menuone,noselect"
opt.conceallevel = 3
opt.confirm = true
opt.cursorline = true
opt.expandtab = true
opt.formatoptions = "jcroqlnt"
opt.grepformat = "%f:%l:%c:%m"
opt.grepprg = "rg --vimgrep"
opt.ignorecase = true
opt.smartcase = true
opt.smartindent = true
opt.inccommand = "nosplit"
opt.laststatus = 3
opt.list = true
opt.mouse = "a"
opt.number = true
opt.relativenumber = true
opt.pumblend = 10
opt.pumheight = 10
opt.scrolloff = 4
opt.sessionoptions = { "buffers", "curdir", "tabpages", "winsize", "help", "globals", "skiprtp", "folds" }
opt.shiftround = true
opt.shiftwidth = 2
opt.shortmess:append({ W = true, I = true, c = true, C = true })
opt.showmode = false
opt.sidescrolloff = 8
opt.signcolumn = "yes"
opt.smartcase = true
opt.spelllang = { "en" }
opt.splitbelow = true
opt.splitkeep = "screen"
opt.splitright = true
opt.tabstop = 2
opt.termguicolors = true
opt.timeoutlen = 300
opt.undofile = true
opt.undolevels = 10000
opt.updatetime = 200
opt.virtualedit = "block"
opt.wildmode = "longest:full,full"
opt.winminwidth = 5
opt.wrap = false
opt.fillchars = {
  foldopen = "",
  foldclose = "",
  fold = " ",
  foldsep = " ",
  diff = "╱",
  eob = " ",
}

-- Fix markdown indentation settings
vim.g.markdown_recommended_style = 0
EOF
}

# Generate keymaps.lua
create_keymaps_lua() {
    log_verbose "Creating config/keymaps.lua..."
    
    cat > "$NVIM_CONFIG_PATH/lua/config/keymaps.lua" << 'EOF'
-- Key mappings optimized for Deno development workflow

local function map(mode, lhs, rhs, opts)
  local keys = require("lazy.core.handler").handlers.keys
  if not keys.active[keys.parse({ lhs, mode = mode }).id] then
    opts = opts or {}
    opts.silent = opts.silent ~= false
    if opts.remap and not vim.g.vscode then
      opts.remap = nil
    end
    vim.keymap.set(mode, lhs, rhs, opts)
  end
end

-- Better up/down
map({ "n", "x" }, "j", "v:count == 0 ? 'gj' : 'j'", { expr = true, silent = true })
map({ "n", "x" }, "<Down>", "v:count == 0 ? 'gj' : 'j'", { expr = true, silent = true })
map({ "n", "x" }, "k", "v:count == 0 ? 'gk' : 'k'", { expr = true, silent = true })
map({ "n", "x" }, "<Up>", "v:count == 0 ? 'gk' : 'k'", { expr = true, silent = true })

-- Move to window using the <ctrl> hjkl keys
map("n", "<C-h>", "<C-w>h", { desc = "Go to left window", remap = true })
map("n", "<C-j>", "<C-w>j", { desc = "Go to lower window", remap = true })
map("n", "<C-k>", "<C-w>k", { desc = "Go to upper window", remap = true })
map("n", "<C-l>", "<C-w>l", { desc = "Go to right window", remap = true })

-- Resize window using <ctrl> arrow keys
map("n", "<C-Up>", "<cmd>resize +2<cr>", { desc = "Increase window height" })
map("n", "<C-Down>", "<cmd>resize -2<cr>", { desc = "Decrease window height" })
map("n", "<C-Left>", "<cmd>vertical resize -2<cr>", { desc = "Decrease window width" })
map("n", "<C-Right>", "<cmd>vertical resize +2<cr>", { desc = "Increase window width" })

-- Move Lines
map("n", "<A-j>", "<cmd>m .+1<cr>==", { desc = "Move down" })
map("n", "<A-k>", "<cmd>m .-2<cr>==", { desc = "Move up" })
map("i", "<A-j>", "<esc><cmd>m .+1<cr>==gi", { desc = "Move down" })
map("i", "<A-k>", "<esc><cmd>m .-2<cr>==gi", { desc = "Move up" })
map("v", "<A-j>", ":m '>+1<cr>gv=gv", { desc = "Move down" })
map("v", "<A-k>", ":m '<-2<cr>gv=gv", { desc = "Move up" })

-- Buffers
map("n", "<S-h>", "<cmd>bprevious<cr>", { desc = "Prev buffer" })
map("n", "<S-l>", "<cmd>bnext<cr>", { desc = "Next buffer" })
map("n", "[b", "<cmd>bprevious<cr>", { desc = "Prev buffer" })
map("n", "]b", "<cmd>bnext<cr>", { desc = "Next buffer" })
map("n", "<leader>bb", "<cmd>e #<cr>", { desc = "Switch to Other Buffer" })
map("n", "<leader>`", "<cmd>e #<cr>", { desc = "Switch to Other Buffer" })

-- Clear search with <esc>
map({ "i", "n" }, "<esc>", "<cmd>noh<cr><esc>", { desc = "Escape and clear hlsearch" })

-- Save file
map({ "i", "x", "n", "s" }, "<C-s>", "<cmd>w<cr><esc>", { desc = "Save file" })

-- Better indenting
map("v", "<", "<gv")
map("v", ">", ">gv")

-- Lazy
map("n", "<leader>l", "<cmd>Lazy<cr>", { desc = "Lazy" })

-- New file
map("n", "<leader>fn", "<cmd>enew<cr>", { desc = "New File" })

-- Location and quickfix lists
map("n", "<leader>xl", "<cmd>lopen<cr>", { desc = "Location List" })
map("n", "<leader>xq", "<cmd>copen<cr>", { desc = "Quickfix List" })

map("n", "[q", vim.cmd.cprev, { desc = "Previous quickfix" })
map("n", "]q", vim.cmd.cnext, { desc = "Next quickfix" })

-- Diagnostic keymaps
map("n", "[d", vim.diagnostic.goto_prev, { desc = "Go to previous diagnostic" })
map("n", "]d", vim.diagnostic.goto_next, { desc = "Go to next diagnostic" })
map("n", "<leader>e", vim.diagnostic.open_float, { desc = "Open floating diagnostic message" })
map("n", "<leader>q", vim.diagnostic.setloclist, { desc = "Open diagnostics list" })

-- Deno-specific keymaps
map("n", "<leader>dr", "<cmd>!deno run %<cr>", { desc = "Run with Deno" })
map("n", "<leader>dt", "<cmd>!deno test %<cr>", { desc = "Test with Deno" })
map("n", "<leader>df", "<cmd>!deno fmt %<cr>", { desc = "Format with Deno" })
map("n", "<leader>dl", "<cmd>!deno lint %<cr>", { desc = "Lint with Deno" })
map("n", "<leader>dc", "<cmd>!deno check %<cr>", { desc = "Type check with Deno" })
map("n", "<leader>di", "<cmd>!deno info %<cr>", { desc = "Deno info" })

-- Terminal
map("n", "<leader>tt", "<cmd>terminal<cr>", { desc = "Open terminal" })
map("t", "<Esc>", "<C-\\><C-n>", { desc = "Exit terminal mode" })

-- Windows
map("n", "<leader>ww", "<C-W>p", { desc = "Other window", remap = true })
map("n", "<leader>wd", "<C-W>c", { desc = "Delete window", remap = true })
map("n", "<leader>w-", "<C-W>s", { desc = "Split window below", remap = true })
map("n", "<leader>w|", "<C-W>v", { desc = "Split window right", remap = true })
map("n", "<leader>-", "<C-W>s", { desc = "Split window below", remap = true })
map("n", "<leader>|", "<C-W>v", { desc = "Split window right", remap = true })

-- Tabs
map("n", "<leader><tab>l", "<cmd>tablast<cr>", { desc = "Last Tab" })
map("n", "<leader><tab>f", "<cmd>tabfirst<cr>", { desc = "First Tab" })
map("n", "<leader><tab><tab>", "<cmd>tabnew<cr>", { desc = "New Tab" })
map("n", "<leader><tab>]", "<cmd>tabnext<cr>", { desc = "Next Tab" })
map("n", "<leader><tab>d", "<cmd>tabclose<cr>", { desc = "Close Tab" })
map("n", "<leader><tab>[", "<cmd>tabprevious<cr>", { desc = "Previous Tab" })
EOF
}

# Generate autocmds.lua
create_autocmds_lua() {
    log_verbose "Creating config/autocmds.lua..."
    
    cat > "$NVIM_CONFIG_PATH/lua/config/autocmds.lua" << 'EOF'
-- Auto commands for enhanced Deno TypeScript development

local function augroup(name)
  return vim.api.nvim_create_augroup("deno_genesis_" .. name, { clear = true })
end

-- Resize splits if window got resized
vim.api.nvim_create_autocmd({ "VimResized" }, {
  group = augroup("resize_splits"),
  callback = function()
    local current_tab = vim.fn.tabpagenr()
    vim.cmd("tabdo wincmd =")
    vim.cmd("tabnext " .. current_tab)
  end,
})

-- Go to last loc when opening a buffer
vim.api.nvim_create_autocmd("BufReadPost", {
  group = augroup("last_loc"),
  callback = function(event)
    local exclude = { "gitcommit" }
    local buf = event.buf
    if vim.tbl_contains(exclude, vim.bo[buf].filetype) or vim.b[buf].deno_genesis_last_loc then
      return
    end
    vim.b[buf].deno_genesis_last_loc = true
    local mark = vim.api.nvim_buf_get_mark(buf, '"')
    local lcount = vim.api.nvim_buf_line_count(buf)
    if mark[1] > 0 and mark[1] <= lcount then
      pcall(vim.api.nvim_win_set_cursor, 0, mark)
    end
  end,
})

-- Close some filetypes with <q>
vim.api.nvim_create_autocmd("FileType", {
  group = augroup("close_with_q"),
  pattern = {
    "PlenaryTestPopup",
    "help",
    "lspinfo",
    "man",
    "notify",
    "qf",
    "query",
    "spectre_panel",
    "startuptime",
    "tsplayground",
    "neotest-output",
    "checkhealth",
    "neotest-summary",
    "neotest-output-panel",
  },
  callback = function(event)
    vim.bo[event.buf].buflisted = false
    vim.keymap.set("n", "q", "<cmd>close<cr>", { buffer = event.buf, silent = true })
  end,
})

-- Wrap and check for spell in text filetypes
vim.api.nvim_create_autocmd("FileType", {
  group = augroup("wrap_spell"),
  pattern = { "gitcommit", "markdown" },
  callback = function()
    vim.opt_local.wrap = true
    vim.opt_local.spell = true
  end,
})

-- Auto create dir when saving a file, in case some intermediate directory does not exist
vim.api.nvim_create_autocmd({ "BufWritePre" }, {
  group = augroup("auto_create_dir"),
  callback = function(event)
    if event.match:match("^%w%w+://") then
      return
    end
    local file = vim.loop.fs_realpath(event.match) or event.match
    vim.fn.mkdir(vim.fn.fnamemodify(file, ":p:h"), "p")
  end,
})

-- Highlight on yank
vim.api.nvim_create_autocmd("TextYankPost", {
  group = augroup("highlight_yank"),
  callback = function()
    vim.highlight.on_yank()
  end,
})

-- Deno project detection and LSP setup
vim.api.nvim_create_autocmd({ "BufEnter", "BufNewFile" }, {
  group = augroup("deno_detection"),
  pattern = "*.ts,*.tsx,*.js,*.jsx",
  callback = function()
    local is_deno_project = vim.fn.findfile("deno.json", ".;") ~= ""
      or vim.fn.findfile("deno.jsonc", ".;") ~= ""
      or vim.fn.findfile("deps.ts", ".;") ~= ""
      or vim.fn.findfile("mod.ts", ".;") ~= ""
    
    if is_deno_project then
      vim.b.deno_project = true
      -- Additional Deno-specific settings can be applied here
    end
  end,
})
EOF
}

# Generate LSP configuration
create_lsp_config() {
    log_verbose "Creating plugins/lsp.lua..."
    
    cat > "$NVIM_CONFIG_PATH/lua/plugins/lsp.lua" << 'EOF'
-- LSP configuration with Deno and TypeScript conflict resolution

return {
  {
    "neovim/nvim-lspconfig",
    event = { "BufReadPost", "BufNewFile" },
    dependencies = {
      "mason.nvim",
      "williamboman/mason-lspconfig.nvim",
    },
    opts = {
      diagnostics = {
        underline = true,
        update_in_insert = false,
        virtual_text = {
          spacing = 4,
          source = "if_many",
          prefix = "●",
        },
        severity_sort = true,
      },
      inlay_hints = {
        enabled = true,
      },
      capabilities = {},
      format = {
        formatting_options = nil,
        timeout_ms = nil,
      },
      servers = {
        denols = {
          root_dir = function(fname)
            local util = require("lspconfig.util")
            return util.root_pattern("deno.json", "deno.jsonc", "deps.ts", "mod.ts")(fname)
          end,
          init_options = {
            lint = true,
            unstable = true,
            suggest = {
              imports = {
                hosts = {
                  ["https://deno.land"] = true,
                  ["https://cdn.nest.land"] = true,
                  ["https://crux.land"] = true,
                },
              },
            },
          },
          settings = {
            deno = {
              enable = true,
              lint = true,
              unstable = true,
            },
          },
        },
        ts_ls = {
          root_dir = function(fname)
            local util = require("lspconfig.util")
            local is_deno = util.root_pattern("deno.json", "deno.jsonc", "deps.ts", "mod.ts")(fname)
            if is_deno then
              return nil
            end
            return util.root_pattern("package.json", "tsconfig.json", "jsconfig.json")(fname)
          end,
          single_file_support = false,
          settings = {
            typescript = {
              inlayHints = {
                includeInlayParameterNameHints = "literal",
                includeInlayParameterNameHintsWhenArgumentMatchesName = false,
                includeInlayFunctionParameterTypeHints = true,
                includeInlayVariableTypeHints = false,
                includeInlayPropertyDeclarationTypeHints = true,
                includeInlayFunctionLikeReturnTypeHints = true,
                includeInlayEnumMemberValueHints = true,
              },
            },
            javascript = {
              inlayHints = {
                includeInlayParameterNameHints = "all",
                includeInlayParameterNameHintsWhenArgumentMatchesName = false,
                includeInlayFunctionParameterTypeHints = true,
                includeInlayVariableTypeHints = true,
                includeInlayPropertyDeclarationTypeHints = true,
                includeInlayFunctionLikeReturnTypeHints = true,
                includeInlayEnumMemberValueHints = true,
              },
            },
          },
        },
        lua_ls = {
          settings = {
            Lua = {
              workspace = {
                checkThirdParty = false,
              },
              completion = {
                callSnippet = "Replace",
              },
            },
          },
        },
      },
      setup = {},
    },
    config = function(_, opts)
      local servers = opts.servers
      local has_cmp, cmp_nvim_lsp = pcall(require, "cmp_nvim_lsp")
      local capabilities = vim.tbl_deep_extend(
        "force",
        {},
        vim.lsp.protocol.make_client_capabilities(),
        has_cmp and cmp_nvim_lsp.default_capabilities() or {},
        opts.capabilities or {}
      )

      local function setup(server)
        local server_opts = vim.tbl_deep_extend("force", {
          capabilities = vim.deepcopy(capabilities),
        }, servers[server] or {})

        if opts.setup[server] then
          if opts.setup[server](server, server_opts) then
            return
          end
        elseif opts.setup["*"] then
          if opts.setup["*"](server, server_opts) then
            return
          end
        end
        require("lspconfig")[server].setup(server_opts)
      end

      local have_mason, mlsp = pcall(require, "mason-lspconfig")
      local all_mslp_servers = {}
      if have_mason then
        all_mslp_servers = vim.tbl_keys(require("mason-lspconfig.mappings.server").lspconfig_to_package)
      end

      local ensure_installed = {}
      for server, server_opts in pairs(servers) do
        if server_opts then
          server_opts = server_opts == true and {} or server_opts
          if server_opts.mason == false or not vim.tbl_contains(all_mslp_servers, server) then
            setup(server)
          else
            ensure_installed[#ensure_installed + 1] = server
          end
        end
      end

      if have_mason then
        mlsp.setup({ ensure_installed = ensure_installed, handlers = { setup } })
      end

      -- Setup diagnostics
      vim.diagnostic.config(vim.deepcopy(opts.diagnostics))

      -- LspAttach autocommand
      vim.api.nvim_create_autocmd("LspAttach", {
        group = vim.api.nvim_create_augroup("deno_genesis_lsp_attach", { clear = true }),
        callback = function(event)
          local map = function(keys, func, desc)
            vim.keymap.set("n", keys, func, { buffer = event.buf, desc = "LSP: " .. desc })
          end

          map("gd", require("telescope.builtin").lsp_definitions, "[G]oto [D]efinition")
          map("gr", require("telescope.builtin").lsp_references, "[G]oto [R]eferences")
          map("gI", require("telescope.builtin").lsp_implementations, "[G]oto [I]mplementation")
          map("<leader>D", require("telescope.builtin").lsp_type_definitions, "Type [D]efinition")
          map("<leader>ds", require("telescope.builtin").lsp_document_symbols, "[D]ocument [S]ymbols")
          map("<leader>ws", require("telescope.builtin").lsp_dynamic_workspace_symbols, "[W]orkspace [S]ymbols")
          map("<leader>rn", vim.lsp.buf.rename, "[R]e[n]ame")
          map("<leader>ca", vim.lsp.buf.code_action, "[C]ode [A]ction")
          map("K", vim.lsp.buf.hover, "Hover Documentation")
          map("gD", vim.lsp.buf.declaration, "[G]oto [D]eclaration")

          local client = vim.lsp.get_client_by_id(event.data.client_id)
          if client and client.server_capabilities.documentHighlightProvider then
            vim.api.nvim_create_autocmd({ "CursorHold", "CursorHoldI" }, {
              buffer = event.buf,
              callback = vim.lsp.buf.document_highlight,
            })

            vim.api.nvim_create_autocmd({ "CursorMoved", "CursorMovedI" }, {
              buffer = event.buf,
              callback = vim.lsp.buf.clear_references,
            })
          end
        end,
      })
    end,
  },

  -- Mason for LSP server management
  {
    "williamboman/mason.nvim",
    cmd = "Mason",
    build = ":MasonUpdate",
    opts = {
      ensure_installed = {
        "stylua",
        "shfmt",
      },
    },
    config = function(_, opts)
      require("mason").setup(opts)
      local mr = require("mason-registry")
      mr:on("package:install:success", function()
        vim.defer_fn(function()
          require("lazy.core.handler.event").trigger({
            event = "FileType",
            buf = vim.api.nvim_get_current_buf(),
          })
        end, 100)
      end)
      local function ensure_installed()
        for _, tool in ipairs(opts.ensure_installed) do
          local p = mr.get_package(tool)
          if not p:is_installed() then
            p:install()
          end
        end
      end
      if mr.refresh then
        mr.refresh(ensure_installed)
      else
        ensure_installed()
      end
    end,
  },
}
EOF