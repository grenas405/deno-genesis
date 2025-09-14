#!/bin/bash
# setup-nvim.sh - Modern Neovim Configuration for Deno Genesis TypeScript Development
#
# DenoGenesis Framework Compatible Neovim Setup
# Optimized for Deno's TypeScript environment with URL imports and centralized architecture
#
# Author: DenoGenesis Framework Team
# Version: 2.0.0
# Compatible with: Neovim 0.9+, Deno 1.40+
# Follows: Unix Philosophy + DenoGenesis Architecture Principles

set -euo pipefail

# =============================================================================
# CONFIGURATION & CONSTANTS
# =============================================================================

readonly SCRIPT_VERSION="2.0.0"
readonly REQUIRED_NVIM_VERSION="0.9"
readonly REQUIRED_DENO_VERSION="1.40"

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m' # No Color

# =============================================================================
# LOGGING & OUTPUT FUNCTIONS
# =============================================================================

log() { echo -e "${GREEN}[INFO]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }
debug() { echo -e "${BLUE}[DEBUG]${NC} $*"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
header() { echo -e "${PURPLE}[SETUP]${NC} ${WHITE}$*${NC}"; }

show_banner() {
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                    DenoGenesis Framework                     ║
║                 Modern Neovim Configuration                  ║
║                                                              ║
║    🚀 TypeScript-First Development Environment               ║
║    🦕 Deno LSP Integration & Conflict Resolution             ║
║    ⚡ Performance Optimized with lazy.nvim                  ║
║    🎯 Zero Version Drift Architecture                        ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo
}

# =============================================================================
# SYSTEM DETECTION & PREREQUISITES
# =============================================================================

detect_os() {
    case "$(uname -s)" in
        Darwin) echo "macos" ;;
        Linux) echo "linux" ;;
        CYGWIN*|MINGW*|MSYS*) echo "windows" ;;
        *) echo "unknown" ;;
    esac
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        return 1
    fi
    return 0
}

version_ge() {
    printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

check_prerequisites() {
    header "Checking Prerequisites"
    
    local os_type
    os_type=$(detect_os)
    log "Operating System: $os_type"
    
    # Check Neovim
    if ! check_command nvim; then
        error "Neovim not found. Please install Neovim >= $REQUIRED_NVIM_VERSION"
        case "$os_type" in
            "macos") error "Install with: brew install neovim" ;;
            "linux") error "Install with: sudo apt install neovim (Ubuntu/Debian) or equivalent" ;;
        esac
        exit 1
    fi
    
    local nvim_version
    nvim_version=$(nvim --version | head -n1 | grep -oE '[0-9]+\.[0-9]+' | head -n1)
    if ! version_ge "$nvim_version" "$REQUIRED_NVIM_VERSION"; then
        error "Neovim version $nvim_version is too old. Requires >= $REQUIRED_NVIM_VERSION"
        exit 1
    fi
    success "Neovim $nvim_version detected"
    
    # Check Deno
    if ! check_command deno; then
        error "Deno not found. Please install Deno first:"
        error "curl -fsSL https://deno.land/install.sh | sh"
        exit 1
    fi
    
    local deno_version
    deno_version=$(deno --version | head -n1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
    if ! version_ge "$deno_version" "$REQUIRED_DENO_VERSION"; then
        error "Deno version $deno_version is too old. Requires >= $REQUIRED_DENO_VERSION"
        exit 1
    fi
    success "Deno $deno_version detected"
    
    # Check essential dependencies
    local deps=("git" "curl" "unzip")
    for dep in "${deps[@]}"; do
        if ! check_command "$dep"; then
            error "Missing dependency: $dep"
            exit 1
        fi
    done
    
    # Check build tools for native extensions
    if ! check_command gcc && ! check_command clang; then
        warn "No C compiler found. Some plugins may not compile."
        case "$os_type" in
            "macos") warn "Install Xcode Command Line Tools: xcode-select --install" ;;
            "linux") warn "Install build-essential: sudo apt install build-essential" ;;
        esac
    fi
    
    # Check optional performance tools
    if ! check_command rg; then
        warn "ripgrep not found. Install for better search performance:"
        case "$os_type" in
            "macos") warn "  brew install ripgrep" ;;
            "linux") warn "  sudo apt install ripgrep" ;;
        esac
    fi
    
    if ! check_command fd; then
        warn "fd not found. Install for better file finding:"
        case "$os_type" in
            "macos") warn "  brew install fd" ;;
            "linux") warn "  sudo apt install fd-find" ;;
        esac
    fi
    
    success "Prerequisites check passed"
}

# =============================================================================
# BACKUP & CLEANUP FUNCTIONS
# =============================================================================

backup_existing_config() {
    header "Backing Up Existing Configuration"
    
    local config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/nvim"
    local data_dir="${XDG_DATA_HOME:-$HOME/.local/share}/nvim"
    local state_dir="${XDG_STATE_HOME:-$HOME/.local/state}/nvim"
    local cache_dir="${XDG_CACHE_HOME:-$HOME/.cache}/nvim"
    
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    
    # Backup config directory
    if [[ -d "$config_dir" ]]; then
        local backup_dir="${config_dir}.backup.${timestamp}"
        log "Backing up existing config to $backup_dir"
        mv "$config_dir" "$backup_dir"
        success "Configuration backed up to $backup_dir"
    fi
    
    # Clean data directories for fresh start
    for dir in "$data_dir" "$state_dir" "$cache_dir"; do
        if [[ -d "$dir" ]]; then
            log "Cleaning $dir for fresh installation"
            rm -rf "$dir"
        fi
    done
    
    success "Backup and cleanup completed"
}

# =============================================================================
# NEOVIM CONFIGURATION GENERATION
# =============================================================================

create_directory_structure() {
    header "Creating Neovim Directory Structure"
    
    local config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/nvim"
    
    # Create directory structure following lazy.nvim standards
    mkdir -p "$config_dir/lua/config"
    mkdir -p "$config_dir/lua/plugins"
    mkdir -p "$config_dir/lua/util"
    
    success "Directory structure created"
}

generate_init_lua() {
    local config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/nvim"
    
    cat > "$config_dir/init.lua" << 'EOF'
-- init.lua - DenoGenesis Framework Neovim Configuration
-- Optimized for Deno TypeScript development with zero version drift
-- Compatible with centralized DenoGenesis architecture

vim.g.mapleader = " "
vim.g.maplocalleader = "\\"

-- Disable built-in plugins for faster startup
vim.g.loaded_gzip = 1
vim.g.loaded_zip = 1
vim.g.loaded_zipPlugin = 1
vim.g.loaded_tar = 1
vim.g.loaded_tarPlugin = 1
vim.g.loaded_getscript = 1
vim.g.loaded_getscriptPlugin = 1
vim.g.loaded_vimball = 1
vim.g.loaded_vimballPlugin = 1
vim.g.loaded_2html_plugin = 1
vim.g.loaded_netrw = 1
vim.g.loaded_netrwPlugin = 1
vim.g.loaded_netrwSettings = 1
vim.g.loaded_netrwFileHandlers = 1

-- Bootstrap lazy.nvim plugin manager
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

-- Initialize plugin system
require("lazy").setup("plugins", {
  defaults = {
    lazy = true, -- Enable lazy loading by default
    version = false, -- Always use latest stable version
  },
  install = {
    colorscheme = { "tokyonight-night" },
    missing = true, -- Install missing plugins
  },
  checker = {
    enabled = true, -- Check for plugin updates
    notify = false, -- Don't notify about updates
    frequency = 3600, -- Check every hour
  },
  change_detection = {
    enabled = true, -- Auto-reload config changes
    notify = false, -- Don't show notifications
  },
  performance = {
    cache = {
      enabled = true,
    },
    reset_packpath = true,
    rtp = {
      disabled_plugins = {
        "gzip",
        "tarPlugin",
        "tohtml",
        "tutor",
        "zipPlugin",
      },
    },
  },
  ui = {
    border = "rounded",
    backdrop = 60,
  },
})
EOF

    log "Created init.lua"
}

generate_options_lua() {
    local config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/nvim"
    
    cat > "$config_dir/lua/config/options.lua" << 'EOF'
-- options.lua - Core Neovim settings optimized for Deno development
-- Follows DenoGenesis UI guidelines and performance best practices

local opt = vim.opt

-- =============================================================================
-- UI & DISPLAY SETTINGS
-- =============================================================================

-- Line numbers and visual guides
opt.number = true
opt.relativenumber = true
opt.signcolumn = "yes:2"  -- Always show sign column with 2 characters
opt.cursorline = true
opt.cursorcolumn = false  -- Disable for performance
opt.colorcolumn = "80,120"  -- Guide lines for code width

-- Scrolling behavior
opt.scrolloff = 8         -- Keep 8 lines above/below cursor
opt.sidescrolloff = 8     -- Keep 8 columns left/right of cursor
opt.smoothscroll = true   -- Smooth scrolling (Neovim 0.10+)

-- Window splitting
opt.splitbelow = true     -- Horizontal splits below current
opt.splitright = true     -- Vertical splits to the right
opt.splitkeep = "screen"  -- Keep text on screen when splitting

-- Text wrapping
opt.wrap = false          -- Disable line wrapping for code
opt.linebreak = true      -- Break at word boundaries if wrap enabled
opt.breakindent = true    -- Preserve indentation in wrapped lines

-- =============================================================================
-- EDITING & INPUT SETTINGS
-- =============================================================================

-- Indentation (TypeScript/Deno standard: 2 spaces)
opt.expandtab = true      -- Use spaces instead of tabs
opt.shiftwidth = 2        -- Number of spaces for auto-indent
opt.tabstop = 2           -- Number of spaces for tab character
opt.softtabstop = 2       -- Number of spaces for tab in insert mode
opt.smartindent = true    -- Smart auto-indenting
opt.autoindent = true     -- Copy indent from current line

-- Text editing behavior
opt.backspace = "indent,eol,start"  -- Intuitive backspace behavior
opt.whichwrap:append("<,>,[,],h,l")  -- Allow movement keys to wrap

-- Case sensitivity and searching
opt.ignorecase = true     -- Ignore case in search patterns
opt.smartcase = true      -- Override ignorecase if uppercase used
opt.hlsearch = true       -- Highlight search results
opt.incsearch = true      -- Incremental search

-- Command and completion
opt.completeopt = "menu,menuone,noselect,preview"
opt.shortmess:append("c") -- Don't show completion messages
opt.pumheight = 15        -- Maximum items in popup menu
opt.pumblend = 10         -- Transparency for popup menu
opt.winblend = 0          -- Window transparency

-- =============================================================================
-- PERFORMANCE & BEHAVIOR SETTINGS
-- =============================================================================

-- File handling
opt.backup = false        -- Don't create backup files
opt.writebackup = false   -- Don't backup before overwriting
opt.swapfile = false      -- Don't use swap files
opt.undofile = true       -- Persistent undo history
opt.undolevels = 10000    -- Maximum number of undo levels

-- Update and timeout settings
opt.updatetime = 200      -- CursorHold event trigger time (ms)
opt.timeoutlen = 300      -- Time to wait for key sequence (ms)
opt.ttimeoutlen = 10      -- Key code timeout

-- Mouse and clipboard
opt.mouse = "a"                    -- Enable mouse in all modes
opt.clipboard = "unnamedplus"      -- Use system clipboard
opt.virtualedit = "block"          -- Allow cursor past end of line in visual block

-- =============================================================================
-- FILE TYPE & FORMAT SETTINGS
-- =============================================================================

-- File encoding
opt.encoding = "utf-8"
opt.fileencoding = "utf-8"

-- Line endings
opt.fileformats = "unix,dos,mac"

-- Wildcard matching
opt.wildmode = "longest:full,full"
opt.wildignore:append({
  "*.o,*.obj,*.bin,*.dll,*.exe",
  "*/.git/*,*/.svn/*,*/.DS_Store",
  "*/node_modules/*,*/target/*,*/.build/*"
})

-- Folding (using TreeSitter)
opt.foldmethod = "expr"
opt.foldexpr = "nvim_treesitter#foldexpr()"
opt.foldlevel = 99        -- Don't fold by default
opt.foldlevelstart = 99   -- Don't fold when opening files

-- =============================================================================
-- TERMINAL & EXTERNAL TOOLS
-- =============================================================================

-- Terminal behavior
opt.termguicolors = true  -- True color support
opt.shell = vim.env.SHELL or "/bin/bash"

-- External formatting tools
opt.formatprg = "deno fmt -"  -- Use deno fmt as default formatter

-- =============================================================================
-- DENO-SPECIFIC SETTINGS
-- =============================================================================

-- Set up Deno-specific file detection
vim.api.nvim_create_autocmd({ "BufRead", "BufNewFile" }, {
  pattern = { "*.ts", "*.tsx", "*.js", "*.jsx" },
  callback = function()
    local root = vim.fs.root(0, { "deno.json", "deno.jsonc", "deno.lock" })
    if root then
      -- Mark buffer as Deno project
      vim.b.deno_project = true
      -- Set TypeScript compiler options for Deno
      vim.bo.compiler = "deno"
    end
  end,
})

-- Disable format on save for certain file types (let LSP handle it)
vim.g.autoformat_enabled = true
vim.g.autoformat_disable_filetypes = { "markdown" }

-- Performance optimizations for large files
opt.synmaxcol = 300       -- Don't syntax highlight long lines
opt.lazyredraw = false    -- Don't redraw during macros (can cause issues with modern terminals)
opt.regexpengine = 0      -- Use automatic regexp engine selection

-- Session management
opt.sessionoptions = "blank,buffers,curdir,folds,help,tabpages,winsize,winpos,terminal,localoptions"
EOF

    log "Created config/options.lua"
}

generate_keymaps_lua() {
    local config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/nvim"
    
    cat > "$config_dir/lua/config/keymaps.lua" << 'EOF'
-- keymaps.lua - Key mappings optimized for TypeScript development
-- Follows modern Neovim conventions and Deno Genesis workflow

local keymap = vim.keymap.set
local opts = { noremap = true, silent = true }
local expr_opts = { noremap = true, expr = true, silent = true }

-- =============================================================================
-- LEADER KEY CONFIGURATION
-- =============================================================================

-- Space as leader key is set in init.lua
-- Local leader for buffer-specific mappings
vim.g.maplocalleader = "\\"

-- =============================================================================
-- BASIC NAVIGATION & MOVEMENT
-- =============================================================================

-- Better window navigation
keymap("n", "<C-h>", "<C-w>h", opts)
keymap("n", "<C-j>", "<C-w>j", opts)
keymap("n", "<C-k>", "<C-w>k", opts)
keymap("n", "<C-l>", "<C-w>l", opts)

-- Terminal window navigation
keymap("t", "<C-h>", "<C-\\><C-N><C-w>h", opts)
keymap("t", "<C-j>", "<C-\\><C-N><C-w>j", opts)
keymap("t", "<C-k>", "<C-\\><C-N><C-w>k", opts)
keymap("t", "<C-l>", "<C-\\><C-N><C-w>l", opts)

-- Window resizing with arrows
keymap("n", "<C-Up>", "<cmd>resize -2<CR>", opts)
keymap("n", "<C-Down>", "<cmd>resize +2<CR>", opts)
keymap("n", "<C-Left>", "<cmd>vertical resize -2<CR>", opts)
keymap("n", "<C-Right>", "<cmd>vertical resize +2<CR>", opts)

-- Better page navigation
keymap("n", "<C-d>", "<C-d>zz", opts) -- Center after half page down
keymap("n", "<C-u>", "<C-u>zz", opts) -- Center after half page up
keymap("n", "n", "nzzzv", opts)       -- Center after next search
keymap("n", "N", "Nzzzv", opts)       -- Center after previous search

-- =============================================================================
-- BUFFER MANAGEMENT
-- =============================================================================

-- Buffer navigation
keymap("n", "<S-h>", "<cmd>bprevious<CR>", opts)
keymap("n", "<S-l>", "<cmd>bnext<CR>", opts)
keymap("n", "<leader>bb", "<cmd>e #<CR>", { desc = "Switch to Other Buffer" })
keymap("n", "<leader>bd", "<cmd>bdelete<CR>", { desc = "Delete Buffer" })
keymap("n", "<leader>bD", "<cmd>%bd|e#<CR>", { desc = "Delete All But Current" })

-- Quick save and quit
keymap("n", "<leader>w", "<cmd>w<CR>", { desc = "Save" })
keymap("n", "<leader>wa", "<cmd>wa<CR>", { desc = "Save All" })
keymap("n", "<leader>q", "<cmd>q<CR>", { desc = "Quit" })
keymap("n", "<leader>qa", "<cmd>qa<CR>", { desc = "Quit All" })
keymap("n", "<leader>wq", "<cmd>wq<CR>", { desc = "Save and Quit" })

-- =============================================================================
-- EDITING OPERATIONS
-- =============================================================================

-- Better indenting (maintain selection)
keymap("v", "<", "<gv", opts)
keymap("v", ">", ">gv", opts)

-- Move lines up and down
keymap("n", "<A-j>", "<cmd>m .+1<CR>==", { desc = "Move line down" })
keymap("n", "<A-k>", "<cmd>m .-2<CR>==", { desc = "Move line up" })
keymap("i", "<A-j>", "<esc><cmd>m .+1<CR>==gi", { desc = "Move line down" })
keymap("i", "<A-k>", "<esc><cmd>m .-2<CR>==gi", { desc = "Move line up" })
keymap("v", "<A-j>", ":m '>+1<CR>gv=gv", { desc = "Move selection down" })
keymap("v", "<A-k>", ":m '<-2<CR>gv=gv", { desc = "Move selection up" })

-- Better paste behavior
keymap("v", "p", '"_dP', opts) -- Paste without yanking replaced text
keymap("x", "<leader>p", '"_dP', { desc = "Paste without yanking" })

-- Delete without yanking
keymap("n", "<leader>d", '"_d', { desc = "Delete without yanking" })
keymap("v", "<leader>d", '"_d', { desc = "Delete without yanking" })

-- Yank to system clipboard
keymap("n", "<leader>y", '"+y', { desc = "Yank to clipboard" })
keymap("v", "<leader>y", '"+y', { desc = "Yank to clipboard" })
keymap("n", "<leader>Y", '"+Y', { desc = "Yank line to clipboard" })

-- =============================================================================
-- SEARCH AND REPLACE
-- =============================================================================

-- Clear search highlighting
keymap("n", "<leader>h", "<cmd>nohlsearch<CR>", { desc = "Clear highlights" })
keymap("n", "<Esc>", "<cmd>nohlsearch<CR>", opts)

-- Search and replace word under cursor
keymap("n", "<leader>s", [[:%s/\<<C-r><C-w>\>/<C-r><C-w>/gI<Left><Left><Left>]], 
  { desc = "Replace word under cursor" })

-- Visual mode search
keymap("v", "//", 'y/\\V<C-R>=escape(@",\'/\\\')<CR><CR>', { desc = "Search selection" })

-- =============================================================================
-- DENO GENESIS SPECIFIC MAPPINGS
-- =============================================================================

-- Deno commands (will be enhanced by LSP plugin)
keymap("n", "<leader>dr", "<cmd>!deno run %<CR>", { desc = "Deno run current file" })
keymap("n", "<leader>dt", "<cmd>!deno task<CR>", { desc = "Show Deno tasks" })
keymap("n", "<leader>df", "<cmd>!deno fmt %<CR>", { desc = "Format with Deno" })
keymap("n", "<leader>dl", "<cmd>!deno lint %<CR>", { desc = "Lint with Deno" })
keymap("n", "<leader>dc", "<cmd>!deno check %<CR>", { desc = "Check with Deno" })

-- File operations for Deno Genesis projects
keymap("n", "<leader>fc", "<cmd>e deno.json<CR>", { desc = "Open Deno config" })
keymap("n", "<leader>fi", "<cmd>e import_map.json<CR>", { desc = "Open import map" })

-- =============================================================================
-- TOGGLE FUNCTIONS
-- =============================================================================

-- Toggle common options
keymap("n", "<leader>tn", "<cmd>set number!<CR>", { desc = "Toggle line numbers" })
keymap("n", "<leader>tr", "<cmd>set relativenumber!<CR>", { desc = "Toggle relative numbers" })
keymap("n", "<leader>tw", "<cmd>set wrap!<CR>", { desc = "Toggle word wrap" })
keymap("n", "<leader>ts", "<cmd>set spell!<CR>", { desc = "Toggle spelling" })

-- =============================================================================
-- COMMAND LINE IMPROVEMENTS
-- =============================================================================

-- Command line navigation
keymap("c", "<C-a>", "<Home>", opts)
keymap("c", "<C-e>", "<End>", opts)
keymap("c", "<C-h>", "<Left>", opts)
keymap("c", "<C-l>", "<Right>", opts)
keymap("c", "<C-j>", "<Down>", opts)
keymap("c", "<C-k>", "<Up>", opts)

-- =============================================================================
-- MISCELLANEOUS UTILITIES
-- =============================================================================

-- Reload configuration
keymap("n", "<leader><leader>r", "<cmd>source $MYVIMRC<CR>", { desc = "Reload config" })

-- Make file executable
keymap("n", "<leader>x", "<cmd>!chmod +x %<CR>", { desc = "Make file executable" })

-- Split line (opposite of J)
keymap("n", "S", "i<CR><Esc>", { desc = "Split line" })

-- Center screen on insert mode exit
keymap("i", "<Esc>", "<Esc>zz", opts)

-- =============================================================================
-- DIAGNOSTICS AND LSP PLACEHOLDERS
-- =============================================================================
-- These will be enhanced by LSP configuration

-- Diagnostic navigation
keymap("n", "[d", vim.diagnostic.goto_prev, { desc = "Go to previous diagnostic" })
keymap("n", "]d", vim.diagnostic.goto_next, { desc = "Go to next diagnostic" })
keymap("n", "<leader>e", vim.diagnostic.open_float, { desc = "Show diagnostic" })
keymap("n", "<leader>dl", vim.diagnostic.setloclist, { desc = "Diagnostic loclist" })

-- Quickfix list navigation
keymap("n", "<C-k>", "<cmd>cnext<CR>zz", opts)
keymap("n", "<C-j>", "<cmd>cprev<CR>zz", opts)
keymap("n", "<leader>k", "<cmd>lnext<CR>zz", opts)
keymap("n", "<leader>j", "<cmd>lprev<CR>zz", opts)
EOF

    log "Created config/keymaps.lua"
}

generate_autocmds_lua() {
    local config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/nvim"
    
    cat > "$config_dir/lua/config/autocmds.lua" << 'EOF'
-- autocmds.lua - Auto commands for Deno Genesis development
-- Optimized for TypeScript workflow and performance

local autocmd = vim.api.nvim_create_autocmd
local augroup = vim.api.nvim_create_augroup

-- =============================================================================
-- GENERAL EDITOR IMPROVEMENTS
-- =============================================================================

-- Highlight on yank
augroup("YankHighlight", { clear = true })
autocmd("TextYankPost", {
  group = "YankHighlight",
  pattern = "*",
  callback = function()
    vim.highlight.on_yank({ higroup = "IncSearch", timeout = 200 })
  end,
})

-- Remove trailing whitespace on save
augroup("TrimWhitespace", { clear = true })
autocmd("BufWritePre", {
  group = "TrimWhitespace",
  pattern = "*",
  command = [[%s/\s\+$//e]],
})

-- Auto-create directories when saving files
augroup("CreateDirs", { clear = true })
autocmd("BufWritePre", {
  group = "CreateDirs",
  pattern = "*",
  callback = function(event)
    if event.match:match("^%w%w+:[\\/][\\/]") then
      return
    end
    local file = vim.uv.fs_realpath(event.match) or event.match
    vim.fn.mkdir(vim.fn.fnamemodify(file, ":p:h"), "p")
  end,
})

-- =============================================================================
-- FILE TYPE SPECIFIC CONFIGURATIONS
-- =============================================================================

-- TypeScript/JavaScript optimizations for Deno
augroup("DenoTypeScript", { clear = true })
autocmd({ "BufRead", "BufNewFile" }, {
  group = "DenoTypeScript",
  pattern = { "*.ts", "*.tsx", "*.js", "*.jsx" },
  callback = function(ev)
    local root = vim.fs.root(ev.buf, { "deno.json", "deno.jsonc", "deno.lock" })
    if root then
      -- Mark as Deno project
      vim.b[ev.buf].deno_project = true
      
      -- Set compiler
      vim.bo[ev.buf].compiler = "deno"
      
      -- Deno-specific settings
      vim.bo[ev.buf].expandtab = true
      vim.bo[ev.buf].shiftwidth = 2
      vim.bo[ev.buf].tabstop = 2
      vim.bo[ev.buf].softtabstop = 2
      
      -- Enable automatic formatting with Deno
      vim.b[ev.buf].autoformat = true
    end
  end,
})

-- JSON files (including Deno config files)
augroup("JsonFiles", { clear = true })
autocmd({ "BufRead", "BufNewFile" }, {
  group = "JsonFiles",
  pattern = { "*.json", "*.jsonc" },
  callback = function()
    vim.bo.expandtab = true
    vim.bo.shiftwidth = 2
    vim.bo.tabstop = 2
    vim.bo.softtabstop = 2
    -- Enable comments in JSON files for Deno config
    vim.bo.commentstring = "// %s"
  end,
})

-- Markdown files
augroup("MarkdownFiles", { clear = true })
autocmd({ "BufRead", "BufNewFile" }, {
  group = "MarkdownFiles",
  pattern = { "*.md", "*.markdown" },
  callback = function()
    vim.bo.expandtab = true
    vim.bo.shiftwidth = 2
    vim.bo.tabstop = 2
    vim.bo.softtabstop = 2
    vim.wo.wrap = true
    vim.wo.linebreak = true
    vim.wo.spell = true
  end,
})

-- =============================================================================
-- WINDOW AND BUFFER MANAGEMENT
-- =============================================================================

-- Remember cursor position
augroup("RestoreCursor", { clear = true })
autocmd("BufReadPost", {
  group = "RestoreCursor",
  pattern = "*",
  callback = function()
    local exclude = { "gitcommit" }
    local buf = vim.api.nvim_get_current_buf()
    if vim.tbl_contains(exclude, vim.bo[buf].filetype) then
      return
    end
    local row, col = unpack(vim.api.nvim_buf_get_mark(buf, '"'))
    if row > 0 and row <= vim.api.nvim_buf_line_count(buf) then
      vim.api.nvim_win_set_cursor(0, { row, col })
    end
  end,
})

-- Auto-resize windows on terminal resize
augroup("ResizeWindows", { clear = true })
autocmd("VimResized", {
  group = "ResizeWindows",
  pattern = "*",
  command = "tabdo wincmd =",
})

-- Close certain windows with 'q'
augroup("CloseWithQ", { clear = true })
autocmd("FileType", {
  group = "CloseWithQ",
  pattern = {
    "PlenaryTestPopup",
    "help",
    "lspinfo",
    "man",
    "notify",
    "qf",
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

-- =============================================================================
-- PERFORMANCE OPTIMIZATIONS
-- =============================================================================

-- Disable syntax highlighting for large files
augroup("LargeFiles", { clear = true })
autocmd("BufReadPre", {
  group = "LargeFiles",
  pattern = "*",
  callback = function(ev)
    local ok, stats = pcall(vim.loop.fs_stat, vim.api.nvim_buf_get_name(ev.buf))
    if ok and stats and stats.size > (1024 * 1024) then -- 1MB
      vim.b[ev.buf].large_buf = true
      vim.cmd("syntax off")
      vim.opt_local.foldmethod = "manual"
      vim.opt_local.spell = false
    end
  end,
})

-- =============================================================================
-- DENO GENESIS SPECIFIC AUTOMATIONS
-- =============================================================================

-- Auto-detect Deno projects and set up environment
augroup("DenoProject", { clear = true })
autocmd({ "BufEnter", "BufWinEnter" }, {
  group = "DenoProject",
  pattern = { "*.ts", "*.tsx", "*.js", "*.jsx" },
  callback = function()
    local root = vim.fs.root(0, { "deno.json", "deno.jsonc", "deno.lock" })
    if root then
      -- Set project root
      vim.g.deno_project_root = root
      
      -- Update working directory if not already set
      if vim.fn.getcwd() ~= root then
        vim.cmd("cd " .. root)
      end
    end
  end,
})

-- Auto-format Deno files on save (if enabled)
augroup("DenoFormat", { clear = true })
autocmd("BufWritePre", {
  group = "DenoFormat",
  pattern = { "*.ts", "*.tsx", "*.js", "*.jsx", "*.json", "*.jsonc", "*.md" },
  callback = function(ev)
    if vim.b[ev.buf].deno_project and vim.b[ev.buf].autoformat ~= false then
      -- Use LSP formatting if available, otherwise fallback to deno fmt
      local clients = vim.lsp.get_active_clients({ bufnr = ev.buf })
      local deno_client = nil
      for _, client in ipairs(clients) do
        if client.name == "denols" then
          deno_client = client
          break
        end
      end
      
      if deno_client then
        vim.lsp.buf.format({ async = false })
      else
        -- Fallback to command line deno fmt
        vim.cmd("silent !deno fmt " .. vim.fn.expand("%"))
      end
    end
  end,
})

-- =============================================================================
-- TERMINAL ENHANCEMENTS
-- =============================================================================

-- Terminal settings
augroup("TerminalSettings", { clear = true })
autocmd("TermOpen", {
  group = "TerminalSettings",
  pattern = "*",
  callback = function()
    vim.opt_local.number = false
    vim.opt_local.relativenumber = false
    vim.opt_local.scrolloff = 0
    vim.opt_local.sidescrolloff = 0
  end,
})

-- Auto-enter insert mode in terminal
autocmd("BufEnter", {
  group = "TerminalSettings",
  pattern = "term://*",
  command = "startinsert",
})

-- =============================================================================
-- GIT INTEGRATION
-- =============================================================================

-- Git commit message settings
augroup("GitCommit", { clear = true })
autocmd("FileType", {
  group = "GitCommit",
  pattern = "gitcommit",
  callback = function()
    vim.opt_local.wrap = true
    vim.opt_local.spell = true
    vim.opt_local.textwidth = 72
  end,
})

-- =============================================================================
-- DIAGNOSTIC AND LSP IMPROVEMENTS
-- =============================================================================

-- Show diagnostics in hover window
augroup("LspDiagnostics", { clear = true })
autocmd("CursorHold", {
  group = "LspDiagnostics",
  pattern = "*",
  callback = function()
    local opts = {
      focusable = false,
      close_events = { "BufLeave", "CursorMoved", "InsertEnter", "FocusLost" },
      border = "rounded",
      source = "always",
      prefix = " ",
    }
    vim.diagnostic.open_float(nil, opts)
  end,
})

-- =============================================================================
-- CUSTOM COMMANDS
-- =============================================================================

-- Command to toggle Deno autoformat
vim.api.nvim_create_user_command("DenoToggleFormat", function()
  vim.b.autoformat = not vim.b.autoformat
  local status = vim.b.autoformat and "enabled" or "disabled"
  vim.notify("Deno autoformat " .. status, vim.log.levels.INFO)
end, {})

-- Command to run Deno tasks
vim.api.nvim_create_user_command("DenoTask", function(opts)
  local task = opts.args
  if task == "" then
    vim.cmd("!deno task")
  else
    vim.cmd("!deno task " .. task)
  end
end, {
  nargs = "?",
  complete = function()
    -- Try to read tasks from deno.json
    local config_file = vim.fs.root(0, { "deno.json", "deno.jsonc" })
    if config_file then
      local config_path = config_file .. "/deno.json"
      local ok, content = pcall(vim.fn.readfile, config_path)
      if ok then
        local config = vim.fn.json_decode(table.concat(content, "\n"))
        if config.tasks then
          return vim.tbl_keys(config.tasks)
        end
      end
    end
    return {}
  end,
})

-- Command to check Deno project health
vim.api.nvim_create_user_command("DenoHealthCheck", function()
  local checks = {}
  
  -- Check for Deno installation
  local deno_version = vim.fn.system("deno --version 2>/dev/null")
  if vim.v.shell_error == 0 then
    table.insert(checks, "✅ Deno installed: " .. string.match(deno_version, "deno ([%d%.]+)"))
  else
    table.insert(checks, "❌ Deno not found")
  end
  
  -- Check for Deno config
  local root = vim.fs.root(0, { "deno.json", "deno.jsonc", "deno.lock" })
  if root then
    table.insert(checks, "✅ Deno project detected at: " .. root)
  else
    table.insert(checks, "ℹ️  No Deno project detected in current directory tree")
  end
  
  -- Check LSP status
  local clients = vim.lsp.get_active_clients({ bufnr = 0 })
  local deno_lsp_active = false
  for _, client in ipairs(clients) do
    if client.name == "denols" then
      deno_lsp_active = true
      break
    end
  end
  
  if deno_lsp_active then
    table.insert(checks, "✅ Deno LSP active")
  else
    table.insert(checks, "⚠️  Deno LSP not active")
  end
  
  -- Display results
  vim.notify(table.concat(checks, "\n"), vim.log.levels.INFO, { title = "Deno Health Check" })
end, {})
EOF

    log "Created config/autocmds.lua"
}

# =============================================================================
# PLUGIN CONFIGURATION GENERATION
# =============================================================================

generate_lsp_config() {
    local config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/nvim"
    
    cat > "$config_dir/lua/plugins/lsp.lua" << 'EOF'
-- lsp.lua - LSP Configuration optimized for Deno Genesis development
-- Handles Deno/TypeScript LSP conflicts and provides comprehensive language support

return {
  -- LSP Configuration
  {
    "neovim/nvim-lspconfig",
    event = { "BufReadPre", "BufNewFile" },
    dependencies = {
      "mason.nvim",
      "williamboman/mason-lspconfig.nvim",
      "hrsh7th/cmp-nvim-lsp",
    },
    opts = {
      -- Global LSP settings
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
      -- Inlay hints
      inlay_hints = {
        enabled = true,
      },
      -- Document formatting
      format = {
        formatting_options = nil,
        timeout_ms = nil,
      },
    },
    config = function(_, opts)
      local lspconfig = require("lspconfig")
      local cmp_nvim_lsp = require("cmp_nvim_lsp")
      
      -- Enhanced capabilities with nvim-cmp
      local capabilities = vim.tbl_deep_extend(
        "force",
        {},
        vim.lsp.protocol.make_client_capabilities(),
        cmp_nvim_lsp.default_capabilities()
      )
      
      -- =================================================================
      -- DENO/TYPESCRIPT LSP CONFLICT RESOLUTION
      -- =================================================================
      
      -- Helper function to prevent conflicts between Deno and TypeScript LSP
      local function root_pattern_exclude(opt)
        local lsputil = require('lspconfig.util')
        return function(fname)
          local excluded_root = lsputil.root_pattern(opt.exclude)(fname)
          local included_root = lsputil.root_pattern(opt.root)(fname)
          if excluded_root then
            return nil
          else
            return included_root
          end
        end
      end
      
      -- Deno LSP Configuration
      lspconfig.denols.setup({
        root_dir = lspconfig.util.root_pattern("deno.json", "deno.jsonc", "deno.lock"),
        capabilities = capabilities,
        init_options = {
          lint = true,
          unstable = true,
          suggest = {
            imports = {
              hosts = {
                ["https://deno.land"] = true,
                ["https://cdn.nest.land"] = true,
                ["https://crux.land"] = true,
                ["https://esm.sh"] = true,
                ["https://cdn.skypack.dev"] = true,
                ["https://unpkg.com"] = true,
              },
            },
          },
        },
        settings = {
          deno = {
            enable = true,
            codeLens = {
              implementations = true,
              references = true,
              referencesAllFunctions = false,
              test = true,
            },
            suggest = {
              autoImports = true,
              completeFunctionCalls = false,
              names = true,
              paths = true,
              imports = {
                autoDiscover = true,
                hosts = {
                  ["https://deno.land"] = true,
                  ["https://cdn.nest.land"] = true,
                  ["https://crux.land"] = true,
                },
              },
            },
            inlayHints = {
              parameterNames = { enabled = "all" },
              parameterTypes = { enabled = true },
              variableTypes = { enabled = true },
              propertyDeclarationTypes = { enabled = true },
              functionLikeReturnTypes = { enabled = true },
              enumMemberValues = { enabled = true },
            },
          }
        },
        on_attach = function(client, bufnr)
          -- Deno-specific keymaps
          local opts = { buffer = bufnr, silent = true }
          vim.keymap.set('n', '<leader>dr', function()
            vim.lsp.codelens.refresh()
            vim.lsp.codelens.run()
          end, vim.tbl_extend('force', opts, { desc = "Run Deno CodeLens" }))
          
          vim.keymap.set('n', '<leader>dt', '<cmd>!deno task<cr>', 
            vim.tbl_extend('force', opts, { desc = "Show Deno tasks" }))
          
          vim.keymap.set('n', '<leader>dc', '<cmd>!deno check %<cr>', 
            vim.tbl_extend('force', opts, { desc = "Deno type check" }))
          
          vim.keymap.set('n', '<leader>di', '<cmd>!deno info %<cr>', 
            vim.tbl_extend('force', opts, { desc = "Deno info" }))
          
          -- Enable inlay hints if available
          if client.server_capabilities.inlayHintProvider then
            vim.lsp.inlay_hint.enable(bufnr, true)
          end
          
          -- Auto-formatting setup
          if client.supports_method("textDocument/formatting") then
            vim.api.nvim_create_autocmd("BufWritePre", {
              buffer = bufnr,
              callback = function()
                if vim.b.autoformat ~= false then
                  vim.lsp.buf.format({ async = false, bufnr = bufnr })
                end
              end,
            })
          end
        end,
      })
      
      -- TypeScript LSP (only for non-Deno projects)
      lspconfig.ts_ls.setup({
        root_dir = root_pattern_exclude({
          root = { "package.json", "tsconfig.json", "jsconfig.json" },
          exclude = { "deno.json", "deno.jsonc" }
        }),
        capabilities = capabilities,
        single_file_support = false,
        settings = {
          typescript = {
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
        on_attach = function(client, bufnr)
          -- TypeScript-specific keymaps
          local opts = { buffer = bufnr, silent = true }
          vim.keymap.set('n', '<leader>to', '<cmd>TypescriptOrganizeImports<cr>', 
            vim.tbl_extend('force', opts, { desc = "Organize imports" }))
          vim.keymap.set('n', '<leader>tr', '<cmd>TypescriptRenameFile<cr>', 
            vim.tbl_extend('force', opts, { desc = "Rename file" }))
          
          if client.server_capabilities.inlayHintProvider then
            vim.lsp.inlay_hint.enable(bufnr, true)
          end
        end,
      })
      
      -- =================================================================
      -- ADDITIONAL LANGUAGE SERVERS
      -- =================================================================
      
      -- JSON LSP (for configuration files)
      lspconfig.jsonls.setup({
        capabilities = capabilities,
        settings = {
          json = {
            schemas = {
              {
                description = "Deno configuration file",
                fileMatch = { "deno.json", "deno.jsonc" },
                url = "https://raw.githubusercontent.com/denoland/deno/main/cli/schemas/config-file.v1.json",
              },
              {
                description = "TypeScript configuration file",
                fileMatch = { "tsconfig.json", "tsconfig.*.json" },
                url = "https://json.schemastore.org/tsconfig.json",
              },
              {
                description = "Package.json",
                fileMatch = { "package.json" },
                url = "https://json.schemastore.org/package.json",
              },
            },
          },
        },
      })
      
      -- Lua LSP (for Neovim configuration)
      lspconfig.lua_ls.setup({
        capabilities = capabilities,
        settings = {
          Lua = {
            runtime = { version = "LuaJIT" },
            workspace = {
              checkThirdParty = false,
              library = {
                vim.env.VIMRUNTIME,
                "${3rd}/luv/library",
              },
            },
            completion = { callSnippet = "Replace" },
            diagnostics = { globals = { "vim" } },
            hint = { enable = true },
          },
        },
      })
      
      -- Markdown LSP
      lspconfig.marksman.setup({
        capabilities = capabilities,
      })
      
      -- =================================================================
      -- GLOBAL LSP KEYMAPS AND HANDLERS
      -- =================================================================
      
      -- Global LSP keymaps (applied to all LSP buffers)
      vim.api.nvim_create_autocmd("LspAttach", {
        group = vim.api.nvim_create_augroup("UserLspConfig", {}),
        callback = function(ev)
          local opts = { buffer = ev.buf, silent = true }
          
          -- Navigation
          vim.keymap.set('n', 'gD', vim.lsp.buf.declaration, 
            vim.tbl_extend('force', opts, { desc = "Go to declaration" }))
          vim.keymap.set('n', 'gd', vim.lsp.buf.definition, 
            vim.tbl_extend('force', opts, { desc = "Go to definition" }))
          vim.keymap.set('n', 'gi', vim.lsp.buf.implementation, 
            vim.tbl_extend('force', opts, { desc = "Go to implementation" }))
          vim.keymap.set('n', 'gr', vim.lsp.buf.references, 
            vim.tbl_extend('force', opts, { desc = "Show references" }))
          vim.keymap.set('n', 'gt', vim.lsp.buf.type_definition, 
            vim.tbl_extend('force', opts, { desc = "Go to type definition" }))
          
          -- Documentation and hover
          vim.keymap.set('n', 'K', vim.lsp.buf.hover, 
            vim.tbl_extend('force', opts, { desc = "Show hover documentation" }))
          vim.keymap.set('n', '<C-k>', vim.lsp.buf.signature_help, 
            vim.tbl_extend('force', opts, { desc = "Show signature help" }))
          vim.keymap.set('i', '<C-k>', vim.lsp.buf.signature_help, 
            vim.tbl_extend('force', opts, { desc = "Show signature help" }))
          
          -- Code actions
          vim.keymap.set({ 'n', 'v' }, '<leader>ca', vim.lsp.buf.code_action, 
            vim.tbl_extend('force', opts, { desc = "Code action" }))
          vim.keymap.set('n', '<leader>cr', vim.lsp.buf.rename, 
            vim.tbl_extend('force', opts, { desc = "Rename symbol" }))
          
          -- Formatting
          vim.keymap.set('n', '<leader>cf', function()
            vim.lsp.buf.format({ async = true })
          end, vim.tbl_extend('force', opts, { desc = "Format code" }))
          
          -- Workspace management
          vim.keymap.set('n', '<leader>wa', vim.lsp.buf.add_workspace_folder, 
            vim.tbl_extend('force', opts, { desc = "Add workspace folder" }))
          vim.keymap.set('n', '<leader>wr', vim.lsp.buf.remove_workspace_folder, 
            vim.tbl_extend('force', opts, { desc = "Remove workspace folder" }))
          vim.keymap.set('n', '<leader>wl', function()
            print(vim.inspect(vim.lsp.buf.list_workspace_folders()))
          end, vim.tbl_extend('force', opts, { desc = "List workspace folders" }))
          
          -- Toggle inlay hints
          vim.keymap.set('n', '<leader>ih', function()
            vim.lsp.inlay_hint.enable(ev.buf, not vim.lsp.inlay_hint.is_enabled(ev.buf))
          end, vim.tbl_extend('force', opts, { desc = "Toggle inlay hints" }))
        end,
      })
      
      -- Configure diagnostic display
      vim.diagnostic.config(opts.diagnostics)
    end,
  },

  -- Mason LSP installer
  {
    "williamboman/mason.nvim",
    cmd = "Mason",
    keys = { { "<leader>cm", "<cmd>Mason<cr>", desc = "Mason" } },
    build = ":MasonUpdate",
    opts = {
      ensure_installed = {
        "deno",
        "typescript-language-server",
        "json-lsp",
        "lua-language-server",
        "marksman",
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

  -- Mason LSP config bridge
  {
    "williamboman/mason-lspconfig.nvim",
    dependencies = { "mason.nvim" },
    opts = {
      automatic_installation = true,
    },
  },
}
EOF

    log "Created plugins/lsp.lua"
}

generate_completion_config() {
    local config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/nvim"
    
    cat > "$config_dir/lua/plugins/completion.lua" << 'EOF'
-- completion.lua - Advanced completion setup optimized for TypeScript development
-- Enhanced nvim-cmp configuration with Deno-aware completions

return {
  -- Main completion engine
  {
    "hrsh7th/nvim-cmp",
    version = false, -- Use latest version
    event = "InsertEnter",
    dependencies = {
      "hrsh7th/cmp-nvim-lsp",     -- LSP completion
      "hrsh7th/cmp-buffer",       -- Buffer completion
      "hrsh7th/cmp-path",         -- Path completion
      "hrsh7th/cmp-cmdline",      -- Command line completion
      "saadparwaiz1/cmp_luasnip", -- Snippet completion
      "L3MON4D3/LuaSnip",         -- Snippet engine
      "rafamadriz/friendly-snippets", -- Snippet collection
      "onsails/lspkind.nvim",     -- Icons for completion
    },
    config = function()
      local cmp = require('cmp')
      local luasnip = require('luasnip')
      local lspkind = require('lspkind')
      
      -- Load VSCode-style snippets
      require('luasnip.loaders.from_vscode').lazy_load()
      
      -- Custom snippet additions for Deno
      luasnip.add_snippets("typescript", {
        luasnip.snippet("dimport", {
          luasnip.text_node('import { '),
          luasnip.insert_node(1, "exports"),
          luasnip.text_node(' } from "'),
          luasnip.insert_node(2, "https://deno.land/std@0.208.0/"),
          luasnip.text_node('";'),
        }),
        luasnip.snippet("deno_serve", {
          luasnip.text_node('import { serve } from "'),
          luasnip.insert_node(1, "https://deno.land/std@0.208.0/http/server.ts"),
          luasnip.text_node('";'),
          luasnip.text_node({"", "", "serve((req: Request) => {", "  "}),
          luasnip.insert_node(2, "return new Response('Hello World!');"),
          luasnip.text_node({"", "}, { port: "}),
          luasnip.insert_node(3, "8000"),
          luasnip.text_node(" });"),
        }),
      })
      
      cmp.setup({
        snippet = {
          expand = function(args)
            luasnip.lsp_expand(args.body)
          end,
        },
        
        -- Window appearance
        window = {
          completion = cmp.config.window.bordered({
            winhighlight = "Normal:CmpPmenu,FloatBorder:CmpPmenuBorder,CursorLine:PmenuSel,Search:generate_file_explorer_config() {
    local config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/nvim"
    
    cat > "$config_dir/lua/plugins/neo-tree.lua" << 'EOF'
-- neo-tree.lua - File explorer optimized for Deno Genesis project structure
-- Provides comprehensive file management with Git integration

return {
  "nvim-neo-tree/neo-tree.nvim",
  branch = "v3.x",
  cmd = "Neotree",
  keys = {
    { "<leader>e", "<cmd>Neotree toggle<cr>", desc = "Explorer NeoTree (root dir)" },
    { "<leader>E", "<cmd>Neotree toggle float<cr>", desc = "Explorer NeoTree (float)" },
    { "<leader>ge", "<cmd>Neotree git_status<cr>", desc = "Git explorer" },
    { "<leader>be", "<cmd>Neotree buffers<cr>", desc = "Buffer explorer" },
  },
  deactivate = function()
    vim.cmd([[Neotree close]])
  end,
  init = function()
    if vim.fn.argc(-1) == 1 then
      local stat = vim.loop.fs_stat(vim.fn.argv(0))
      if stat and stat.type == "directory" then
        require("neo-tree")
      end
    end
  end,
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-tree/nvim-web-devicons",
    "MunifTanjim/nui.nvim",
  },
  opts = {
    sources = { "filesystem", "buffers", "git_status", "document_symbols" },
    open_files_do_not_replace_types = { "terminal", "Trouble", "trouble", "qf", "Outline" },
    filesystem = {
      bind_to_cwd = false,
      follow_current_file = { enabled = true },
      use_libuv_file_watcher = true,
      filtered_items = {
        visible = false,
        hide_dotfiles = false,
        hide_gitignored = true,
        hide_hidden = true,
        hide_by_name = {
          ".DS_Store",
          "thumbs.db",
          "node_modules",
          "__pycache__",
          ".git",
        },
        hide_by_pattern = {
          "*.tmp",
          "*.pyc",
        },
        always_show = {
          ".gitignored",
          ".env",
        },
        never_show = {
          ".DS_Store",
          "thumbs.db",
        },
      },
      -- Deno Genesis specific file handling
      commands = {
        copy_selector = function(state)
          local node = state.tree:get_node()
          local filepath = node:get_id()
          local filename = node.name
          local modify = vim.fn.fnamemodify
          
          local vals = {
            ["BASENAME"] = modify(filename, ":r"),
            ["EXTENSION"] = modify(filename, ":e"),
            ["FILENAME"] = filename,
            ["PATH (CWD)"] = modify(filepath, ":."),
            ["PATH (HOME)"] = modify(filepath, ":~"),
            ["PATH"] = filepath,
            ["URI"] = vim.uri_from_fname(filepath),
          }
          
          local options = vim.tbl_filter(function(val)
            return vals[val] ~= ""
          end, vim.tbl_keys(vals))
          
          if vim.tbl_isempty(options) then
            vim.notify("No values to copy", vim.log.levels.WARN)
            return
          end
          
          table.sort(options)
          vim.ui.select(options, {
            prompt = "Choose to copy to clipboard:",
            format_item = function(item)
              return ("%s: %s"):format(item, vals[item])
            end,
          }, function(choice)
            local result = vals[choice]
            if result then
              vim.notify(("Copied: `%s`"):format(result))
              vim.fn.setreg("+", result)
            end
          end)
        end,
        
        -- Quick Deno file creation
        create_deno_service = function(state)
          local node = state.tree:get_node()
          local path = node:get_id()
          if node.type ~= "directory" then
            path = vim.fn.fnamemodify(path, ":p:h")
          end
          
          vim.ui.input({ prompt = "Service name: " }, function(name)
            if name then
              local service_path = path .. "/" .. name .. ".ts"
              local content = [[import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const handler = (req: Request): Response => {
  return new Response("Hello from ]] .. name .. [[!");
};

console.log("]] .. name .. [[ service running on http://localhost:8000");
serve(handler, { port: 8000 });
]]
              vim.fn.writefile(vim.split(content, "\n"), service_path)
              vim.cmd("edit " .. service_path)
            end
          end)
        end,
      },
    },
    buffers = {
      follow_current_file = {
        enabled = true,
        leave_dirs_open = false,
      },
      group_empty_dirs = true,
      show_unloaded = true,
    },
    git_status = {
      window = {
        position = "float",
        mappings = {
          ["A"]  = "git_add_all",
          ["gu"] = "git_unstage_file",
          ["ga"] = "git_add_file",
          ["gr"] = "git_revert_file",
          ["gc"] = "git_commit",
          ["gp"] = "git_push",
          ["gg"] = "git_commit_and_push",
        }
      }
    },
    window = {
      mappings = {
        ["<space>"] = "none",
        ["Y"] = "copy_selector",
        ["h"] = "parent_or_close",
        ["l"] = "child_or_open",
        ["o"] = "open",
        ["O"] = "system_open",
        ["q"] = "close_window",
        ["r"] = "refresh",
        ["R"] = "rename",
        ["<F5>"] = "refresh",
        ["cd"] = "set_root",
        ["[g"] = "prev_git_modified",
        ["]g"] = "next_git_modified",
        
        -- Deno Genesis specific mappings
        ["<leader>ds"] = "create_deno_service",
      },
    },
    default_component_configs = {
      indent = {
        with_expanders = true,
        expander_collapsed = "",
        expander_expanded = "",
        expander_highlight = "NeoTreeExpander",
      },
      icon = {
        folder_closed = "",
        folder_open = "",
        folder_empty = "ﰊ",
        default = "*",
        highlight = "NeoTreeFileIcon"
      },
      modified = {
        symbol = "[+]",
        highlight = "NeoTreeModified",
      },
      name = {
        trailing_slash = false,
        use_git_status_colors = true,
        highlight = "NeoTreeFileName",
      },
      git_status = {
        symbols = {
          added     = "",
          modified  = "",
          deleted   = "✖",
          renamed   = "󰁕",
          untracked = "",
          ignored   = "",
          unstaged  = "󰄱",
          staged    = "",
          conflict  = "",
        }
      },
      file_size = {
        enabled = true,
        required_width = 64,
      },
      type = {
        enabled = true,
        required_width = 122,
      },
      last_modified = {
        enabled = true,
        required_width = 88,
      },
      created = {
        enabled = true,
        required_width = 110,
      },
      symlink_target = {
        enabled = false,
      },
    },
  },
  config = function(_, opts)
    local function on_move(data)
      require("util").lsp.on_rename(data.source, data.destination)
    end

    local events = require("neo-tree.events")
    if opts.filesystem and opts.filesystem.commands then
      opts.filesystem.commands.copy_selector = opts.filesystem.commands.copy_selector or function() end
      opts.filesystem.commands.create_deno_service = opts.filesystem.commands.create_deno_service or function() end
    end
    
    opts.event_handlers = opts.event_handlers or {}
    vim.list_extend(opts.event_handlers, {
      { event = events.FILE_MOVED,   handler = on_move },
      { event = events.FILE_RENAMED, handler = on_move },
    })
    
    require("neo-tree").setup(opts)
    
    -- Auto-open neo-tree for directories
    vim.api.nvim_create_autocmd("BufEnter", {
      group = vim.api.nvim_create_augroup("Neotree_start_directory", { clear = true }),
      desc = "Start Neo-tree with directory",
      once = true,
      callback = function()
        if package.loaded["neo-tree"] then
          return
        else
          local stats = vim.uv.fs_stat(vim.fn.argv(0))
          if stats and stats.type == "directory" then
            require("neo-tree")
          end
        end
      end,
    })
  end,
}
EOF

    log "Created plugins/neo-tree.lua"
}

generate_telescope_config() {
    local config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/nvim"
    
    cat > "$config_dir/lua/plugins/telescope.lua" << 'EOF'
-- telescope.lua - Fuzzy finder optimized for Deno Genesis development
-- Enhanced search capabilities with performance optimizations

return {
  "nvim-telescope/telescope.nvim",
  branch = "0.1.x",
  cmd = "Telescope",
  version = false,
  keys = {
    -- File finding
    { "<leader>ff", "<cmd>Telescope find_files<cr>", desc = "Find Files" },
    { "<leader>fr", "<cmd>Telescope oldfiles<cr>", desc = "Recent Files" },
    { "<leader>fF", "<cmd>Telescope find_files hidden=true<cr>", desc = "Find Files (Hidden)" },
    
    -- Search
    { "<leader>sg", "<cmd>Telescope live_grep<cr>", desc = "Live Grep" },
    { "<leader>sw", "<cmd>Telescope grep_string<cr>", desc = "Grep String" },
    { "<leader>sG", "<cmd>Telescope live_grep additional_args={'--hidden'}<cr>", desc = "Live Grep (Hidden)" },
    
    -- Buffers and recent
    { "<leader>fb", "<cmd>Telescope buffers<cr>", desc = "Buffers" },
    { "<leader>fh", "<cmd>Telescope help_tags<cr>", desc = "Help Tags" },
    
    -- Git
    { "<leader>gf", "<cmd>Telescope git_files<cr>", desc = "Git Files" },
    { "<leader>gc", "<cmd>Telescope git_commits<cr>", desc = "Git Commits" },
    { "<leader>gs", "<cmd>Telescope git_status<cr>", desc = "Git Status" },
    
    -- LSP
    { "<leader>ss", "<cmd>Telescope lsp_document_symbols<cr>", desc = "Document Symbols" },
    { "<leader>sS", "<cmd>Telescope lsp_workspace_symbols<cr>", desc = "Workspace Symbols" },
    { "<leader>sd", "<cmd>Telescope diagnostics<cr>", desc = "Diagnostics" },
    
    -- Deno specific
    { "<leader>fd", function()
        require("telescope.builtin").find_files({
          find_command = { "find", ".", "-type", "f", "-name", "*.ts", "-o", "-name", "*.tsx", "-o", "-name", "*.js", "-o", "-name", "*.jsx" }
        })
      end, desc = "Find TypeScript Files" },
    
    -- Configuration
    { "<leader>fc", "<cmd>Telescope find_files cwd=~/.config/nvim<cr>", desc = "Find Config Files" },
  },
  dependencies = {
    "nvim-lua/plenary.nvim",
    {
      "nvim-telescope/telescope-fzf-native.nvim",
      build = "make",
      cond = function()
        return vim.fn.executable "make" == 1
      end,
    },
    { "nvim-tree/nvim-web-devicons", enabled = vim.g.have_nerd_font },
  },
  config = function()
    local telescope = require("telescope")
    local actions = require("telescope.actions")
    local trouble = require("trouble.providers.telescope")
    
    telescope.setup({
      defaults = {
        prompt_prefix = " ",
        selection_caret = " ",
        path_display = { "truncate" },
        sorting_strategy = "ascending",
        layout_config = {
          horizontal = {
            prompt_position = "top",
            preview_width = 0.55,
            results_width = 0.8,
          },
          vertical = {
            mirror = false,
          },
          width = 0.87,
          height = 0.80,
          preview_cutoff = 120,
        },
        
        -- Performance optimizations
        file_ignore_patterns = {
          "node_modules/",
          ".git/",
          ".cache/",
          "%.o",
          "%.a",
          "%.out",
          "%.class",
          "%.pdf",
          "%.mkv",
          "%.mp4",
          "%.zip"
        },
        
        -- Enhanced file finding for Deno
        vimgrep_arguments = {
          "rg",
          "--color=never",
          "--no-heading",
          "--with-filename",
          "--line-number",
          "--column",
          "--smart-case",
          "--hidden",
          "--glob=!.git/",
        },
        
        mappings = {
          i = {
            ["<C-k>"] = actions.move_selection_previous,
            ["<C-j>"] = actions.move_selection_next,
            ["<C-n>"] = actions.cycle_history_next,
            ["<C-p>"] = actions.cycle_history_prev,
            ["<C-c>"] = actions.close,
            ["<Down>"] = actions.move_selection_next,
            ["<Up>"] = actions.move_selection_previous,
            ["<CR>"] = actions.select_default,
            ["<C-s>"] = actions.select_horizontal,
            ["<C-v>"] = actions.select_vertical,
            ["<C-t>"] = actions.select_tab,
            ["<C-u>"] = actions.preview_scrolling_up,
            ["<C-d>"] = actions.preview_scrolling_down,
            ["<PageUp>"] = actions.results_scrolling_up,
            ["<PageDown>"] = actions.results_scrolling_down,
            ["<Tab>"] = actions.toggle_selection + actions.move_selection_worse,
            ["<S-Tab>"] = actions.toggle_selection + actions.move_selection_better,
            ["<C-q>"] = actions.send_to_qflist + actions.open_qflist,
            ["<M-q>"] = actions.send_selected_to_qflist + actions.open_qflist,
            ["<C-l>"] = actions.complete_tag,
            ["<C-/>"] = actions.which_key,
            ["<c-t>"] = trouble.open_with_trouble,
          },
          n = {
            ["<esc>"] = actions.close,
            ["<CR>"] = actions.select_default,
            ["<C-s>"] = actions.select_horizontal,
            ["<C-v>"] = actions.select_vertical,
            ["<C-t>"] = actions.select_tab,
            ["<Tab>"] = actions.toggle_selection + actions.move_selection_worse,
            ["<S-Tab>"] = actions.toggle_selection + actions.move_selection_better,
            ["<C-q>"] = actions.send_to_qflist + actions.open_qflist,
            ["<M-q>"] = actions.send_selected_to_qflist + actions.open_qflist,
            ["j"] = actions.move_selection_next,
            ["k"] = actions.move_selection_previous,
            ["H"] = actions.move_to_top,
            ["M"] = actions.move_to_middle,
            ["L"] = actions.move_to_bottom,
            ["<Down>"] = actions.move_selection_next,
            ["<Up>"] = actions.move_selection_previous,
            ["gg"] = actions.move_to_top,
            ["G"] = actions.move_to_bottom,
            ["<C-u>"] = actions.preview_scrolling_up,
            ["<C-d>"] = actions.preview_scrolling_down,
            ["<PageUp>"] = actions.results_scrolling_up,
            ["<PageDown>"] = actions.results_scrolling_down,
            ["?"] = actions.which_key,
            ["<c-t>"] = trouble.open_with_trouble,
          },
        },
      },
      
      pickers = {
        find_files = {
          find_command = { "rg", "--files", "--hidden", "--glob", "!**/.git/*" },
          mappings = {
            n = {
              ["cd"] = function(prompt_bufnr)
                local selection = require("telescope.actions.state").get_selected_entry()
                local dir = vim.fn.fnamemodify(selection.path, ":p:h")
                require("telescope.actions").close(prompt_bufnr)
                vim.cmd(string.format("silent cd %s", dir))
              end
            }
          }
        },
        
        buffers = {
          ignore_current_buffer = true,
          sort_lastused = true,
          theme = "dropdown",
          previewer = false,
          mappings = {
            i = { ["<c-d>"] = "delete_buffer" },
            n = { ["<c-d>"] = "delete_buffer" },
          }
        },
        
        git_files = {
          theme = "dropdown",
          previewer = false,
        },
        
        live_grep = {
          additional_args = function()
            return { "--hidden", "--glob", "!**/.git/*" }
          end
        },
        
        grep_string = {
          additional_args = function()
            return { "--hidden", "--glob", "!**/.git/*" }
          end
        },
      },
      
      extensions = {
        fzf = {
          fuzzy = true,                    -- false will only do exact matching
          override_generic_sorter = true,  -- override the generic sorter
          override_file_sorter = true,     -- override the file sorter
          case_mode = "smart_case",        -- or "ignore_case" or "respect_case"
        }
      }
    })

    -- Load extensions
    telescope.load_extension("fzf")
    
    -- Auto-change directory based on opened file
    vim.api.nvim_create_autocmd("User", {
      pattern = "TelescopePreviewerLoaded",
      callback = function()
        vim.wo.number = false
        vim.wo.relativenumber = false
      end,
    })
  end,
}
EOF

    log "Created plugins/telescope.lua"
}

generate_treesitter_config() {
    local config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/nvim"
    
    cat > "$config_dir/lua/plugins/treesitter.lua" << 'EOF'
-- treesitter.lua - Modern syntax highlighting and code navigation
-- Optimized for TypeScript, JSX, and Deno development

return {
  -- Treesitter core
  {
    "nvim-treesitter/nvim-treesitter",
    version = false, -- last release is way too old and doesn't work on Windows
    build = ":TSUpdate",
    event = { "BufReadPost", "BufNewFile" },
    init = function(plugin)
      require("lazy.core.loader").add_to_rtp(plugin)
      require("nvim-treesitter.query_predicates")
    end,
    dependencies = {
      {
        "nvim-treesitter/nvim-treesitter-textobjects",
        config = function()
          -- When in diff mode, we want to use the default
          -- vim text objects c & C instead of the treesitter ones.
          local move = require("nvim-treesitter.textobjects.move") ---@type table<string,fun(...)>
          local configs = require("nvim-treesitter.configs")
          for name, fn in pairs(move) do
            if name:find("goto") == 1 then
              move[name] = function(q, ...)
                if vim.wo.diff then
                  local config = configs.get_module("textobjects.move")[name] ---@type table<string,string>
                  for key, query in pairs(config or {}) do
                    if q == query and key:find("[%]%[][cC]") then
                      vim.cmd("normal! " .. key)
                      return
                    end
                  end
                end
                return fn(q, ...)
              end
            end
          end
        end,
      },
    },
    opts = {
      highlight = { enable = true },
      indent = { enable = true },
      ensure_installed = {
        "bash",
        "c",
        "diff",
        "html",
        "javascript",
        "jsdoc",
        "json",
        "jsonc",
        "lua",
        "luadoc",
        "luap",
        "markdown",
        "markdown_inline",
        "python",
        "query",
        "regex",
        "toml",
        "tsx",
        "typescript",
        "vim",
        "vimdoc",
        "yaml",
      },
      incremental_selection = {
        enable = true,
        keymaps = {
          init_selection = "<C-space>",
          node_incremental = "<C-space>",
          scope_incremental = false,
          node_decremental = "<bs>",
        },
      },
      textobjects = {
        select = {
          enable = true,
          lookahead = true,
          keymaps = {
            ["aa"] = "@parameter.outer",
            ["ia"] = "@parameter.inner",
            ["af"] = "@function.outer",
            ["if"] = "@function.inner",
            ["ac"] = "@class.outer",
            ["ic"] = "@class.inner",
            ["ii"] = "@conditional.inner",
            ["ai"] = "@conditional.outer",
            ["il"] = "@loop.inner",
            ["al"] = "@loop.outer",
            ["at"] = "@comment.outer",
          },
        },
        move = {
          enable = true,
          set_jumps = true,
          goto_next_start = {
            ["]m"] = "@function.outer",
            ["]]"] = "@class.outer",
            ["]o"] = "@loop.*",
            ["]s"] = { query = "@scope", query_group = "locals", desc = "Next scope" },
            ["]z"] = { query = "@fold", query_group = "folds", desc = "Next fold" },
          },
          goto_next_end = {
            ["]M"] = "@function.outer",
            ["]["] = "@class.outer",
          },
          goto_previous_start = {
            ["[m"] = "@function.outer",
            ["[["] = "@class.outer",
            ["[o"] = "@loop.*",
            ["[s"] = { query = "@scope", query_group = "locals", desc = "Previous scope" },
            ["[z"] = { query = "@fold", query_group = "folds", desc = "Previous fold" },
          },
          goto_previous_end = {
            ["[M"] = "@function.outer",
            ["[]"] = "@class.outer",
          },
          goto_next = {
            ["]d"] = "@conditional.outer",
          },
          goto_previous = {
            ["[d"] = "@conditional.outer",
          },
        },
        swap = {
          enable = true,
          swap_next = {
            ["<leader>a"] = "@parameter.inner",
          },
          swap_previous = {
            ["<leader>A"] = "@parameter.inner",
          },
        },
      },
    },
    config = function(_, opts)
      require("nvim-treesitter.configs").setup(opts)

      -- MDX support
      vim.filetype.add({
        extension = {
          mdx = "mdx",
        },
      })
      vim.treesitter.language.register("markdown", "mdx")
      
      -- Enhanced Deno/TypeScript file detection
      vim.filetype.add({
        pattern = {
          [".*%.config%.ts"] = "typescript",
          [".*%.test%.ts"] = "typescript",
          [".*%.spec%.ts"] = "typescript",
          [".*deno%.json.*"] = "jsonc",
        },
      })
    end,
  },

  -- Automatically add closing tags for HTML and JSX
  {
    "windwp/nvim-ts-autotag",
    event = "InsertEnter",
    dependencies = "nvim-treesitter/nvim-treesitter",
    config = function()
      require("nvim-ts-autotag").setup({
        opts = {
          enable_close = true,
          enable_rename = true,
          enable_close_on_slash = false
        },
        per_filetype = {
          ["html"] = {
            enable_close = false
          }
        }
      })
    end,
  },

  -- Rainbow parentheses using treesitter
  {
    "HiPhish/rainbow-delimiters.nvim",
    event = "BufRead",
    config = function()
      local rainbow_delimiters = require("rainbow-delimiters")
      
      vim.g.rainbow_delimiters = {
        strategy = {
          [''] = rainbow_delimiters.strategy['global'],
          vim = rainbow_delimiters.strategy['local'],
        },
        query = {
          [''] = 'rainbow-delimiters',
          lua = 'rainbow-blocks',
        },
        priority = {
          [''] = 110,
          lua = 210,
        },
        highlight = {
          'RainbowDelimiterRed',
          'RainbowDelimiterYellow',
          'RainbowDelimiterBlue',
          'RainbowDelimiterOrange',
          'RainbowDelimiterGreen',
          'RainbowDelimiterViolet',
          'RainbowDelimiterCyan',
        },
      }
    end,
  },

  -- Show context of current function/class
  {
    "nvim-treesitter/nvim-treesitter-context",
    event = "BufRead",
    opts = {
      enable = true,
      max_lines = 3,
      min_window_height = 0,
      line_numbers = true,
      multiline_threshold = 20,
      trim_scope = 'outer',
      mode = 'cursor',
      separator = nil,
      zindex = 20,
      on_attach = nil,
    },
  },
}
EOF

    log "Created plugins/treesitter.lua"
}

# Continue generating the rest of the script
install_plugins() {
    header "Installing Plugins and Running Initial Setup"
    
    # Run Neovim headless to install plugins
    log "Installing plugins with lazy.nvim..."
    nvim --headless -c 'autocmd User LazyVimStarted quitall' -c 'Lazy! sync' 2>/dev/null
    
    # Install TreeSitter parsers
    log "Installing TreeSitter parsers..."
    nvim --headless -c 'TSUpdate' -c 'qall' 2>/dev/null
    
    # Install LSP servers
    log "Installing LSP servers..."
    nvim --headless -c 'MasonInstallAll' -c 'qall' 2>/dev/null || true
    
    success "Plugin installation completed"
}

generate_sample_deno_project() {
    header "Generating Sample Deno Project"
    
    if [[ ! -f "deno.json" ]]; then
        log "Creating sample deno.json..."
        cat > "deno.json" << 'EOF'
{
  "tasks": {
    "dev": "deno run --allow-net --allow-read --watch main.ts",
    "start": "deno run --allow-net --allow-read main.ts",
    "test": "deno test --allow-all",
    "fmt": "deno fmt",
    "lint": "deno lint",
    "check": "deno check **/*.ts"
  },
  "imports": {
    "@std/": "https://deno.land/std@0.208.0/",
    "@oak/": "https://deno.land/x/oak@v12.6.1/"
  },
  "compilerOptions": {
    "allowJs": true,
    "lib": ["deno.window"],
    "strict": true
  },
  "fmt": {
    "files": {
      "include": ["src/", "*.ts", "*.js"],
      "exclude": ["build/", "dist/"]
    },
    "options": {
      "useTabs": false,
      "lineWidth": 80,
      "indentWidth": 2,
      "singleQuote": false
    }
  },
  "lint": {
    "files": {
      "include": ["src/", "*.ts", "*.js"],
      "exclude": ["build/", "dist/"]
    },
    "rules": {
      "tags": ["recommended"]
    }
  }
}
EOF
        success "Created sample deno.json"
    fi
    
    if [[ ! -f "main.ts" ]]; then
        log "Creating sample main.ts..."
        cat > "main.ts" << 'EOF'
/**
 * DenoGenesis Framework - Sample Application
 * Modern TypeScript development with Deno
 */

import { serve } from "@std/http/server";

interface AppConfig {
  port: number;
  hostname: string;
}

const config: AppConfig = {
  port: 8000,
  hostname: "localhost",
};

const handler = (req: Request): Response => {
  const url = new URL(req.url);
  
  // Simple routing
  switch (url.pathname) {
    case "/":
      return new Response("🦕 Welcome to DenoGenesis Framework!");
    case "/health":
      return new Response(JSON.stringify({ status: "ok", timestamp: new Date() }), {
        headers: { "content-type": "application/json" },
      });
    default:
      return new Response("Not Found", { status: 404 });
  }
};

// Start the server
console.log(`🚀 Server running at http://${config.hostname}:${config.port}/`);
await serve(handler, config);
EOF
        success "Created sample main.ts"
    fi
    
    # Create src directory with example files
    if [[ ! -d "src" ]]; then
        mkdir -p src
        
        cat > "src/utils.ts" << 'EOF'
/**
 * Utility functions for DenoGenesis applications
 */

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export class Logger {
  constructor(private prefix: string) {}
  
  info(message: string): void {
    console.log(`[${this.prefix}] INFO: ${message}`);
  }
  
  error(message: string): void {
    console.error(`[${this.prefix}] ERROR: ${message}`);
  }
  
  warn(message: string): void {
    console.warn(`[${this.prefix}] WARN: ${message}`);
  }
}
EOF
        
        success "Created src/ directory with utility files"
    fi
}

perform_health_check() {
    header "Performing Health Check"
    
    # Test Neovim configuration
    log "Testing Neovim configuration..."
    if nvim --headless -c 'checkhealth' -c 'qall' 2>/dev/null; then
        success "Neovim configuration is healthy"
    else
        warn "Some issues found in configuration (check :checkhealth in Neovim)"
    fi
    
    # Test Deno project
    if [[ -f "deno.json" ]]; then
        log "Testing Deno project setup..."
        if deno check main.ts 2>/dev/null; then
            success "Deno project configuration is valid"
        else
            warn "Issues found in Deno project (run 'deno check main.ts' for details)"
        fi
    fi
    
    # Display summary
    echo
    success "Setup completed successfully!"
    echo
    log "Next steps:"
    log "1. Start Neovim: nvim"
    log "2. Wait for any remaining plugins to install"
    log "3. Open a TypeScript file to activate Deno LSP"
    log "4. Run :checkhealth to verify everything is working"
    log "5. Test Deno project: deno task dev"
    echo
    log "Key shortcuts to remember:"
    log "- <leader>ff: Find files"
    log "- <leader>fg: Live grep"
    log "- <leader>e: Toggle file explorer"
    log "- <leader>dr: Run Deno tasks"
    log "- <leader>cf: Format code"
    log "- gd: Go to definition"
    log "- K: Show documentation"
    echo
    log "Happy coding with DenoGenesis Framework! 🦕"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    show_banner
    
    check_prerequisites
    backup_existing_config
    create_directory_structure
    
    # Generate core configuration
    generate_init_lua
    generate_options_lua
    generate_keymaps_lua
    generate_autocmds_lua
    
    # Generate plugin configurations
    generate_lsp_config
    generate_completion_config
    generate_ui_plugins
    generate_file_explorer_config
    generate_telescope_config
    generate_treesitter_config
    
    # Install and setup
    install_plugins
    generate_sample_deno_project
    perform_health_check
}

# Execute main function with all arguments
main "$@"",
          }),
          documentation = cmp.config.window.bordered({
            winhighlight = "Normal:CmpDoc,FloatBorder:CmpDocBorder",
          }),
        },
        
        -- Key mappings
        mapping = cmp.mapping.preset.insert({
          -- Scroll documentation
          ['<C-b>'] = cmp.mapping.scroll_docs(-4),
          ['<C-f>'] = cmp.mapping.scroll_docs(4),
          
          -- Manual completion trigger
          ['<C-Space>'] = cmp.mapping.complete(),
          ['<C-e>'] = cmp.mapping.abort(),
          
          -- Confirm selection
          ['<CR>'] = cmp.mapping.confirm({ 
            behavior = cmp.ConfirmBehavior.Replace,
            select = false -- Only confirm explicitly selected items
          }),
          
          -- Super Tab functionality
          ['<Tab>'] = cmp.mapping(function(fallback)
            if cmp.visible() then
              cmp.select_next_item({ behavior = cmp.SelectBehavior.Select })
            elseif luasnip.locally_jumpable(1) then
              luasnip.jump(1)
            else
              fallback()
            end
          end, { 'i', 's' }),
          
          ['<S-Tab>'] = cmp.mapping(function(fallback)
            if cmp.visible() then
              cmp.select_prev_item({ behavior = cmp.SelectBehavior.Select })
            elseif luasnip.locally_jumpable(-1) then
              luasnip.jump(-1)
            else
              fallback()
            end
          end, { 'i', 's' }),
        }),
        
        -- Completion sources with priorities
        sources = cmp.config.sources({
          { 
            name = 'nvim_lsp', 
            priority = 1000,
            -- Enhanced filtering for Deno imports
            entry_filter = function(entry, ctx)
              -- Prioritize Deno std library imports
              if entry.completion_item.detail and 
                 entry.completion_item.detail:match("https://deno.land/std") then
                return true
              end
              return true
            end
          },
          { name = 'luasnip', priority = 750 },
          { name = 'path', priority = 500 },
        }, {
          { 
            name = 'buffer', 
            priority = 250, 
            keyword_length = 3,
            option = {
              get_bufnrs = function()
                -- Only complete from visible buffers
                local bufs = {}
                for _, win in ipairs(vim.api.nvim_list_wins()) do
                  bufs[vim.api.nvim_win_get_buf(win)] = true
                end
                return vim.tbl_keys(bufs)
              end
            }
          },
        }),
        
        -- Formatting with icons
        formatting = {
          format = lspkind.cmp_format({
            mode = 'symbol_text',
            maxwidth = 50,
            ellipsis_char = '...',
            show_labelDetails = true,
            
            -- Custom icons for Deno-specific items
            symbol_map = {
              Text = "󰉿",
              Method = "󰆧",
              Function = "󰊕",
              Constructor = "",
              Field = "󰜢",
              Variable = "󰀫",
              Class = "󰠱",
              Interface = "",
              Module = "",
              Property = "󰜢",
              Unit = "󰑭",
              Value = "󰎠",
              Enum = "",
              Keyword = "󰌋",
              Snippet = "",
              Color = "󰏘",
              File = "󰈙",
              Reference = "󰈇",
              Folder = "󰉋",
              EnumMember = "",
              Constant = "󰏿",
              Struct = "󰙅",
              Event = "",
              Operator = "󰆕",
              TypeParameter = "",
              Deno = "🦕",
            },
            
            menu = {
              nvim_lsp = '[LSP]',
              luasnip = '[Snip]',
              buffer = '[Buf]',
              path = '[Path]',
              cmdline = '[Cmd]',
            },
            
            before = function(entry, vim_item)
              -- Add Deno icon for Deno-related completions
              if entry.source.name == 'nvim_lsp' and 
                 entry.completion_item.detail and 
                 entry.completion_item.detail:match("deno") then
                vim_item.kind_hl_group = "CmpItemKindDeno"
                vim_item.menu = "[Deno]"
              end
              return vim_item
            end
          }),
        },
        
        -- Experimental features
        experimental = {
          ghost_text = {
            hl_group = "CmpGhostText"
          },
        },
        
        -- Performance settings
        performance = {
          trigger_debounce_time = 500,
          throttle = 550,
          fetching_timeout = 80,
        },
        
        -- Sorting preferences
        sorting = {
          priority_weight = 2,
          comparators = {
            cmp.config.compare.offset,
            cmp.config.compare.exact,
            cmp.config.compare.score,
            cmp.config.compare.recently_used,
            cmp.config.compare.locality,
            cmp.config.compare.kind,
            cmp.config.compare.sort_text,
            cmp.config.compare.length,
            cmp.config.compare.order,
          },
        },
      })
      
      -- Command line completion
      cmp.setup.cmdline({ '/', '?' }, {
        mapping = cmp.mapping.preset.cmdline(),
        sources = {
          { name = 'buffer' }
        }
      })
      
      cmp.setup.cmdline(':', {
        mapping = cmp.mapping.preset.cmdline(),
        sources = cmp.config.sources({
          { name = 'path' }
        }, {
          { name = 'cmdline' }
        })
      })
    end,
  },

  -- Snippet engine
  {
    "L3MON4D3/LuaSnip",
    build = "make install_jsregexp",
    dependencies = {
      "rafamadriz/friendly-snippets",
      config = function()
        require("luasnip.loaders.from_vscode").lazy_load()
      end,
    },
    opts = {
      history = true,
      delete_check_events = "TextChanged",
      region_check_events = "CursorMoved",
    },
    config = function(_, opts)
      require("luasnip").setup(opts)
      
      -- Custom keymaps for snippet navigation
      vim.keymap.set({"i"}, "<C-K>", function() require("luasnip").expand() end, {silent = true})
      vim.keymap.set({"i", "s"}, "<C-L>", function() require("luasnip").jump(1) end, {silent = true})
      vim.keymap.set({"i", "s"}, "<C-J>", function() require("luasnip").jump(-1) end, {silent = true})
      
      vim.keymap.set({"i", "s"}, "<C-E>", function()
        if require("luasnip").choice_active() then
          require("luasnip").change_choice(1)
        end
      end, {silent = true})
    end,
  },

  -- LSP kind icons
  {
    "onsails/lspkind.nvim",
    opts = {
      mode = "symbol_text",
      preset = "codicons",
      symbol_map = {
        Deno = "🦕",
      },
    },
  },
}
EOF

    log "Created plugins/completion.lua"
}

generate_ui_plugins() {
    local config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/nvim"
    
    cat > "$config_dir/lua/plugins/ui.lua" << 'EOF'
-- ui.lua - User interface plugins following DenoGenesis design principles
-- Dark theme optimized for long development sessions

return {
  -- Color scheme - Tokyo Night for professional appearance
  {
    "folke/tokyonight.nvim",
    lazy = false,
    priority = 1000,
    opts = {
      style = "night", -- night, storm, day, moon
      transparent = false,
      terminal_colors = true,
      styles = {
        comments = { italic = true },
        keywords = { italic = true },
        functions = {},
        variables = {},
        sidebars = "dark",
        floats = "dark",
      },
      sidebars = { "qf", "help", "terminal", "packer" },
      day_brightness = 0.3,
      hide_inactive_statusline = false,
      dim_inactive = false,
      lualine_bold = false,
      
      -- Custom colors for Deno Genesis branding
      on_colors = function(colors)
        colors.hint = colors.orange
        colors.error = "#ff757f"
      end,
      
      on_highlights = function(highlights, colors)
        highlights.DiagnosticVirtualTextError = {
          bg = colors.none,
          fg = colors.error,
        }
        highlights.DiagnosticVirtualTextWarn = {
          bg = colors.none,
          fg = colors.warning,
        }
        highlights.DiagnosticVirtualTextInfo = {
          bg = colors.none,
          fg = colors.info,
        }
        highlights.DiagnosticVirtualTextHint = {
          bg = colors.none,
          fg = colors.hint,
        }
        -- Deno-specific highlighting
        highlights.CmpItemKindDeno = {
          fg = colors.green,
          bg = colors.none,
        }
      end,
    },
    config = function(_, opts)
      require("tokyonight").setup(opts)
      vim.cmd([[colorscheme tokyonight]])
    end,
  },

  -- Status line
  {
    "nvim-lualine/lualine.nvim",
    event = "VeryLazy",
    dependencies = { "nvim-tree/nvim-web-devicons" },
    init = function()
      vim.g.lualine_laststatus = vim.o.laststatus
      if vim.fn.argc(-1) > 0 then
        vim.o.statusline = " "
      else
        vim.o.laststatus = 0
      end
    end,
    opts = function()
      local function fg(name)
        return function()
          local hl = vim.api.nvim_get_hl_by_name(name, true)
          return hl and hl.foreground and { fg = string.format("#%06x", hl.foreground) }
        end
      end

      return {
        options = {
          theme = "tokyonight",
          globalstatus = true,
          disabled_filetypes = { statusline = { "dashboard", "alpha", "starter" } },
          component_separators = "",
          section_separators = "",
        },
        sections = {
          lualine_a = { 
            { "mode", separator = { left = "" }, right_padding = 2 }
          },
          lualine_b = { 
            "branch",
            {
              "diff",
              symbols = { added = " ", modified = " ", removed = " " },
            }
          },
          lualine_c = {
            {
              "diagnostics",
              symbols = {
                error = " ",
                warn = " ",
                info = " ",
                hint = " ",
              },
            },
            { "filetype", icon_only = true, separator = "", padding = { left = 1, right = 0 } },
            { 
              "filename",
              path = 1, -- Relative path
              symbols = { modified = "  ", readonly = "", unnamed = "" }
            },
            -- Show Deno project indicator
            {
              function()
                if vim.b.deno_project then
                  return "🦕 Deno"
                end
                return ""
              end,
              color = { fg = "#00d2d3" },
            },
          },
          lualine_x = {
            -- LSP status
            {
              function()
                local msg = ""
                local buf_ft = vim.api.nvim_buf_get_option(0, "filetype")
                local clients = vim.lsp.get_active_clients()
                if next(clients) == nil then
                  return msg
                end
                for _, client in ipairs(clients) do
                  local filetypes = client.config.filetypes
                  if filetypes and vim.fn.index(filetypes, buf_ft) ~= -1 then
                    return client.name
                  end
                end
                return msg
              end,
              icon = " LSP:",
              color = { fg = "#ffffff", gui = "bold" },
            },
            {
              "encoding",
              fmt = string.upper,
            },
            {
              "fileformat",
              fmt = string.upper,
              icons_enabled = false,
            },
          },
          lualine_y = {
            { "progress", separator = " ", padding = { left = 1, right = 0 } },
            { "location", padding = { left = 0, right = 1 } },
          },
          lualine_z = {
            {
              function()
                return " " .. os.date("%R")
              end,
              separator = { right = "" },
              left_padding = 2,
            },
          },
        },
        inactive_sections = {
          lualine_a = { "filename" },
          lualine_b = {},
          lualine_c = {},
          lualine_x = {},
          lualine_y = {},
          lualine_z = { "location" },
        },
        tabline = {},
        extensions = { "neo-tree", "lazy", "mason", "trouble" },
      }
    end,
  },

  -- Buffer line / tabs
  {
    "akinsho/bufferline.nvim",
    event = "VeryLazy",
    keys = {
      { "<leader>bp", "<Cmd>BufferLineTogglePin<CR>", desc = "Toggle pin" },
      { "<leader>bP", "<Cmd>BufferLineGroupClose ungrouped<CR>", desc = "Delete non-pinned buffers" },
      { "<leader>bo", "<Cmd>BufferLineCloseOthers<CR>", desc = "Delete other buffers" },
      { "<leader>br", "<Cmd>BufferLineCloseRight<CR>", desc = "Delete buffers to the right" },
      { "<leader>bl", "<Cmd>BufferLineCloseLeft<CR>", desc = "Delete buffers to the left" },
      { "<S-h>", "<cmd>BufferLineCyclePrev<cr>", desc = "Prev buffer" },
      { "<S-l>", "<cmd>BufferLineCycleNext<cr>", desc = "Next buffer" },
      { "[b", "<cmd>BufferLineCyclePrev<cr>", desc = "Prev buffer" },
      { "]b", "<cmd>BufferLineCycleNext<cr>", desc = "Next buffer" },
    },
    opts = {
      options = {
        close_command = "bdelete! %d",
        right_mouse_command = "bdelete! %d",
        diagnostics = "nvim_lsp",
        always_show_bufferline = false,
        diagnostics_indicator = function(_, _, diag)
          local icons = { error = " ", warn = " ", info = " " }
          local ret = (diag.error and icons.error .. diag.error .. " " or "")
            .. (diag.warning and icons.warn .. diag.warning or "")
          return vim.trim(ret)
        end,
        offsets = {
          {
            filetype = "neo-tree",
            text = "Neo-tree",
            highlight = "Directory",
            text_align = "left",
          },
        },
      },
    },
    config = function(_, opts)
      require("bufferline").setup(opts)
      -- Fix bufferline when restoring a session
      vim.api.nvim_create_autocmd("BufAdd", {
        callback = function()
          vim.schedule(function()
            pcall(nvim_bufferline)
          end)
        end,
      })
    end,
  },

  -- Dashboard
  {
    "nvimdev/dashboard-nvim",
    event = "VimEnter",
    opts = function()
      local logo = [[
      ██████╗ ███████╗███╗   ██╗ ██████╗  ██████╗ ███████╗███╗   ██╗███████╗███████╗██╗███████╗
      ██╔══██╗██╔════╝████╗  ██║██╔═══██╗██╔════╝ ██╔════╝████╗  ██║██╔════╝██╔════╝██║██╔════╝
      ██║  ██║█████╗  ██╔██╗ ██║██║   ██║██║  ███╗█████╗  ██╔██╗ ██║█████╗  ███████╗██║███████╗
      ██║  ██║██╔══╝  ██║╚██╗██║██║   ██║██║   ██║██╔══╝  ██║╚██╗██║██╔══╝  ╚════██║██║╚════██║
      ██████╔╝███████╗██║ ╚████║╚██████╔╝╚██████╔╝███████╗██║ ╚████║███████╗███████║██║███████║
      ╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝╚══════╝
      
                            🦕 Modern TypeScript Development Framework
      ]]

      logo = string.rep("\n", 8) .. logo .. "\n\n"

      local opts = {
        theme = "doom",
        hide = {
          statusline = false,
        },
        config = {
          header = vim.split(logo, "\n"),
          center = {
            { action = "Telescope find_files", desc = " Find file", icon = " ", key = "f" },
            { action = "ene | startinsert", desc = " New file", icon = " ", key = "n" },
            { action = "Telescope oldfiles", desc = " Recent files", icon = " ", key = "r" },
            { action = "Telescope live_grep", desc = " Find text", icon = " ", key = "g" },
            { action = "e $MYVIMRC", desc = " Config", icon = " ", key = "c" },
            { action = "Lazy", desc = " Lazy", icon = "󰒲 ", key = "l" },
            { action = "qa", desc = " Quit", icon = " ", key = "q" },
          },
          footer = function()
            local stats = require("lazy").stats()
            local ms = (math.floor(stats.startuptime * 100 + 0.5) / 100)
            return { "⚡ Neovim loaded " .. stats.loaded .. "/" .. stats.count .. " plugins in " .. ms .. "ms" }
          end,
        },
      }

      for _, button in ipairs(opts.config.center) do
        button.desc = button.desc .. string.rep(" ", 43 - #button.desc)
        button.key_format = "  %s"
      end

      -- Close Lazy and re-open when the dashboard is ready
      if vim.o.filetype == "lazy" then
        vim.cmd.close()
        vim.api.nvim_create_autocmd("User", {
          pattern = "DashboardLoaded",
          callback = function()
            require("lazy").show()
          end,
        })
      end

      return opts
    end,
  },

  -- Icons
  { "nvim-tree/nvim-web-devicons", lazy = true },

  -- UI components library
  { "MunifTanjim/nui.nvim", lazy = true },

  -- Better vim.notify
  {
    "rcarriga/nvim-notify",
    keys = {
      {
        "<leader>un",
        function()
          require("notify").dismiss({ silent = true, pending = true })
        end,
        desc = "Dismiss all Notifications",
      },
    },
    opts = {
      timeout = 3000,
      max_height = function()
        return math.floor(vim.o.lines * 0.75)
      end,
      max_width = function()
        return math.floor(vim.o.columns * 0.75)
      end,
      on_open = function(win)
        vim.api.nvim_win_set_config(win, { zindex = 100 })
      end,
    },
    init = function()
      vim.notify = require("notify")
    end,
  },

  -- Better vim.ui
  {
    "stevearc/dressing.nvim",
    lazy = true,
    init = function()
      ---@diagnostic disable-next-line: duplicate-set-field
      vim.ui.select = function(...)
        require("lazy").load({ plugins = { "dressing.nvim" } })
        return vim.ui.select(...)
      end
      ---@diagnostic disable-next-line: duplicate-set-field
      vim.ui.input = function(...)
        require("lazy").load({ plugins = { "dressing.nvim" } })
        return vim.ui.input(...)
      end
    end,
  },

  -- Indent guides
  {
    "lukas-reineke/indent-blankline.nvim",
    event = { "BufReadPost", "BufNewFile" },
    opts = {
      indent = {
        char = "│",
        tab_char = "│",
      },
      scope = { enabled = false },
      exclude = {
        filetypes = {
          "help",
          "alpha",
          "dashboard",
          "neo-tree",
          "Trouble",
          "trouble",
          "lazy",
          "mason",
          "notify",
          "toggleterm",
          "lazyterm",
        },
      },
    },
    main = "ibl",
  },

    -- Active indent guide and indent text objects
  {
    "echasnovski/mini.indentscope",
    version = false, -- wait till new 0.7.0 release to put it back on semver
    event = { "BufReadPost", "BufNewFile" },
    opts = {
      symbol = "│",
      options = { try_as_border = true },
    },
    init = function()
      vim.api.nvim_create_autocmd("FileType", {
        pattern = {
          "help",
          "alpha",
          "dashboard",
          "neo-tree",
          "Trouble",
          "trouble",
          "lazy",
          "mason",
          "notify",
          "toggleterm",
          "lazyterm",
        },
        callback = function()
          vim.b.miniindentscope_disable = true
        end,
      })
    end,
  },
}
EOF

log "Created plugins/ui.lua"
