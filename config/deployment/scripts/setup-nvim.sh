#!/usr/bin/env bash

# =============================================================================
# DenoGenesis Neovim Setup Script
# =============================================================================
# Unix Philosophy Implementation:
# 1. Do One Thing Well: Configure Neovim for Deno TypeScript development ONLY
# 2. Make Everything a Filter: Accept input configs, transform to nvim setup
# 3. Avoid Captive User Interfaces: Return structured data about setup process
# 4. Store Data in Flat Text Files: All configs are readable text files
# 5. Leverage Software Leverage: Compose with existing nvim plugin ecosystem
#
# This script sets up a complete Neovim IDE environment optimized for
# Deno Genesis development with TypeScript, LSP, completion, and all
# necessary tooling following Unix Philosophy principles.
#
# @version 1.0.0
# @author AI-Augmented Development
# @license AGPL-3.0
# @compatible Unix-like systems (Linux, macOS, WSL)

set -euo pipefail

# =============================================================================
# CONFIGURATION VARIABLES
# =============================================================================

# Default configuration
DEFAULT_CONFIG_PATH="${HOME}/.config/nvim"
DEFAULT_BACKUP=true
DEFAULT_SETUP_DENO=true
DEFAULT_THEME="tokyonight"
DEFAULT_MINIMAL=false

# Initialize variables
CONFIG_PATH="$DEFAULT_CONFIG_PATH"
BACKUP_EXISTING="$DEFAULT_BACKUP"
SETUP_DENO="$DEFAULT_SETUP_DENO"
THEME="$DEFAULT_THEME"
MINIMAL="$DEFAULT_MINIMAL"

# Arrays for tracking
declare -a FILES_CREATED=()
declare -a WARNINGS=()
declare -a ERRORS=()

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS+=("$1")
}

log_error() {
    echo -e "${RED}❌ $1${NC}" >&2
    ERRORS+=("$1")
}

show_help() {
    cat << EOF
${CYAN}DenoGenesis Neovim Setup Script${NC}

${PURPLE}USAGE:${NC}
    setup-nvim.sh [OPTIONS]

${PURPLE}OPTIONS:${NC}
    --config-path <PATH>    Custom config path (default: ~/.config/nvim)
    --no-backup            Don't backup existing configuration
    --no-deno              Don't setup Deno LSP and features
    --theme <THEME>        Color theme: tokyonight, catppuccin, gruvbox
    --minimal              Install only essential features
    --help, -h             Show this help message

${PURPLE}EXAMPLES:${NC}
    setup-nvim.sh                           # Full setup with defaults
    setup-nvim.sh --minimal --no-deno       # Minimal setup without Deno
    setup-nvim.sh --theme gruvbox           # Setup with Gruvbox theme
    setup-nvim.sh --config-path ~/.nvim     # Custom config location

${PURPLE}FEATURES:${NC}
This script follows Unix Philosophy principles:
- Does one thing well: sets up Neovim for Deno Genesis development
- Returns structured data about the setup process
- Stores configuration as readable text files
- Leverages existing plugin ecosystem for maximum compatibility

${PURPLE}PREREQUISITES:${NC}
- Neovim 0.8+ (preferably 0.9+)
- Git (for plugin management)
- Deno (if --deno flag is used)

EOF
}

# =============================================================================
# PREREQUISITE CHECKING
# =============================================================================

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Neovim is installed
    if ! command -v nvim &> /dev/null; then
        log_error "Neovim is not installed or not in PATH"
        return 1
    fi
    
    # Check Neovim version
    local nvim_version
    nvim_version=$(nvim --version | head -n1 | grep -oE 'v[0-9]+\.[0-9]+' | cut -d'v' -f2)
    local major_version
    major_version=$(echo "$nvim_version" | cut -d'.' -f1)
    local minor_version
    minor_version=$(echo "$nvim_version" | cut -d'.' -f2)
    
    if [[ "$major_version" -eq 0 && "$minor_version" -lt 8 ]]; then
        log_warning "Neovim version $nvim_version might be too old. Recommend 0.8+"
    fi
    
    # Check if Git is installed
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed or not in PATH (required for plugin management)"
        return 1
    fi
    
    # Check if Deno is installed (if Deno setup is requested)
    if [[ "$SETUP_DENO" == "true" ]] && ! command -v deno &> /dev/null; then
        log_warning "Deno is not installed or not in PATH. Deno LSP features will be limited."
    fi
    
    log_success "Prerequisites check completed"
    return 0
}

# =============================================================================
# BACKUP AND DIRECTORY SETUP
# =============================================================================

backup_existing_config() {
    if [[ -d "$CONFIG_PATH" ]]; then
        local backup_path="${CONFIG_PATH}.backup.$(date +%s)"
        log_info "Backing up existing configuration to $backup_path"
        mv "$CONFIG_PATH" "$backup_path"
        log_warning "Existing configuration backed up to: $backup_path"
        echo "$backup_path" # Return backup path
    fi
}

create_directory_structure() {
    log_info "Creating directory structure..."
    
    local directories=(
        "$CONFIG_PATH"
        "$CONFIG_PATH/lua"
        "$CONFIG_PATH/lua/config"
        "$CONFIG_PATH/lua/plugins"
        "$CONFIG_PATH/undo"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
    done
    
    log_success "Directory structure created"
}

# =============================================================================
# CONFIGURATION FILE GENERATORS
# =============================================================================

generate_init_lua() {
    cat << 'EOF'
-- =============================================================================
-- DenoGenesis Neovim Configuration - init.lua
-- =============================================================================
-- Unix Philosophy: Simple, composable, does one thing well
-- Generated by setup-nvim.sh following Deno Genesis principles

-- Initialize core configuration
require("config.options")
require("config.lazy")
require("config.keymaps")

-- Enable Deno for TypeScript files globally
vim.g.deno_enable = true

-- Auto-detect Deno projects and configure accordingly
local augroup = vim.api.nvim_create_augroup("DenoConfig", { clear = true })
vim.api.nvim_create_autocmd({"BufRead", "BufNewFile"}, {
  group = augroup,
  pattern = {"*.ts", "*.tsx", "*.js", "*.jsx"},
  callback = function()
    -- Check for Deno project indicators
    local deno_config = vim.fn.findfile("deno.json", ".;")
    local deno_config_c = vim.fn.findfile("deno.jsonc", ".;")
    local import_map = vim.fn.findfile("import_map.json", ".;")
    
    if deno_config ~= "" or deno_config_c ~= "" or import_map ~= "" then
      vim.b.deno_enable = true
      vim.bo.filetype = "typescript"
      
      -- Set Deno-specific options
      vim.bo.expandtab = true
      vim.bo.tabstop = 2
      vim.bo.shiftwidth = 2
      vim.bo.softtabstop = 2
    end
  end,
})

-- Create custom commands for Deno
vim.api.nvim_create_user_command('DenoRun', function()
  vim.cmd('!deno run %')
end, { desc = 'Run current Deno file' })

vim.api.nvim_create_user_command('DenoTest', function()
  vim.cmd('!deno test')
end, { desc = 'Run Deno tests' })

vim.api.nvim_create_user_command('DenoFmt', function()
  vim.cmd('!deno fmt %')
  vim.cmd('edit!')
end, { desc = 'Format current file with Deno' })

vim.api.nvim_create_user_command('DenoLint', function()
  vim.cmd('!deno lint %')
end, { desc = 'Lint current file with Deno' })
EOF
}

generate_options_lua() {
    cat << 'EOF'
-- =============================================================================
-- Neovim Options Configuration
-- =============================================================================

local opt = vim.opt

-- Line numbers
opt.number = true
opt.relativenumber = true

-- Tabs and indentation (Deno Genesis standard: 2 spaces)
opt.tabstop = 2
opt.softtabstop = 2
opt.shiftwidth = 2
opt.expandtab = true
opt.autoindent = true
opt.smartindent = true

-- Line wrapping
opt.wrap = false

-- Search settings
opt.ignorecase = true
opt.smartcase = true
opt.hlsearch = true
opt.incsearch = true

-- Cursor line
opt.cursorline = true

-- Appearance
opt.termguicolors = true
opt.background = "dark"
opt.signcolumn = "yes"
opt.colorcolumn = "100"

-- Backspace
opt.backspace = "indent,eol,start"

-- Clipboard (system clipboard integration)
opt.clipboard:append("unnamedplus")

-- Split windows
opt.splitright = true
opt.splitbelow = true

-- Undo settings
opt.undofile = true
opt.undodir = vim.fn.expand("~/.config/nvim/undo")

-- Update time (for better UX and LSP responsiveness)
opt.updatetime = 300
opt.timeoutlen = 300

-- File encoding
opt.fileencoding = "utf-8"

-- Scrolling
opt.scrolloff = 8
opt.sidescrolloff = 8

-- Better completion
opt.completeopt = "menuone,noselect"

-- Hide command line when not used
opt.cmdheight = 1

-- Better performance
opt.lazyredraw = false
opt.ttyfast = true

-- Folding (using treesitter when available)
opt.foldmethod = "expr"
opt.foldexpr = "nvim_treesitter#foldexpr()"
opt.foldenable = false -- Start with all folds open
EOF
}

generate_lazy_lua() {
    cat << 'EOF'
-- =============================================================================
-- Lazy.nvim Plugin Manager Configuration
-- =============================================================================

local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system({
    "git",
    "clone",
    "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--branch=stable", -- latest stable release
    lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

-- Setup lazy.nvim
require("lazy").setup({
  -- Import plugin configurations
  { import = "plugins" },
}, {
  -- Lazy.nvim configuration
  defaults = {
    lazy = false, -- should plugins be lazy-loaded?
    version = nil, -- try installing the latest stable version for plugins that support semver
  },
  install = {
    -- install missing plugins on startup
    missing = true,
    -- try to load one of these colorschemes when starting an installation during startup
    colorscheme = { "tokyonight", "habamax" },
  },
  checker = {
    -- automatically check for plugin updates
    enabled = true,
    concurrency = nil, -- nil means use the number of available cores
    notify = false, -- get a notification when new updates are found
    frequency = 3600, -- check for updates every hour
  },
  change_detection = {
    -- automatically check for config file changes and reload the ui
    enabled = true,
    notify = false, -- get a notification when changes are found
  },
  performance = {
    rtp = {
      -- disable some rtp plugins
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
})
EOF
}

generate_keymaps_lua() {
    cat << 'EOF'
-- =============================================================================
-- Keymaps Configuration
-- =============================================================================

-- Set leader key to space
vim.g.mapleader = " "
vim.g.maplocalleader = " "

local keymap = vim.keymap.set

-- General keymaps
keymap("i", "jk", "<ESC>", { desc = "Exit insert mode with jk" })
keymap("n", "<leader>nh", ":nohl<CR>", { desc = "Clear search highlights" })

-- Window management
keymap("n", "<leader>sv", "<C-w>v", { desc = "Split window vertically" })
keymap("n", "<leader>sh", "<C-w>s", { desc = "Split window horizontally" })
keymap("n", "<leader>se", "<C-w>=", { desc = "Make split windows equal size" })
keymap("n", "<leader>sx", "<cmd>close<CR>", { desc = "Close current split" })

-- Tab management
keymap("n", "<leader>to", "<cmd>tabnew<CR>", { desc = "Open new tab" })
keymap("n", "<leader>tx", "<cmd>tabclose<CR>", { desc = "Close current tab" })
keymap("n", "<leader>tn", "<cmd>tabn<CR>", { desc = "Go to next tab" })
keymap("n", "<leader>tp", "<cmd>tabp<CR>", { desc = "Go to previous tab" })

-- Buffer management
keymap("n", "<leader>bd", "<cmd>bdelete<CR>", { desc = "Delete buffer" })
keymap("n", "<leader>bn", "<cmd>bnext<CR>", { desc = "Next buffer" })
keymap("n", "<leader>bp", "<cmd>bprev<CR>", { desc = "Previous buffer" })

-- Better navigation
keymap("n", "<C-d>", "<C-d>zz", { desc = "Scroll down and center" })
keymap("n", "<C-u>", "<C-u>zz", { desc = "Scroll up and center" })
keymap("n", "n", "nzz", { desc = "Next search result and center" })
keymap("n", "N", "Nzz", { desc = "Previous search result and center" })

-- Move lines
keymap("v", "J", ":m '>+1<CR>gv=gv", { desc = "Move selection down" })
keymap("v", "K", ":m '<-2<CR>gv=gv", { desc = "Move selection up" })

-- Better indenting
keymap("v", "<", "<gv", { desc = "Indent left and reselect" })
keymap("v", ">", ">gv", { desc = "Indent right and reselect" })

-- Deno Genesis specific keymaps
keymap("n", "<leader>dr", "<cmd>DenoRun<CR>", { desc = "Run Deno file" })
keymap("n", "<leader>dt", "<cmd>DenoTest<CR>", { desc = "Run Deno tests" })
keymap("n", "<leader>df", "<cmd>DenoFmt<CR>", { desc = "Format with Deno" })
keymap("n", "<leader>dl", "<cmd>DenoLint<CR>", { desc = "Lint with Deno" })

-- LSP keymaps (will be overridden by LSP plugin if available)
keymap("n", "gd", vim.lsp.buf.definition, { desc = "Go to definition" })
keymap("n", "gr", vim.lsp.buf.references, { desc = "Show references" })
keymap("n", "gi", vim.lsp.buf.implementation, { desc = "Go to implementation" })
keymap("n", "K", vim.lsp.buf.hover, { desc = "Show hover documentation" })
keymap("n", "<leader>ca", vim.lsp.buf.code_action, { desc = "Code actions" })
keymap("n", "<leader>rn", vim.lsp.buf.rename, { desc = "Rename symbol" })
keymap("n", "<leader>f", vim.lsp.buf.format, { desc = "Format code" })

-- Diagnostic keymaps
keymap("n", "<leader>d", vim.diagnostic.open_float, { desc = "Show diagnostic" })
keymap("n", "[d", vim.diagnostic.goto_prev, { desc = "Previous diagnostic" })
keymap("n", "]d", vim.diagnostic.goto_next, { desc = "Next diagnostic" })
EOF
}

generate_lsp_lua() {
    local setup_deno="$1"
    cat << EOF
-- =============================================================================
-- LSP Configuration
-- =============================================================================

return {
  -- LSP Configuration & Plugins
  {
    'neovim/nvim-lspconfig',
    dependencies = {
      'williamboman/mason.nvim',
      'williamboman/mason-lspconfig.nvim',
      'j-hui/fidget.nvim', -- LSP status updates
    },
    config = function()
      -- Setup Mason
      require('mason').setup({
        ui = {
          icons = {
            package_installed = "✓",
            package_pending = "➜",
            package_uninstalled = "✗"
          }
        }
      })

      -- Setup Mason-LSPconfig
      require('mason-lspconfig').setup({
        ensure_installed = {
$(if [[ "$setup_deno" == "true" ]]; then
  echo '          "denols",'
fi)
          "tsserver",
          "html",
          "cssls",
          "jsonls",
          "lua_ls",
        },
        automatic_installation = true,
      })

      -- LSP settings
      local lspconfig = require('lspconfig')
      
      -- Diagnostic configuration
      vim.diagnostic.config({
        virtual_text = {
          prefix = '●',
        },
        signs = true,
        underline = true,
        update_in_insert = false,
        severity_sort = true,
        float = {
          focusable = false,
          style = "minimal",
          border = "rounded",
          source = "always",
          header = "",
          prefix = "",
        },
      })

      -- Enhanced capabilities with completion
      local capabilities = vim.lsp.protocol.make_client_capabilities()
      capabilities = require('cmp_nvim_lsp').default_capabilities(capabilities)

      -- Custom on_attach function
      local on_attach = function(client, bufnr)
        -- Enhanced keymaps for LSP
        local opts = { buffer = bufnr, silent = true }
        vim.keymap.set('n', 'gd', vim.lsp.buf.definition, opts)
        vim.keymap.set('n', 'gr', vim.lsp.buf.references, opts)
        vim.keymap.set('n', 'gi', vim.lsp.buf.implementation, opts)
        vim.keymap.set('n', 'K', vim.lsp.buf.hover, opts)
        vim.keymap.set('n', '<leader>rn', vim.lsp.buf.rename, opts)
        vim.keymap.set('n', '<leader>ca', vim.lsp.buf.code_action, opts)
        vim.keymap.set('n', '<leader>f', function()
          vim.lsp.buf.format({ async = true })
        end, opts)
      end

$(if [[ "$setup_deno" == "true" ]]; then
cat << 'DENO_LSP_EOF'
      -- Deno LSP setup (priority over tsserver for Deno projects)
      lspconfig.denols.setup({
        on_attach = on_attach,
        capabilities = capabilities,
        root_dir = lspconfig.util.root_pattern("deno.json", "deno.jsonc"),
        init_options = {
          lint = true,
          unstable = true,
          suggest = {
            imports = {
              hosts = {
                ["https://deno.land"] = true,
                ["https://cdn.nest.land"] = true,
              },
            },
          },
        },
        settings = {
          deno = {
            enable = true,
            lint = true,
            unstable = true,
            suggest = {
              imports = {
                hosts = {
                  ["https://deno.land"] = true,
                  ["https://cdn.nest.land"] = true,
                },
              },
            },
          },
        },
      })
DENO_LSP_EOF
fi)

      -- TypeScript/JavaScript LSP (for non-Deno projects)
      lspconfig.tsserver.setup({
        on_attach = on_attach,
        capabilities = capabilities,
        root_dir = lspconfig.util.root_pattern("package.json", "tsconfig.json"),
$(if [[ "$setup_deno" == "true" ]]; then
cat << 'TS_SETUP_EOF'
        single_file_support = false, -- Disable for single files when Deno is available
TS_SETUP_EOF
fi)
      })

      -- HTML LSP
      lspconfig.html.setup({
        on_attach = on_attach,
        capabilities = capabilities,
      })

      -- CSS LSP
      lspconfig.cssls.setup({
        on_attach = on_attach,
        capabilities = capabilities,
      })

      -- JSON LSP
      lspconfig.jsonls.setup({
        on_attach = on_attach,
        capabilities = capabilities,
        settings = {
          json = {
            schemas = {
              {
                fileMatch = { "deno.json", "deno.jsonc" },
                url = "https://raw.githubusercontent.com/denoland/deno/main/cli/schemas/config-file.v1.json",
              },
              {
                fileMatch = { "package.json" },
                url = "https://json.schemastore.org/package.json",
              },
              {
                fileMatch = { "tsconfig*.json" },
                url = "https://json.schemastore.org/tsconfig.json",
              },
            },
          },
        },
      })

      -- Lua LSP (for Neovim configuration)
      lspconfig.lua_ls.setup({
        on_attach = on_attach,
        capabilities = capabilities,
        settings = {
          Lua = {
            runtime = {
              version = 'LuaJIT',
            },
            diagnostics = {
              globals = { 'vim' },
            },
            workspace = {
              library = vim.api.nvim_get_runtime_file("", true),
              checkThirdParty = false,
            },
            telemetry = {
              enable = false,
            },
          },
        },
      })

      -- Setup fidget for LSP status
      require('fidget').setup({})
    end,
  },
}
EOF
}

generate_completion_lua() {
    cat << 'EOF'
-- =============================================================================
-- Completion Configuration
-- =============================================================================

return {
  -- Autocompletion
  {
    'hrsh7th/nvim-cmp',
    event = 'InsertEnter',
    dependencies = {
      'hrsh7th/cmp-buffer', -- source for text in buffer
      'hrsh7th/cmp-path', -- source for file system paths
      'hrsh7th/cmp-nvim-lsp', -- source for LSP
      'hrsh7th/cmp-nvim-lua', -- source for Neovim Lua API
      'L3MON4D3/LuaSnip', -- snippet engine
      'saadparwaiz1/cmp_luasnip', -- source for luasnip
      'rafamadriz/friendly-snippets', -- useful snippets
      'onsails/lspkind.nvim', -- vs-code like pictograms
    },
    config = function()
      local cmp = require('cmp')
      local luasnip = require('luasnip')
      local lspkind = require('lspkind')

      -- Load friendly-snippets
      require('luasnip.loaders.from_vscode').lazy_load()

      cmp.setup({
        snippet = {
          expand = function(args)
            luasnip.lsp_expand(args.body)
          end,
        },
        window = {
          completion = cmp.config.window.bordered(),
          documentation = cmp.config.window.bordered(),
        },
        mapping = cmp.mapping.preset.insert({
          ['<C-b>'] = cmp.mapping.scroll_docs(-4),
          ['<C-f>'] = cmp.mapping.scroll_docs(4),
          ['<C-Space>'] = cmp.mapping.complete(),
          ['<C-e>'] = cmp.mapping.abort(),
          ['<CR>'] = cmp.mapping.confirm({ select = false }),
          ['<Tab>'] = cmp.mapping(function(fallback)
            if cmp.visible() then
              cmp.select_next_item()
            elseif luasnip.expand_or_jumpable() then
              luasnip.expand_or_jump()
            else
              fallback()
            end
          end, { 'i', 's' }),
          ['<S-Tab>'] = cmp.mapping(function(fallback)
            if cmp.visible() then
              cmp.select_prev_item()
            elseif luasnip.jumpable(-1) then
              luasnip.jump(-1)
            else
              fallback()
            end
          end, { 'i', 's' }),
        }),
        sources = cmp.config.sources({
          { name = 'nvim_lsp', priority = 1000 },
          { name = 'nvim_lua', priority = 900 },
          { name = 'luasnip', priority = 800 },
          { name = 'path', priority = 700 },
        }, {
          { name = 'buffer', keyword_length = 3 },
        }),
        formatting = {
          format = lspkind.cmp_format({
            mode = 'symbol_text',
            maxwidth = 50,
            ellipsis_char = '...',
            before = function(entry, vim_item)
              -- Source name
              vim_item.menu = ({
                nvim_lsp = "[LSP]",
                nvim_lua = "[Lua]",
                luasnip = "[Snippet]",
                buffer = "[Buffer]",
                path = "[Path]",
              })[entry.source.name]
              return vim_item
            end,
          }),
        },
        experimental = {
          ghost_text = true,
        },
      })
    end,
  },
}
EOF
}

generate_treesitter_lua() {
    cat << 'EOF'
-- =============================================================================
-- Treesitter Configuration
-- =============================================================================

return {
  -- Treesitter for better syntax highlighting and code understanding
  {
    'nvim-treesitter/nvim-treesitter',
    build = ':TSUpdate',
    event = { 'BufReadPost', 'BufNewFile' },
    dependencies = {
      'nvim-treesitter/nvim-treesitter-textobjects',
    },
    config = function()
      require('nvim-treesitter.configs').setup({
        -- Languages to install
        ensure_installed = {
          'typescript',
          'tsx',
          'javascript',
          'json',
          'jsonc',
          'html',
          'css',
          'lua',
          'vim',
          'vimdoc',
          'markdown',
          'markdown_inline',
          'bash',
          'yaml',
          'toml',
        },
        
        -- Install languages synchronously (only applied to `ensure_installed`)
        sync_install = false,
        
        -- Automatically install missing parsers when entering buffer
        auto_install = true,
        
        highlight = {
          enable = true,
          -- Some languages have better built-in syntax highlighting
          disable = {},
          -- Setting this to true will run `:h syntax` and tree-sitter at the same time.
          additional_vim_regex_highlighting = false,
        },
        
        indent = {
          enable = true,
        },
        
        -- Incremental selection
        incremental_selection = {
          enable = true,
          keymaps = {
            init_selection = '<C-space>',
            node_incremental = '<C-space>',
            scope_incremental = '<C-s>',
            node_decremental = '<C-backspace>',
          },
        },
        
        -- Text objects
        textobjects = {
          select = {
            enable = true,
            lookahead = true, -- Automatically jump forward to textobj
            keymaps = {
              ['aa'] = '@parameter.outer',
              ['ia'] = '@parameter.inner',
              ['af'] = '@function.outer',
              ['if'] = '@function.inner',
              ['ac'] = '@class.outer',
              ['ic'] = '@class.inner',
            },
          },
          move = {
            enable = true,
            set_jumps = true, -- whether to set jumps in the jumplist
            goto_next_start = {
              [']m'] = '@function.outer',
              [']]'] = '@class.outer',
            },
            goto_next_end = {
              [']M'] = '@function.outer',
              [']['] = '@class.outer',
            },
            goto_previous_start = {
              ['[m'] = '@function.outer',
              ['[['] = '@class.outer',
            },
            goto_previous_end = {
              ['[M'] = '@function.outer',
              ['[]'] = '@class.outer',
            },
          },
          swap = {
            enable = true,
            swap_next = {
              ['<leader>a'] = '@parameter.inner',
            },
            swap_previous = {
              ['<leader>A'] = '@parameter.inner',
            },
          },
        },
      })
    end,
  },
}
EOF
}

generate_telescope_lua() {
    cat << 'EOF'
-- =============================================================================
-- Telescope Configuration
-- =============================================================================

return {
  -- Fuzzy finder
  {
    'nvim-telescope/telescope.nvim',
    branch = '0.1.x',
    dependencies = {
      'nvim-lua/plenary.nvim',
      {
        'nvim-telescope/telescope-fzf-native.nvim',
        build = 'make',
        cond = function()
          return vim.fn.executable 'make' == 1
        end,
      },
    },
    config = function()
      local telescope = require('telescope')
      local actions = require('telescope.actions')

      telescope.setup({
        defaults = {
          path_display = { 'truncate' },
          mappings = {
            i = {
              ['<C-k>'] = actions.move_selection_previous,
              ['<C-j>'] = actions.move_selection_next,
              ['<C-q>'] = actions.send_selected_to_qflist + actions.open_qflist,
            },
          },
          file_ignore_patterns = {
            'node_modules/',
            '.git/',
            '.cache/',
            '%.o',
            '%.a',
            '%.out',
            '%.class',
            '%.pdf',
            '%.mkv',
            '%.mp4',
            '%.zip',
          },
        },
        pickers = {
          find_files = {
            hidden = true,
          },
          live_grep = {
            additional_args = function(opts)
              return {"--hidden"}
            end
          },
        },
        extensions = {
          fzf = {
            fuzzy = true,
            override_generic_sorter = true,
            override_file_sorter = true,
            case_mode = "smart_case",
          },
        },
      })

      -- Enable telescope fzf native, if installed
      pcall(telescope.load_extension, 'fzf')

      -- Telescope keymaps
      local builtin = require('telescope.builtin')
      vim.keymap.set('n', '<leader>ff', builtin.find_files, { desc = 'Find files' })
      vim.keymap.set('n', '<leader>fg', builtin.live_grep, { desc = 'Find text' })
      vim.keymap.set('n', '<leader>fb', builtin.buffers, { desc = 'Find buffers' })
      vim.keymap.set('n', '<leader>fh', builtin.help_tags, { desc = 'Find help' })
      vim.keymap.set('n', '<leader>fr', builtin.oldfiles, { desc = 'Find recent files' })
      vim.keymap.set('n', '<leader>fc', builtin.grep_string, { desc = 'Find word under cursor' })
      vim.keymap.set('n', '<leader>fd', builtin.diagnostics, { desc = 'Find diagnostics' })
      vim.keymap.set('n', '<leader>fs', builtin.lsp_document_symbols, { desc = 'Find document symbols' })
      vim.keymap.set('n', '<leader>fw', builtin.lsp_workspace_symbols, { desc = 'Find workspace symbols' })
    end,
  },
}
EOF
}

generate_ui_lua() {
    local theme="$1"
    local minimal="$2"
    
    cat << EOF
-- =============================================================================
-- UI Configuration
-- =============================================================================

return {
  -- Color scheme
  {
$(if [[ "$theme" == "tokyonight" ]]; then
cat << 'TOKYO_EOF'
    'folke/tokyonight.nvim',
    lazy = false,
    priority = 1000,
    config = function()
      require('tokyonight').setup({
        style = 'night',
        transparent = false,
        terminal_colors = true,
        styles = {
          comments = { italic = true },
          keywords = { italic = true },
          functions = {},
          variables = {},
        },
        sidebars = { 'qf', 'help' },
        day_brightness = 0.3,
        hide_inactive_statusline = false,
        dim_inactive = false,
        lualine_bold = false,
        on_colors = function(colors) end,
        on_highlights = function(highlights, colors) end,
      })
      vim.cmd([[colorscheme tokyonight]])
    end,
TOKYO_EOF
elif [[ "$theme" == "catppuccin" ]]; then
cat << 'CATPPUCCIN_EOF'
    'catppuccin/nvim',
    name = 'catppuccin',
    lazy = false,
    priority = 1000,
    config = function()
      require('catppuccin').setup({
        flavour = 'mocha', -- latte, frappe, macchiato, mocha
        background = {
          light = 'latte',
          dark = 'mocha',
        },
        transparent_background = false,
        show_end_of_buffer = false,
        term_colors = false,
        dim_inactive = {
          enabled = false,
          shade = 'dark',
          percentage = 0.15,
        },
        no_italic = false,
        no_bold = false,
        no_underline = false,
        styles = {
          comments = { 'italic' },
          conditionals = { 'italic' },
          loops = {},
          functions = {},
          keywords = {},
          strings = {},
          variables = {},
          numbers = {},
          booleans = {},
          properties = {},
          types = {},
          operators = {},
        },
        integrations = {
          cmp = true,
          gitsigns = true,
          nvimtree = true,
          treesitter = true,
          telescope = {
            enabled = true,
          },
          mason = true,
          native_lsp = {
            enabled = true,
            virtual_text = {
              errors = { 'italic' },
              hints = { 'italic' },
              warnings = { 'italic' },
              information = { 'italic' },
            },
            underlines = {
              errors = { 'underline' },
              hints = { 'underline' },
              warnings = { 'underline' },
              information = { 'underline' },
            },
            inlay_hints = {
              background = true,
            },
          },
        },
      })
      vim.cmd([[colorscheme catppuccin]])
    end,
CATPPUCCIN_EOF
else  # gruvbox
cat << 'GRUVBOX_EOF'
    'ellisonleao/gruvbox.nvim',
    lazy = false,
    priority = 1000,
    config = function()
      require('gruvbox').setup({
        terminal_colors = true,
        undercurl = true,
        underline = true,
        bold = true,
        italic = {
          strings = true,
          emphasis = true,
          comments = true,
          operators = false,
          folds = true,
        },
        strikethrough = true,
        invert_selection = false,
        invert_signs = false,
        invert_tabline = false,
        invert_intend_guides = false,
        inverse = true,
        contrast = '',
        palette_overrides = {},
        overrides = {},
        dim_inactive = false,
        transparent_mode = false,
      })
      vim.cmd([[colorscheme gruvbox]])
    end,
GRUVBOX_EOF
fi)
  },

$(if [[ "$minimal" != "true" ]]; then
cat << 'UI_PLUGINS_EOF'
  -- Status line
  {
    'nvim-lualine/lualine.nvim',
    dependencies = { 'nvim-tree/nvim-web-devicons' },
    config = function()
      require('lualine').setup({
        options = {
          icons_enabled = true,
          theme = 'auto',
          component_separators = { left = '', right = '' },
          section_separators = { left = '', right = '' },
          disabled_filetypes = {
            statusline = {},
            winbar = {},
          },
          ignore_focus = {},
          always_divide_middle = true,
          globalstatus = false,
          refresh = {
            statusline = 1000,
            tabline = 1000,
            winbar = 1000,
          }
        },
        sections = {
          lualine_a = {'mode'},
          lualine_b = {'branch', 'diff', 'diagnostics'},
          lualine_c = {'filename'},
          lualine_x = {'encoding', 'fileformat', 'filetype'},
          lualine_y = {'progress'},
          lualine_z = {'location'}
        },
        inactive_sections = {
          lualine_a = {},
          lualine_b = {},
          lualine_c = {'filename'},
          lualine_x = {'location'},
          lualine_y = {},
          lualine_z = {}
        },
        tabline = {},
        winbar = {},
        inactive_winbar = {},
        extensions = {}
      })
    end,
  },

  -- File explorer
  {
    'nvim-tree/nvim-tree.lua',
    dependencies = { 'nvim-tree/nvim-web-devicons' },
    config = function()
      -- Disable netrw
      vim.g.loaded_netrw = 1
      vim.g.loaded_netrwPlugin = 1

      require('nvim-tree').setup({
        sort_by = 'case_sensitive',
        view = {
          width = 30,
        },
        renderer = {
          group_empty = true,
          icons = {
            glyphs = {
              folder = {
                arrow_closed = "⏵",
                arrow_open = "⏷",
              },
            },
          },
        },
        filters = {
          dotfiles = false,
          custom = { '.DS_Store' },
        },
        git = {
          enable = true,
          ignore = false,
          timeout = 400,
        },
        actions = {
          open_file = {
            quit_on_open = false,
            resize_window = true,
          },
        },
      })

      -- Keymaps for nvim-tree
      vim.keymap.set('n', '<leader>e', '<cmd>NvimTreeToggle<CR>', { desc = 'Toggle file explorer' })
      vim.keymap.set('n', '<leader>ef', '<cmd>NvimTreeFindFileToggle<CR>', { desc = 'Toggle file explorer on current file' })
      vim.keymap.set('n', '<leader>ec', '<cmd>NvimTreeCollapse<CR>', { desc = 'Collapse file explorer' })
      vim.keymap.set('n', '<leader>er', '<cmd>NvimTreeRefresh<CR>', { desc = 'Refresh file explorer' })
    end,
  },

  -- Git integration
  {
    'lewis6991/gitsigns.nvim',
    config = function()
      require('gitsigns').setup({
        signs = {
          add          = { text = '│' },
          change       = { text = '│' },
          delete       = { text = '_' },
          topdelete    = { text = '‾' },
          changedelete = { text = '~' },
          untracked    = { text = '┆' },
        },
        signcolumn = true,
        numhl = false,
        linehl = false,
        word_diff = false,
        watch_gitdir = {
          follow_files = true
        },
        attach_to_untracked = true,
        current_line_blame = false,
        current_line_blame_opts = {
          virt_text = true,
          virt_text_pos = 'eol',
          delay = 1000,
          ignore_whitespace = false,
        },
        sign_priority = 6,
        update_debounce = 100,
        status_formatter = nil,
        max_file_length = 40000,
        preview_config = {
          border = 'single',
          style = 'minimal',
          relative = 'cursor',
          row = 0,
          col = 1
        },
        on_attach = function(bufnr)
          local gs = package.loaded.gitsigns

          local function map(mode, l, r, opts)
            opts = opts or {}
            opts.buffer = bufnr
            vim.keymap.set(mode, l, r, opts)
          end

          -- Navigation
          map('n', ']c', function()
            if vim.wo.diff then return ']c' end
            vim.schedule(function() gs.next_hunk() end)
            return '<Ignore>'
          end, {expr=true})

          map('n', '[c', function()
            if vim.wo.diff then return '[c' end
            vim.schedule(function() gs.prev_hunk() end)
            return '<Ignore>'
          end, {expr=true})

          -- Actions
          map('n', '<leader>hs', gs.stage_hunk, { desc = 'Stage hunk' })
          map('n', '<leader>hr', gs.reset_hunk, { desc = 'Reset hunk' })
          map('v', '<leader>hs', function() gs.stage_hunk {vim.fn.line('.'), vim.fn.line('v')} end, { desc = 'Stage hunk' })
          map('v', '<leader>hr', function() gs.reset_hunk {vim.fn.line('.'), vim.fn.line('v')} end, { desc = 'Reset hunk' })
          map('n', '<leader>hS', gs.stage_buffer, { desc = 'Stage buffer' })
          map('n', '<leader>hu', gs.undo_stage_hunk, { desc = 'Undo stage hunk' })
          map('n', '<leader>hR', gs.reset_buffer, { desc = 'Reset buffer' })
          map('n', '<leader>hp', gs.preview_hunk, { desc = 'Preview hunk' })
          map('n', '<leader>hb', function() gs.blame_line{full=true} end, { desc = 'Blame line' })
          map('n', '<leader>tb', gs.toggle_current_line_blame, { desc = 'Toggle blame' })
          map('n', '<leader>hd', gs.diffthis, { desc = 'Diff this' })
          map('n', '<leader>hD', function() gs.diffthis('~') end, { desc = 'Diff this ~' })
          map('n', '<leader>td', gs.toggle_deleted, { desc = 'Toggle deleted' })

          -- Text object
          map({'o', 'x'}, 'ih', ':<C-U>Gitsigns select_hunk<CR>')
        end
      })
    end,
  },

  -- Indent guides
  {
    'lukas-reineke/indent-blankline.nvim',
    main = 'ibl',
    opts = {
      indent = {
        char = '│',
        tab_char = '│',
      },
      scope = { enabled = false },
      exclude = {
        filetypes = {
          'help',
          'alpha',
          'dashboard',
          'neo-tree',
          'Trouble',
          'trouble',
          'lazy',
          'mason',
          'notify',
          'toggleterm',
          'lazyterm',
        },
      },
    },
  },

  -- Better notifications
  {
    'rcarriga/nvim-notify',
    config = function()
      require('notify').setup({
        background_colour = '#000000',
        fps = 30,
        icons = {
          DEBUG = '',
          ERROR = '',
          INFO = '',
          TRACE = '✎',
          WARN = ''
        },
        level = 2,
        minimum_width = 50,
        render = 'default',
        stages = 'fade_in_slide_out',
        timeout = 5000,
        top_down = true
      })
      vim.notify = require('notify')
    end,
  },
UI_PLUGINS_EOF
fi)
}
EOF
}

generate_sample_deno_config() {
    cat << 'EOF'
{
  "compilerOptions": {
    "allowJs": true,
    "lib": ["dom", "dom.iterable", "es6"],
    "allowSyntheticDefaultImports": true,
    "allowUmdGlobalAccess": false,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    "alwaysStrict": true,
    "assumeChangesOnlyAffectDirectDependencies": false,
    "checkJs": false,
    "disableSizeLimit": false,
    "generateCpuProfile": "profile.cpuprofile",
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "keyofStringsOnly": false,
    "maxNodeModuleJsDepth": 0,
    "noFallthroughCasesInSwitch": false,
    "noImplicitOverride": false,
    "noImplicitReturns": false,
    "noStrictGenericChecks": false,
    "noUncheckedIndexedAccess": false,
    "preserveConstEnums": false,
    "removeComments": false,
    "resolveJsonModule": true,
    "skipDefaultLibCheck": false,
    "skipLibCheck": true,
    "strict": true,
    "strictBindCallApply": true,
    "strictFunctionTypes": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,
    "suppressExcessPropertyErrors": false,
    "suppressImplicitAnyIndexErrors": false,
    "useDefineForClassFields": true
  },
  "lint": {
    "rules": {
      "tags": ["recommended"],
      "include": ["ban-untagged-todo"],
      "exclude": ["no-unused-vars"]
    }
  },
  "fmt": {
    "useTabs": false,
    "lineWidth": 100,
    "indentWidth": 2,
    "semiColons": true,
    "singleQuote": false,
    "proseWrap": "preserve"
  }
}
EOF
}

# =============================================================================
# MAIN SETUP FUNCTIONS
# =============================================================================

write_config_file() {
    local file_path="$1"
    local content="$2"
    local description="$3"
    
    log_info "Creating $description..."
    echo "$content" > "$file_path"
    FILES_CREATED+=("$file_path")
}

setup_config_files() {
    log_info "Generating configuration files..."
    
    # Main configuration files
    write_config_file "$CONFIG_PATH/init.lua" "$(generate_init_lua)" "main init.lua"
    write_config_file "$CONFIG_PATH/lua/config/options.lua" "$(generate_options_lua)" "options configuration"
    write_config_file "$CONFIG_PATH/lua/config/lazy.lua" "$(generate_lazy_lua)" "lazy.nvim configuration"
    write_config_file "$CONFIG_PATH/lua/config/keymaps.lua" "$(generate_keymaps_lua)" "keymaps configuration"
    
    # Plugin configuration files
    write_config_file "$CONFIG_PATH/lua/plugins/lsp.lua" "$(generate_lsp_lua "$SETUP_DENO")" "LSP configuration"
    write_config_file "$CONFIG_PATH/lua/plugins/completion.lua" "$(generate_completion_lua)" "completion configuration"
    
    if [[ "$MINIMAL" != "true" ]]; then
        write_config_file "$CONFIG_PATH/lua/plugins/treesitter.lua" "$(generate_treesitter_lua)" "treesitter configuration"
        write_config_file "$CONFIG_PATH/lua/plugins/telescope.lua" "$(generate_telescope_lua)" "telescope configuration"
    fi
    
    write_config_file "$CONFIG_PATH/lua/plugins/ui.lua" "$(generate_ui_lua "$THEME" "$MINIMAL")" "UI configuration"
    
    log_success "Configuration files created"
}

setup_sample_deno_config() {
    if [[ "$SETUP_DENO" == "true" ]] && [[ ! -f "deno.json" ]]; then
        log_info "Creating sample deno.json..."
        write_config_file "deno.json" "$(generate_sample_deno_config)" "sample Deno configuration"
    elif [[ -f "deno.json" ]]; then
        log_warning "deno.json already exists, skipping creation"
    fi
}

# =============================================================================
# ARGUMENT PARSING
# =============================================================================

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --config-path)
                CONFIG_PATH="$2"
                shift 2
                ;;
            --no-backup)
                BACKUP_EXISTING=false
                shift
                ;;
            --no-deno)
                SETUP_DENO=false
                shift
                ;;
            --theme)
                case "$2" in
                    tokyonight|catppuccin|gruvbox)
                        THEME="$2"
                        ;;
                    *)
                        log_error "Invalid theme: $2. Valid options: tokyonight, catppuccin, gruvbox"
                        exit 1
                        ;;
                esac
                shift 2
                ;;
            --minimal)
                MINIMAL=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

show_banner() {
    echo -e "${CYAN}🚀 DenoGenesis Neovim Setup${NC}"
    echo -e "${CYAN}════════════════════════════${NC}"
    echo -e "${BLUE}📁 Config path: ${CONFIG_PATH}${NC}"
    echo -e "${BLUE}🎨 Theme: ${THEME}${NC}"
    echo -e "${BLUE}🦕 Deno setup: $([ "$SETUP_DENO" == "true" ] && echo "enabled" || echo "disabled")${NC}"
    echo -e "${BLUE}💾 Backup existing: $([ "$BACKUP_EXISTING" == "true" ] && echo "enabled" || echo "disabled")${NC}"
    echo -e "${BLUE}⚡ Minimal install: $([ "$MINIMAL" == "true" ] && echo "enabled" || echo "disabled")${NC}"
    echo ""
}

show_completion_summary() {
    if [[ ${#ERRORS[@]} -eq 0 ]]; then
        log_success "Setup completed successfully!"
        
        if [[ ${#FILES_CREATED[@]} -gt 0 ]]; then
            log_info "Files created: ${#FILES_CREATED[@]}"
            for file in "${FILES_CREATED[@]}"; do
                echo -e "${GREEN}   📄 $file${NC}"
            done
        fi
        
        if [[ ${#WARNINGS[@]} -gt 0 ]]; then
            echo ""
            log_warning "Warnings encountered:"
            for warning in "${WARNINGS[@]}"; do
                echo -e "${YELLOW}   ⚠️  $warning${NC}"
            done
        fi
        
        cat << EOF

${GREEN}🎉 Setup Complete! Next steps:${NC}

${PURPLE}1. Open Neovim:${NC} nvim
${PURPLE}2. Let plugins install automatically (or run :Lazy sync)${NC}
${PURPLE}3. Open a TypeScript file in a Deno project${NC}
${PURPLE}4. Use <Space> to see available keymaps${NC}

${PURPLE}Key shortcuts:${NC}
${CYAN}- <Space>ff:${NC} Find files
${CYAN}- <Space>fg:${NC} Search text
${CYAN}- <Space>e:${NC}  Toggle file explorer
${CYAN}- <Space>dr:${NC} Run Deno file
${CYAN}- <Space>dt:${NC} Run Deno tests

${GREEN}Happy coding with Deno Genesis! 🦕${NC}

EOF
        exit 0
    else
        log_error "Setup failed!"
        echo ""
        log_error "Errors encountered:"
        for error in "${ERRORS[@]}"; do
            echo -e "${RED}   ❌ $error${NC}" >&2
        done
        exit 1
    fi
}

main() {
    # Parse command line arguments
    parse_arguments "$@"
    
    # Show setup banner
    show_banner
    
    # Check prerequisites
    if ! check_prerequisites; then
        exit 1
    fi
    
    # Backup existing configuration if requested and exists
    local backup_path=""
    if [[ "$BACKUP_EXISTING" == "true" ]]; then
        backup_path=$(backup_existing_config)
    fi
    
    # Create directory structure
    create_directory_structure
    
    # Generate and write configuration files
    setup_config_files
    
    # Create sample deno.json if needed
    setup_sample_deno_config
    
    # Show completion summary
    show_completion_summary
}

# Only run main if script is executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
 