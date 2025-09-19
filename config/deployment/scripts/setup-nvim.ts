#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write --allow-env

/**
 * Comprehensive Neovim Setup Script for Deno Genesis TypeScript Development
 * 
 * Make executable and run:
 *   chmod +x setup-neovim.ts && ./setup-neovim.ts
 * 
 * Alternative usage:
 *   ./setup-neovim.ts --minimal
 *   ./setup-neovim.ts --backup-only
 *   ./setup-neovim.ts --verbose
 * 
 * Features:
 * - Automatic prerequisite checking and installation
 * - Backup of existing configurations
 * - Modern lazy.nvim-based plugin management
 * - Deno LSP configuration with TypeScript conflict resolution
 * - Database-aware completion for multi-tenant development
 * - Platform-specific optimizations
 * - Performance-optimized plugin configuration
 * 
 * Usage:
 *   deno run --allow-run --allow-read --allow-write --allow-env setup-neovim.ts
 *   deno run --allow-run --allow-read --allow-write --allow-env setup-neovim.ts --minimal
 *   deno run --allow-run --allow-read --allow-write --allow-env setup-neovim.ts --backup-only
 */

import { parseArgs } from "https://deno.land/std@0.224.0/cli/parse_args.ts";
import { exists } from "https://deno.land/std@0.224.0/fs/exists.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";

// Configuration interfaces for type safety
interface SetupOptions {
  minimal: boolean;
  backupOnly: boolean;
  skipPlugins: boolean;
  verbose: boolean;
  configPath?: string;
}

interface PlatformInfo {
  os: string;
  packageManager: string;
  clipboardCmd: string;
  nvimConfigPath: string;
  nvimDataPath: string;
  nvimStatePath: string;
}

interface PrerequisiteCheck {
  name: string;
  command: string;
  required: boolean;
  installHint: string;
}

// Color codes for enhanced output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Logging utilities
function log(message: string, color = colors.reset): void {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message: string): void {
  const border = '='.repeat(message.length + 4);
  log(`\n${border}`, colors.cyan);
  log(`  ${message}  `, colors.cyan);
  log(`${border}`, colors.cyan);
}

function logSuccess(message: string): void {
  log(`✅ ${message}`, colors.green);
}

function logWarning(message: string): void {
  log(`⚠️  ${message}`, colors.yellow);
}

function logError(message: string): void {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message: string): void {
  log(`ℹ️  ${message}`, colors.blue);
}

// Platform detection and configuration
async function detectPlatform(): Promise<PlatformInfo> {
  const os = Deno.build.os;
  const homeDir = Deno.env.get("HOME") || "/tmp";
  const xdgConfigHome = Deno.env.get("XDG_CONFIG_HOME") || `${homeDir}/.config`;
  const xdgDataHome = Deno.env.get("XDG_DATA_HOME") || `${homeDir}/.local/share`;
  const xdgStateHome = Deno.env.get("XDG_STATE_HOME") || `${homeDir}/.local/state`;

  let packageManager = "unknown";
  let clipboardCmd = "";

  switch (os) {
    case "linux":
      // Detect Linux package manager
      if (await commandExists("apt")) packageManager = "apt";
      else if (await commandExists("dnf")) packageManager = "dnf";
      else if (await commandExists("yum")) packageManager = "yum";
      else if (await commandExists("pacman")) packageManager = "pacman";
      else if (await commandExists("zypper")) packageManager = "zypper";
      
      // Detect clipboard utility
      if (await commandExists("xclip")) clipboardCmd = "xclip";
      else if (await commandExists("xsel")) clipboardCmd = "xsel";
      else if (await commandExists("wl-copy")) clipboardCmd = "wl-copy";
      break;
      
    case "darwin":
      packageManager = "brew";
      clipboardCmd = "pbcopy";
      break;
      
    default:
      logWarning(`Unsupported OS: ${os}. Proceeding with generic configuration.`);
  }

  return {
    os,
    packageManager,
    clipboardCmd,
    nvimConfigPath: `${xdgConfigHome}/nvim`,
    nvimDataPath: `${xdgDataHome}/nvim`,
    nvimStatePath: `${xdgStateHome}/nvim`,
  };
}

// Utility function to check if command exists
async function commandExists(command: string): Promise<boolean> {
  try {
    const result = await new Deno.Command("which", {
      args: [command],
      stdout: "null",
      stderr: "null",
    }).output();
    return result.success;
  } catch {
    return false;
  }
}

// Run shell command with error handling
async function runCommand(cmd: string[], options: { cwd?: string; stdout?: "inherit" | "null" } = {}): Promise<boolean> {
  try {
    const command = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
      stdout: options.stdout || "inherit",
      stderr: "inherit",
      cwd: options.cwd,
    });
    
    const result = await command.output();
    return result.success;
  } catch (error) {
    logError(`Failed to run command: ${cmd.join(" ")} - ${error.message}`);
    return false;
  }
}

// Prerequisites checking
async function checkPrerequisites(platform: PlatformInfo): Promise<boolean> {
  logHeader("Checking Prerequisites");
  
  const prerequisites: PrerequisiteCheck[] = [
    {
      name: "Neovim",
      command: "nvim",
      required: true,
      installHint: `Install with: ${getInstallCommand(platform, ["neovim"])}`,
    },
    {
      name: "Git",
      command: "git",
      required: true,
      installHint: `Install with: ${getInstallCommand(platform, ["git"])}`,
    },
    {
      name: "Deno",
      command: "deno",
      required: true,
      installHint: "Install with: curl -fsSL https://deno.land/install.sh | sh",
    },
    {
      name: "Curl",
      command: "curl",
      required: true,
      installHint: `Install with: ${getInstallCommand(platform, ["curl"])}`,
    },
    {
      name: "Unzip",
      command: "unzip",
      required: true,
      installHint: `Install with: ${getInstallCommand(platform, ["unzip"])}`,
    },
    {
      name: "Ripgrep",
      command: "rg",
      required: false,
      installHint: `Install with: ${getInstallCommand(platform, ["ripgrep"])}`,
    },
    {
      name: "fd",
      command: "fd",
      required: false,
      installHint: `Install with: ${getInstallCommand(platform, ["fd-find", "fd"])}`,
    },
  ];

  let allRequired = true;
  
  for (const prereq of prerequisites) {
    const exists = await commandExists(prereq.command);
    
    if (exists) {
      logSuccess(`${prereq.name} found`);
    } else if (prereq.required) {
      logError(`${prereq.name} not found (required)`);
      logInfo(prereq.installHint);
      allRequired = false;
    } else {
      logWarning(`${prereq.name} not found (optional)`);
      logInfo(prereq.installHint);
    }
  }

  // Check Neovim version if it exists
  if (await commandExists("nvim")) {
    const versionCheck = await checkNeovimVersion();
    if (!versionCheck) {
      allRequired = false;
    }
  }

  // Check Deno version if it exists
  if (await commandExists("deno")) {
    await checkDenoVersion();
  }

  return allRequired;
}

function getInstallCommand(platform: PlatformInfo, packages: string[]): string {
  const pkgName = packages[0]; // Use first package name for simplicity
  
  switch (platform.packageManager) {
    case "apt":
      return `sudo apt install ${pkgName}`;
    case "dnf":
      return `sudo dnf install ${pkgName}`;
    case "yum":
      return `sudo yum install ${pkgName}`;
    case "pacman":
      return `sudo pacman -S ${pkgName}`;
    case "zypper":
      return `sudo zypper install ${pkgName}`;
    case "brew":
      return `brew install ${pkgName}`;
    default:
      return `Package manager not detected. Please install ${pkgName} manually.`;
  }
}

async function checkNeovimVersion(): Promise<boolean> {
  try {
    const result = await new Deno.Command("nvim", {
      args: ["--version"],
      stdout: "piped",
      stderr: "piped",
    }).output();
    
    if (result.success) {
      const output = new TextDecoder().decode(result.stdout);
      const versionMatch = output.match(/NVIM v(\d+)\.(\d+)/);
      
      if (versionMatch) {
        const major = parseInt(versionMatch[1]);
        const minor = parseInt(versionMatch[2]);
        
        if (major > 0 || (major === 0 && minor >= 8)) {
          logSuccess(`Neovim version ${major}.${minor} is compatible`);
          return true;
        } else {
          logError(`Neovim version ${major}.${minor} is too old. Requires >= 0.8`);
          return false;
        }
      }
    }
  } catch {
    // Fall through to error
  }
  
  logError("Could not determine Neovim version");
  return false;
}

async function checkDenoVersion(): Promise<void> {
  try {
    const result = await new Deno.Command("deno", {
      args: ["--version"],
      stdout: "piped",
      stderr: "piped",
    }).output();
    
    if (result.success) {
      const output = new TextDecoder().decode(result.stdout);
      const versionMatch = output.match(/deno (\d+\.\d+\.\d+)/);
      
      if (versionMatch) {
        logSuccess(`Deno version ${versionMatch[1]} detected`);
      }
    }
  } catch {
    logWarning("Could not determine Deno version");
  }
}

// Backup existing configuration
async function backupExistingConfig(platform: PlatformInfo): Promise<boolean> {
  logHeader("Backing Up Existing Configuration");
  
  const configExists = await exists(platform.nvimConfigPath);
  const dataExists = await exists(platform.nvimDataPath);
  const stateExists = await exists(platform.nvimStatePath);
  
  if (!configExists && !dataExists && !stateExists) {
    logInfo("No existing Neovim configuration found. Proceeding with fresh installation.");
    return true;
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  
  try {
    if (configExists) {
      const backupPath = `${platform.nvimConfigPath}.backup.${timestamp}`;
      await runCommand(["mv", platform.nvimConfigPath, backupPath]);
      logSuccess(`Configuration backed up to: ${backupPath}`);
    }
    
    if (dataExists) {
      await runCommand(["rm", "-rf", platform.nvimDataPath]);
      logInfo("Removed existing data directory for fresh plugin installation");
    }
    
    if (stateExists) {
      await runCommand(["rm", "-rf", platform.nvimStatePath]);
      logInfo("Removed existing state directory");
    }
    
    return true;
  } catch (error) {
    logError(`Failed to backup configuration: ${error.message}`);
    return false;
  }
}

// Create directory structure and configuration files
async function createConfiguration(platform: PlatformInfo, options: SetupOptions): Promise<boolean> {
  logHeader("Creating Neovim Configuration");
  
  try {
    // Create directory structure
    await ensureDir(`${platform.nvimConfigPath}/lua/config`);
    await ensureDir(`${platform.nvimConfigPath}/lua/plugins`);
    
    // Create init.lua
    await createInitLua(platform.nvimConfigPath);
    
    // Create core configuration files
    await createOptionsLua(platform.nvimConfigPath);
    await createKeymapsLua(platform.nvimConfigPath);
    await createAutocommandsLua(platform.nvimConfigPath);
    
    // Create plugin configurations
    if (!options.skipPlugins) {
      await createPluginConfigs(platform.nvimConfigPath, options.minimal);
    }
    
    // Create Deno-specific configurations
    await createDenoConfig(platform.nvimConfigPath);
    
    logSuccess("Configuration files created successfully");
    return true;
  } catch (error) {
    logError(`Failed to create configuration: ${error.message}`);
    return false;
  }
}

async function createInitLua(configPath: string): Promise<void> {
  const content = `-- Neovim Configuration for Deno Genesis TypeScript Development
-- Auto-generated by setup-neovim.ts

vim.g.mapleader = " "
vim.g.maplocalleader = "\\\\"

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
require("config.autocommands")

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
`;

  await Deno.writeTextFile(`${configPath}/init.lua`, content);
}

async function createOptionsLua(configPath: string): Promise<void> {
  const content = `-- Neovim options optimized for Deno TypeScript development

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
opt.inccommand = "nosplit"
opt.laststatus = 3
opt.list = true
opt.mouse = "a"
opt.number = true
opt.pumblend = 10
opt.pumheight = 10
opt.relativenumber = true
opt.scrolloff = 4
opt.sessionoptions = { "buffers", "curdir", "tabpages", "winsize", "help", "globals", "skiprtp", "folds" }
opt.shiftround = true
opt.shiftwidth = 2
opt.shortmess:append({ W = true, I = true, c = true, C = true })
opt.showmode = false
opt.sidescrolloff = 8
opt.signcolumn = "yes"
opt.smartcase = true
opt.smartindent = true
opt.spelllang = { "en" }
opt.splitbelow = true
opt.splitkeep = "screen"
opt.splitright = true
opt.tabstop = 2
opt.termguicolors = true
opt.undofile = true
opt.undolevels = 10000
opt.wildmode = "longest:full,full"
opt.winminwidth = 5
opt.wrap = false

-- Folding
opt.foldcolumn = "1"
opt.foldlevel = 99
opt.foldlevelstart = 99
opt.foldenable = true

-- TypeScript/Deno specific
opt.iskeyword:append("-")
opt.iskeyword:append("@-@")

-- Search
opt.hlsearch = true
opt.incsearch = true

-- UI
opt.fillchars = {
  foldopen = "",
  foldclose = "",
  fold = " ",
  foldsep = " ",
  diff = "╱",
  eob = " ",
}

if vim.fn.has("nvim-0.10") == 1 then
  opt.smoothscroll = true
end
`;

  await Deno.writeTextFile(`${configPath}/lua/config/options.lua`, content);
}

async function createKeymapsLua(configPath: string): Promise<void> {
  const content = `-- Key mappings optimized for Deno TypeScript development

local function map(mode, lhs, rhs, opts)
  local keys = require("lazy.core.handler").handlers.keys
  ---@cast keys LazyKeysHandler
  -- do not create the keymap if a lazy keys handler exists
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
map("n", "<A-j>", "<cmd>m .+1<cr>==", { desc = "Move line down" })
map("n", "<A-k>", "<cmd>m .-2<cr>==", { desc = "Move line up" })
map("i", "<A-j>", "<esc><cmd>m .+1<cr>==gi", { desc = "Move line down" })
map("i", "<A-k>", "<esc><cmd>m .-2<cr>==gi", { desc = "Move line up" })
map("v", "<A-j>", ":m '>+1<cr>gv=gv", { desc = "Move line down" })
map("v", "<A-k>", ":m '<-2<cr>gv=gv", { desc = "Move line up" })

-- Buffers
map("n", "<S-h>", "<cmd>bprevious<cr>", { desc = "Prev buffer" })
map("n", "<S-l>", "<cmd>bnext<cr>", { desc = "Next buffer" })
map("n", "[b", "<cmd>bprevious<cr>", { desc = "Prev buffer" })
map("n", "]b", "<cmd>bnext<cr>", { desc = "Next buffer" })
map("n", "<leader>bb", "<cmd>e #<cr>", { desc = "Switch to Other Buffer" })
map("n", "<leader>bd", "<cmd>bdelete<cr>", { desc = "Delete Buffer" })
map("n", "<leader>bD", "<cmd>bdelete!<cr>", { desc = "Delete Buffer (Force)" })

-- Clear search with <esc>
map({ "i", "n" }, "<esc>", "<cmd>noh<cr><esc>", { desc = "Escape and clear hlsearch" })

-- Better indenting
map("v", "<", "<gv")
map("v", ">", ">gv")

-- Lazy
map("n", "<leader>l", "<cmd>Lazy<cr>", { desc = "Lazy" })

-- New file
map("n", "<leader>fn", "<cmd>enew<cr>", { desc = "New File" })

-- Quit
map("n", "<leader>qq", "<cmd>qa<cr>", { desc = "Quit all" })

-- Save file
map({ "i", "x", "n", "s" }, "<C-s>", "<cmd>w<cr><esc>", { desc = "Save file" })

-- Deno specific mappings
map("n", "<leader>dr", "<cmd>!deno run %<cr>", { desc = "Run Deno file" })
map("n", "<leader>dt", "<cmd>!deno test<cr>", { desc = "Run Deno tests" })
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

-- tabs
map("n", "<leader><tab>l", "<cmd>tablast<cr>", { desc = "Last Tab" })
map("n", "<leader><tab>f", "<cmd>tabfirst<cr>", { desc = "First Tab" })
map("n", "<leader><tab><tab>", "<cmd>tabnew<cr>", { desc = "New Tab" })
map("n", "<leader><tab>]", "<cmd>tabnext<cr>", { desc = "Next Tab" })
map("n", "<leader><tab>d", "<cmd>tabclose<cr>", { desc = "Close Tab" })
map("n", "<leader><tab>[", "<cmd>tabprevious<cr>", { desc = "Previous Tab" })
`;

  await Deno.writeTextFile(`${configPath}/lua/config/keymaps.lua`, content);
}

async function createAutocommandsLua(configPath: string): Promise<void> {
  const content = `-- Auto commands for enhanced Deno TypeScript development

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

-- Deno specific auto commands
vim.api.nvim_create_autocmd("FileType", {
  group = augroup("deno_settings"),
  pattern = { "typescript", "typescriptreact", "javascript", "javascriptreact" },
  callback = function()
    -- Check if this is a Deno project
    local root_dir = vim.fn.getcwd()
    local deno_files = { "deno.json", "deno.jsonc", "deno.lock" }
    
    for _, file in ipairs(deno_files) do
      if vim.fn.filereadable(root_dir .. "/" .. file) == 1 then
        -- Set Deno-specific options
        vim.bo.shiftwidth = 2
        vim.bo.tabstop = 2
        vim.bo.expandtab = true
        
        -- Set up Deno-specific keymaps for this buffer
        local opts = { buffer = true, silent = true }
        vim.keymap.set('n', '<leader>dr', '<cmd>!deno run %<cr>', opts)
        vim.keymap.set('n', '<leader>dt', '<cmd>!deno test<cr>', opts)
        vim.keymap.set('n', '<leader>df', '<cmd>!deno fmt %<cr>', opts)
        vim.keymap.set('n', '<leader>dl', '<cmd>!deno lint %<cr>', opts)
        vim.keymap.set('n', '<leader>dc', '<cmd>!deno check %<cr>', opts)
        
        break
      end
    end
  end,
})

-- Highlight on yank
vim.api.nvim_create_autocmd("TextYankPost", {
  group = augroup("highlight_yank"),
  callback = function()
    vim.highlight.on_yank()
  end,
})

-- Auto format on save for Deno files
vim.api.nvim_create_autocmd("BufWritePre", {
  group = augroup("deno_format"),
  pattern = { "*.ts", "*.tsx", "*.js", "*.jsx" },
  callback = function()
    -- Check if this is a Deno project
    local root_dir = vim.fn.getcwd()
    local deno_files = { "deno.json", "deno.jsonc", "deno.lock" }
    
    for _, file in ipairs(deno_files) do
      if vim.fn.filereadable(root_dir .. "/" .. file) == 1 then
        -- Format with Deno if available
        if vim.fn.executable('deno') == 1 then
          vim.cmd('silent !deno fmt ' .. vim.fn.expand('%'))
        end
        break
      end
    end
  end,
})
`;

  await Deno.writeTextFile(`${configPath}/lua/config/autocommands.lua`, content);
}

async function createPluginConfigs(configPath: string, minimal: boolean): Promise<void> {
  // Create UI plugins
  await createUIPlugins(configPath);
  
  // Create LSP configuration
  await createLSPConfig(configPath);
  
  // Create completion configuration
  await createCompletionConfig(configPath);
  
  // Create treesitter configuration
  await createTreesitterConfig(configPath);
  
  // Create telescope configuration
  await createTelescopeConfig(configPath);
  
  // Create file explorer configuration
  await createFileExplorerConfig(configPath);
  
  if (!minimal) {
    // Create additional productivity plugins
    await createProductivityPlugins(configPath);
    
    // Create git integration
    await createGitPlugins(configPath);
    
    // Create debugging plugins
    await createDebuggingPlugins(configPath);
  }
}

async function createUIPlugins(configPath: string): Promise<void> {
  const content = `-- UI plugins for enhanced visual experience

return {
  -- Color scheme
  {
    "folke/tokyonight.nvim",
    priority = 1000,
    config = function()
      require("tokyonight").setup({
        style = "night",
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
        sidebars = { "qf", "help" },
        day_brightness = 0.3,
        hide_inactive_statusline = false,
        dim_inactive = false,
        lualine_bold = false,
        on_colors = function(colors) end,
        on_highlights = function(highlights, colors) end,
      })
      vim.cmd([[colorscheme tokyonight]])
    end,
  },

  -- Status line
  {
    "nvim-lualine/lualine.nvim",
    dependencies = { "nvim-tree/nvim-web-devicons" },
    event = "VeryLazy",
    init = function()
      vim.g.lualine_laststatus = vim.o.laststatus
      if vim.fn.argc(-1) > 0 then
        vim.o.statusline = " "
      else
        vim.o.laststatus = 0
      end
    end,
    opts = function()
      local lualine_require = require("lualine_require")
      lualine_require.require = require

      local icons = {
        diagnostics = {
          Error = " ",
          Warn = " ",
          Hint = " ",
          Info = " ",
        },
        git = {
          added = " ",
          modified = " ",
          removed = " ",
        },
      }

      vim.o.laststatus = vim.g.lualine_laststatus

      return {
        options = {
          theme = "tokyonight",
          globalstatus = true,
          disabled_filetypes = { statusline = { "dashboard", "alpha", "starter" } },
        },
        sections = {
          lualine_a = { "mode" },
          lualine_b = { "branch" },
          lualine_c = {
            {
              "diagnostics",
              symbols = {
                error = icons.diagnostics.Error,
                warn = icons.diagnostics.Warn,
                info = icons.diagnostics.Info,
                hint = icons.diagnostics.Hint,
              },
            },
            { "filetype", icon_only = true, separator = "", padding = { left = 1, right = 0 } },
            { "filename", path = 1, symbols = { modified = "  ", readonly = "", unnamed = "" } },
          },
          lualine_x = {
            {
              function()
                return require("noice").api.status.command.get()
              end,
              cond = function()
                return package.loaded["noice"] and require("noice").api.status.command.has()
              end,
              color = { fg = "#ff9e64" },
            },
            {
              function()
                return require("noice").api.status.mode.get()
              end,
              cond = function()
                return package.loaded["noice"] and require("noice").api.status.mode.has()
              end,
              color = { fg = "#ff9e64" },
            },
            {
              function()
                return "  " .. require("dap").status()
              end,
              cond = function ()
                return package.loaded["dap"] and require("dap").status() ~= ""
              end,
              color = { fg = "#ff9e64" },
            },
            { "diff", symbols = icons.git },
            "encoding",
            "fileformat",
          },
          lualine_y = {
            { "progress", separator = " ", padding = { left = 1, right = 0 } },
            { "location", padding = { left = 0, right = 1 } },
          },
          lualine_z = {
            function()
              return " " .. os.date("%R")
            end,
          },
        },
        extensions = { "neo-tree", "lazy" },
      }
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
    opts = {},
  },

  -- Bufferline
  {
    "akinsho/bufferline.nvim",
    version = "*",
    dependencies = "nvim-tree/nvim-web-devicons",
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
          local icons = {
            Error = " ",
            Warn = " ",
            Hint = " ",
            Info = " ",
          }
          local ret = (diag.error and icons.Error .. diag.error .. " " or "")
            .. (diag.warning and icons.Warn .. diag.warning or "")
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
      vim.api.nvim_create_autocmd("BufAdd", {
        callback = function()
          vim.schedule(function()
            pcall(nvim_bufferline)
          end)
        end,
      })
    end,
  },

  -- Indent guides
  {
    "lukas-reineke/indent-blankline.nvim",
    main = "ibl",
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
  },

  -- Active indent guide and indent text objects
  {
    "echasnovski/mini.indentscope",
    version = false,
    event = { "BufReadPre", "BufNewFile" },
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

  -- Icons
  { "nvim-tree/nvim-web-devicons", lazy = true },

  -- Noice for enhanced UI
  {
    "folke/noice.nvim",
    event = "VeryLazy",
    opts = {
      lsp = {
        override = {
          ["vim.lsp.util.convert_input_to_markdown_lines"] = true,
          ["vim.lsp.util.stylize_markdown"] = true,
          ["cmp.entry.get_documentation"] = true,
        },
      },
      routes = {
        {
          filter = {
            event = "msg_show",
            any = {
              { find = "%d+L, %d+B" },
              { find = "; after #%d+" },
              { find = "; before #%d+" },
            },
          },
          view = "mini",
        },
      },
      presets = {
        bottom_search = true,
        command_palette = true,
        long_message_to_split = true,
        inc_rename = true,
        lsp_doc_border = false,
      },
    },
    dependencies = {
      "MunifTanjim/nui.nvim",
      "rcarriga/nvim-notify",
    },
  },

  -- Notifications
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
  },
}
`;

  await Deno.writeTextFile(`${configPath}/lua/plugins/ui.lua`, content);
}

async function createLSPConfig(configPath: string): Promise<void> {
  const content = `-- LSP configuration with Deno and TypeScript conflict resolution

return {
  {
    "neovim/nvim-lspconfig",
    event = { "BufReadPre", "BufNewFile" },
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
            return util.root_pattern("deno.json", "deno.jsonc", "deno.lock")(fname)
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
                  ["https://esm.sh"] = true,
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
                referencesAllFunctions = true,
              },
              suggest = {
                autoImports = true,
                completeFunctionCalls = false,
                names = true,
                paths = true,
                imports = {
                  hosts = {
                    ["https://deno.land"] = true,
                    ["https://cdn.nest.land"] = true,
                    ["https://crux.land"] = true,
                    ["https://esm.sh"] = true,
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
            },
          },
        },
        ts_ls = {
          root_dir = function(fname)
            local util = require("lspconfig.util")
            local function is_deno_project(path)
              return util.root_pattern("deno.json", "deno.jsonc", "deno.lock")(path)
            end
            
            local function is_node_project(path)
              return util.root_pattern("package.json")(path)
            end
            
            local deno_root = is_deno_project(fname)
            if deno_root then
              return nil -- Don't attach ts_ls to Deno projects
            end
            
            return is_node_project(fname)
          end,
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
        },
        eslint = {
          settings = {
            workingDirectories = { mode = "auto" },
          },
        },
        lua_ls = {
          settings = {
            Lua = {
              workspace = {
                checkThirdParty = false,
              },
              codeLens = {
                enable = true,
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

      -- Get all the servers that are available through mason-lspconfig
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
      vim.diagnostic.config(opts.diagnostics)

      -- Setup key mappings
      vim.api.nvim_create_autocmd("LspAttach", {
        callback = function(args)
          local buffer = args.buf
          local client = vim.lsp.get_client_by_id(args.data.client_id)
          local function map(...)
            vim.keymap.set(..., { buffer = buffer })
          end

          -- LSP keymaps
          map("n", "gd", vim.lsp.buf.definition, { desc = "Goto Definition" })
          map("n", "gr", vim.lsp.buf.references, { desc = "References" })
          map("n", "gD", vim.lsp.buf.declaration, { desc = "Goto Declaration" })
          map("n", "gI", vim.lsp.buf.implementation, { desc = "Goto Implementation" })
          map("n", "gy", vim.lsp.buf.type_definition, { desc = "Goto T[y]pe Definition" })
          map("n", "K", vim.lsp.buf.hover, { desc = "Hover" })
          map("n", "gK", vim.lsp.buf.signature_help, { desc = "Signature Help" })
          map("i", "<c-k>", vim.lsp.buf.signature_help, { desc = "Signature Help" })
          map("n", "<leader>ca", vim.lsp.buf.code_action, { desc = "Code Action" })
          map("n", "<leader>cc", vim.lsp.codelens.run, { desc = "Run Codelens" })
          map("n", "<leader>cC", vim.lsp.codelens.refresh, { desc = "Refresh & Display Codelens" })
          map("n", "<leader>cr", vim.lsp.buf.rename, { desc = "Rename" })

          -- Deno specific keymaps
          if client and client.name == "denols" then
            map("n", "<leader>dr", vim.lsp.codelens.run, { desc = "Run Deno" })
            map("n", "<leader>dt", "<cmd>!deno task<cr>", { desc = "Deno Task" })
            map("n", "<leader>df", "<cmd>!deno fmt %<cr>", { desc = "Deno Format" })
            map("n", "<leader>dl", "<cmd>!deno lint %<cr>", { desc = "Deno Lint" })
            map("n", "<leader>dc", "<cmd>!deno check %<cr>", { desc = "Deno Check" })
            map("n", "<leader>di", "<cmd>!deno info %<cr>", { desc = "Deno Info" })
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
`;

  await Deno.writeTextFile(`${configPath}/lua/plugins/lsp.lua`, content);
}

async function createCompletionConfig(configPath: string): Promise<void> {
  const content = `-- Autocompletion configuration optimized for Deno TypeScript development

return {
  {
    "hrsh7th/nvim-cmp",
    version = false,
    event = "InsertEnter",
    dependencies = {
      "hrsh7th/cmp-nvim-lsp",
      "hrsh7th/cmp-buffer",
      "hrsh7th/cmp-path",
      "hrsh7th/cmp-cmdline",
      "saadparwaiz1/cmp_luasnip",
      "L3MON4D3/LuaSnip",
      "rafamadriz/friendly-snippets",
    },
    opts = function()
      vim.api.nvim_set_hl(0, "CmpGhostText", { link = "Comment", default = true })
      local cmp = require("cmp")
      local defaults = require("cmp.config.default")()
      return {
        completion = {
          completeopt = "menu,menuone,noinsert",
        },
        snippet = {
          expand = function(args)
            require("luasnip").lsp_expand(args.body)
          end,
        },
        mapping = cmp.mapping.preset.insert({
          ["<C-n>"] = cmp.mapping.select_next_item({ behavior = cmp.SelectBehavior.Insert }),
          ["<C-p>"] = cmp.mapping.select_prev_item({ behavior = cmp.SelectBehavior.Insert }),
          ["<C-b>"] = cmp.mapping.scroll_docs(-4),
          ["<C-f>"] = cmp.mapping.scroll_docs(4),
          ["<C-Space>"] = cmp.mapping.complete(),
          ["<C-e>"] = cmp.mapping.abort(),
          ["<CR>"] = cmp.mapping.confirm({ select = true }), -- Accept currently selected item. Set 'select' to false to only confirm explicitly selected items.
          ["<S-CR>"] = cmp.mapping.confirm({
            behavior = cmp.ConfirmBehavior.Replace,
            select = true,
          }), -- Accept currently selected item. Set 'select' to false to only confirm explicitly selected items.
          ["<C-CR>"] = function(fallback)
            cmp.abort()
            fallback()
          end,
        }),
        sources = cmp.config.sources({
          { name = "nvim_lsp", priority = 1000 },
          { name = "luasnip", priority = 750 },
          { name = "buffer", priority = 500 },
          { name = "path", priority = 250 },
        }),
        formatting = {
          format = function(entry, vim_item)
            local icons = {
              Text = "",
              Method = "󰆧",
              Function = "󰊕",
              Constructor = "",
              Field = "󰇽",
              Variable = "󰂡",
              Class = "󰠱",
              Interface = "",
              Module = "",
              Property = "󰜢",
              Unit = "",
              Value = "󰎠",
              Enum = "",
              Keyword = "󰌋",
              Snippet = "",
              Color = "󰏘",
              File = "󰈙",
              Reference = "",
              Folder = "󰉋",
              EnumMember = "",
              Constant = "󰏿",
              Struct = "",
              Event = "",
              Operator = "󰆕",
              TypeParameter = "󰅲",
            }
            
            if icons[vim_item.kind] then
              vim_item.kind = icons[vim_item.kind] .. " " .. vim_item.kind
            end

            -- Show source
            vim_item.menu = ({
              nvim_lsp = "[LSP]",
              luasnip = "[Snippet]",
              buffer = "[Buffer]",
              path = "[Path]",
            })[entry.source.name]

            return vim_item
          end,
        },
        experimental = {
          ghost_text = {
            hl_group = "CmpGhostText",
          },
        },
        sorting = defaults.sorting,
      }
    end,
    config = function(_, opts)
      for _, source in ipairs(opts.sources) do
        source.group_index = source.group_index or 1
      end
      require("cmp").setup(opts)
    end,
  },

  -- Snippets
  {
    "L3MON4D3/LuaSnip",
    build = (function()
      if vim.fn.has("win32") == 1 or vim.fn.executable("make") == 0 then
        return
      end
      return "make install_jsregexp"
    end)(),
    dependencies = {
      {
        "rafamadriz/friendly-snippets",
        config = function()
          require("luasnip.loaders.from_vscode").lazy_load()
          -- Custom Deno snippets
          require("luasnip.loaders.from_vscode").lazy_load({
            paths = { vim.fn.stdpath("config") .. "/snippets" }
          })
        end,
      },
    },
    opts = {
      history = true,
      delete_check_events = "TextChanged",
    },
    keys = {
      {
        "<tab>",
        function()
          return require("luasnip").jumpable(1) and "<Plug>luasnip-jump-next" or "<tab>"
        end,
        expr = true, silent = true, mode = "i",
      },
      { "<tab>", function() require("luasnip").jump(1) end, mode = "s" },
      { "<s-tab>", function() require("luasnip").jump(-1) end, mode = { "i", "s" } },
    },
  },
}
`;

  await Deno.writeTextFile(`${configPath}/lua/plugins/completion.lua`, content);
}

async function createTreesitterConfig(configPath: string): Promise<void> {
  const content = `-- Treesitter configuration for enhanced syntax highlighting

return {
  {
    "nvim-treesitter/nvim-treesitter",
    version = false,
    build = ":TSUpdate",
    event = { "BufReadPost", "BufNewFile" },
    dependencies = {
      "nvim-treesitter/nvim-treesitter-textobjects",
    },
    cmd = { "TSUpdateSync", "TSUpdate", "TSInstall" },
    keys = {
      { "<c-space>", desc = "Increment selection" },
      { "<bs>", desc = "Decrement selection", mode = "x" },
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
        move = {
          enable = true,
          goto_next_start = { ["]f"] = "@function.outer", ["]c"] = "@class.outer" },
          goto_next_end = { ["]F"] = "@function.outer", ["]C"] = "@class.outer" },
          goto_previous_start = { ["[f"] = "@function.outer", ["[c"] = "@class.outer" },
          goto_previous_end = { ["[F"] = "@function.outer", ["[C"] = "@class.outer" },
        },
      },
    },
    config = function(_, opts)
      if type(opts.ensure_installed) == "table" then
        ---@type table<string, boolean>
        local added = {}
        opts.ensure_installed = vim.tbl_filter(function(lang)
          if added[lang] then
            return false
          end
          added[lang] = true
          return true
        end, opts.ensure_installed)
      end
      require("nvim-treesitter.configs").setup(opts)
    end,
  },
}
`;

  await Deno.writeTextFile(`${configPath}/lua/plugins/treesitter.lua`, content);
}

async function createTelescopeConfig(configPath: string): Promise<void> {
  const content = `-- Telescope configuration for fuzzy finding

return {
  {
    "nvim-telescope/telescope.nvim",
    tag = "0.1.4",
    dependencies = {
      "nvim-lua/plenary.nvim",
      {
        "nvim-telescope/telescope-fzf-native.nvim",
        build = "make",
        enabled = vim.fn.executable("make") == 1,
        config = function()
          require("telescope").load_extension("fzf")
        end,
      },
    },
    cmd = "Telescope",
    keys = {
      {
        "<leader>,",
        "<cmd>Telescope buffers sort_mru=true sort_lastused=true<cr>",
        desc = "Switch Buffer",
      },
      { "<leader>/", "<cmd>Telescope live_grep<cr>", desc = "Grep (root dir)" },
      { "<leader>:", "<cmd>Telescope command_history<cr>", desc = "Command History" },
      { "<leader><space>", "<cmd>Telescope find_files<cr>", desc = "Find Files (root dir)" },
      -- find
      { "<leader>fb", "<cmd>Telescope buffers sort_mru=true sort_lastused=true<cr>", desc = "Buffers" },
      { "<leader>fc", "<cmd>Telescope find_files cwd=~/.config/nvim<cr>", desc = "Find Config File" },
      { "<leader>ff", "<cmd>Telescope find_files<cr>", desc = "Find Files (root dir)" },
      { "<leader>fF", "<cmd>Telescope find_files hidden=true no_ignore=true<cr>", desc = "Find Files (all)" },
      { "<leader>fg", "<cmd>Telescope live_grep<cr>", desc = "Grep (root dir)" },
      { "<leader>fG", "<cmd>Telescope live_grep cwd=false<cr>", desc = "Grep (cwd)" },
      { "<leader>fr", "<cmd>Telescope oldfiles<cr>", desc = "Recent" },
      { "<leader>fR", "<cmd>Telescope oldfiles cwd_only=true<cr>", desc = "Recent (cwd)" },
      -- git
      { "<leader>gc", "<cmd>Telescope git_commits<CR>", desc = "commits" },
      { "<leader>gs", "<cmd>Telescope git_status<CR>", desc = "status" },
      -- search
      { '<leader>s"', "<cmd>Telescope registers<cr>", desc = "Registers" },
      { "<leader>sa", "<cmd>Telescope autocommands<cr>", desc = "Auto Commands" },
      { "<leader>sb", "<cmd>Telescope current_buffer_fuzzy_find<cr>", desc = "Buffer" },
      { "<leader>sc", "<cmd>Telescope command_history<cr>", desc = "Command History" },
      { "<leader>sC", "<cmd>Telescope commands<cr>", desc = "Commands" },
      { "<leader>sd", "<cmd>Telescope diagnostics bufnr=0<cr>", desc = "Document diagnostics" },
      { "<leader>sD", "<cmd>Telescope diagnostics<cr>", desc = "Workspace diagnostics" },
      { "<leader>sg", "<cmd>Telescope live_grep<cr>", desc = "Grep (root dir)" },
      { "<leader>sG", "<cmd>Telescope live_grep cwd=false<cr>", desc = "Grep (cwd)" },
      { "<leader>sh", "<cmd>Telescope help_tags<cr>", desc = "Help Pages" },
      { "<leader>sH", "<cmd>Telescope highlights<cr>", desc = "Search Highlight Groups" },
      { "<leader>sk", "<cmd>Telescope keymaps<cr>", desc = "Key Maps" },
      { "<leader>sM", "<cmd>Telescope man_pages<cr>", desc = "Man Pages" },
      { "<leader>sm", "<cmd>Telescope marks<cr>", desc = "Jump to Mark" },
      { "<leader>so", "<cmd>Telescope vim_options<cr>", desc = "Options" },
      { "<leader>sR", "<cmd>Telescope resume<cr>", desc = "Resume" },
      { "<leader>sw", "<cmd>Telescope grep_string word_match=-w<cr>", desc = "Word (root dir)" },
      { "<leader>sW", "<cmd>Telescope grep_string cwd=false word_match=-w<cr>", desc = "Word (cwd)" },
      { "<leader>sw", "<cmd>Telescope grep_string<cr>", mode = "v", desc = "Selection (root dir)" },
      { "<leader>sW", "<cmd>Telescope grep_string cwd=false<cr>", mode = "v", desc = "Selection (cwd)" },
      { "<leader>uC", "<cmd>Telescope colorscheme enable_preview=true<cr>", desc = "Colorscheme with preview" },
      {
        "<leader>ss",
        function()
          require("telescope.builtin").lsp_document_symbols({
            symbols = {
              "Class",
              "Function",
              "Method",
              "Constructor",
              "Interface",
              "Module",
              "Struct",
              "Trait",
              "Field",
              "Property",
            },
          })
        end,
        desc = "Goto Symbol",
      },
      {
        "<leader>sS",
        function()
          require("telescope.builtin").lsp_dynamic_workspace_symbols({
            symbols = {
              "Class",
              "Function",
              "Method",
              "Constructor",
              "Interface",
              "Module",
              "Struct",
              "Trait",
              "Field",
              "Property",
            },
          })
        end,
        desc = "Goto Symbol (Workspace)",
      },
    },
    opts = function()
      local actions = require("telescope.actions")

      local open_with_trouble = function(...)
        return require("trouble.providers.telescope").open_with_trouble(...)
      end
      local open_selected_with_trouble = function(...)
        return require("trouble.providers.telescope").open_selected_with_trouble(...)
      end

      return {
        defaults = {
          prompt_prefix = " ",
          selection_caret = " ",
          get_selection_window = function()
            local wins = vim.api.nvim_list_wins()
            table.insert(wins, 1, vim.api.nvim_get_current_win())
            for _, win in ipairs(wins) do
              local buf = vim.api.nvim_win_get_buf(win)
              if vim.bo[buf].buftype == "" then
                return win
              end
            end
            return 0
          end,
          mappings = {
            i = {
              ["<c-t>"] = open_with_trouble,
              ["<a-t>"] = open_selected_with_trouble,
              ["<a-i>"] = function()
                local action_state = require("telescope.actions.state")
                local line = action_state.get_current_line()
                actions.close(action_state.get_current_picker())
                require("telescope.builtin").find_files({
                  no_ignore = true,
                  default_text = line,
                })
              end,
              ["<a-h>"] = function()
                local action_state = require("telescope.actions.state")
                local line = action_state.get_current_line()
                actions.close(action_state.get_current_picker())
                require("telescope.builtin").find_files({
                  hidden = true,
                  default_text = line,
                })
              end,
              ["<C-Down>"] = actions.cycle_history_next,
              ["<C-Up>"] = actions.cycle_history_prev,
              ["<C-f>"] = actions.preview_scrolling_down,
              ["<C-b>"] = actions.preview_scrolling_up,
            },
            n = {
              ["q"] = actions.close,
            },
          },
        },
        pickers = {
          find_files = {
            find_command = { "rg", "--files", "--hidden", "--glob", "!**/.git/*" },
          },
        },
      }
    end,
  },
}
`;

  await Deno.writeTextFile(`${configPath}/lua/plugins/telescope.lua`, content);
}

async function createFileExplorerConfig(configPath: string): Promise<void> {
  const content = `-- File explorer configuration

return {
  {
    "nvim-neo-tree/neo-tree.nvim",
    branch = "v3.x",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "nvim-tree/nvim-web-devicons",
      "MunifTanjim/nui.nvim",
    },
    cmd = "Neotree",
    keys = {
      {
        "<leader>fe",
        function()
          require("neo-tree.command").execute({ toggle = true, dir = vim.loop.cwd() })
        end,
        desc = "Explorer NeoTree (cwd)",
      },
      {
        "<leader>fE",
        function()
          require("neo-tree.command").execute({ toggle = true, dir = vim.fn.expand("%:p:h") })
        end,
        desc = "Explorer NeoTree (current file)",
      },
      { "<leader>e", "<leader>fe", desc = "Explorer NeoTree (cwd)", remap = true },
      { "<leader>E", "<leader>fE", desc = "Explorer NeoTree (current file)", remap = true },
      {
        "<leader>ge",
        function()
          require("neo-tree.command").execute({ source = "git_status", toggle = true })
        end,
        desc = "Git explorer",
      },
      {
        "<leader>be",
        function()
          require("neo-tree.command").execute({ source = "buffers", toggle = true })
        end,
        desc = "Buffer explorer",
      },
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
    opts = {
      sources = { "filesystem", "buffers", "git_status", "document_symbols" },
      open_files_do_not_replace_types = { "terminal", "Trouble", "trouble", "qf", "Outline" },
      filesystem = {
        bind_to_cwd = false,
        follow_current_file = { enabled = true },
        use_libuv_file_watcher = true,
      },
      window = {
        mappings = {
          ["<space>"] = "none",
          ["Y"] = function(state)
            local node = state.tree:get_node()
            local path = node:get_id()
            vim.fn.setreg("+", path, "c")
          end,
        },
      },
      default_component_configs = {
        indent = {
          with_expanders = true,
          expander_collapsed = "",
          expander_expanded = "",
          expander_highlight = "NeoTreeExpander",
        },
      },
    },
    config = function(_, opts)
      local function on_move(data)
        local ts_clients = {}
        for _, client in ipairs(vim.lsp.get_active_clients()) do
          if client.name == "typescript-tools" or client.name == "ts_ls" or client.name == "denols" then
            table.insert(ts_clients, client)
          end
        end
        
        for _, client in ipairs(ts_clients) do
          if client.name == "typescript-tools" then
            client.request("workspace/executeCommand", {
              command = "_typescript.applyRenameFile",
              arguments = {
                {
                  sourceUri = vim.uri_from_fname(data.source),
                  targetUri = vim.uri_from_fname(data.destination),
                },
              },
            })
          else
            client.request("workspace/executeCommand", {
              command = "_typescript.applyRenameFile",
              arguments = {
                {
                  sourceUri = vim.uri_from_fname(data.source),
                  targetUri = vim.uri_from_fname(data.destination),
                },
              },
            })
          end
        end
      end

      local events = require("neo-tree.events")
      opts.event_handlers = opts.event_handlers or {}
      vim.list_extend(opts.event_handlers, {
        { event = events.FILE_MOVED, handler = on_move },
        { event = events.FILE_RENAMED, handler = on_move },
      })
      require("neo-tree").setup(opts)
      vim.api.nvim_create_autocmd("TermClose", {
        pattern = "*lazygit",
        callback = function()
          if package.loaded["neo-tree.sources.git_status"] then
            require("neo-tree.sources.git_status").refresh()
          end
        end,
      })
    end,
  },
}
`;

  await Deno.writeTextFile(`${configPath}/lua/plugins/file-explorer.lua`, content);
}

async function createProductivityPlugins(configPath: string): Promise<void> {
  const content = `-- Productivity plugins for enhanced development workflow

return {
  -- Which key for showing keybindings
  {
    "folke/which-key.nvim",
    event = "VeryLazy",
    opts = {
      plugins = { spelling = true },
      defaults = {
        mode = { "n", "v" },
        ["g"] = { name = "+goto" },
        ["gs"] = { name = "+surround" },
        ["]"] = { name = "+next" },
        ["["] = { name = "+prev" },
        ["<leader><tab>"] = { name = "+tabs" },
        ["<leader>b"] = { name = "+buffer" },
        ["<leader>c"] = { name = "+code" },
        ["<leader>d"] = { name = "+deno" },
        ["<leader>f"] = { name = "+file/find" },
        ["<leader>g"] = { name = "+git" },
        ["<leader>gh"] = { name = "+hunks" },
        ["<leader>q"] = { name = "+quit/session" },
        ["<leader>s"] = { name = "+search" },
        ["<leader>u"] = { name = "+ui" },
        ["<leader>w"] = { name = "+windows" },
        ["<leader>x"] = { name = "+diagnostics/quickfix" },
      },
    },
    config = function(_, opts)
      local wk = require("which-key")
      wk.setup(opts)
      wk.register(opts.defaults)
    end,
  },

  -- Comments
  {
    "JoosepAlviste/nvim-ts-context-commentstring",
    lazy = true,
    opts = {
      enable_autocmd = false,
    },
  },
  {
    "echasnovski/mini.comment",
    event = "VeryLazy",
    opts = {
      options = {
        custom_commentstring = function()
          return require("ts_context_commentstring.internal").calculate_commentstring() or vim.bo.commentstring
        end,
      },
    },
  },

  -- Better text objects
  {
    "echasnovski/mini.ai",
    event = "VeryLazy",
    opts = function()
      local ai = require("mini.ai")
      return {
        n_lines = 500,
        custom_textobjects = {
          o = ai.gen_spec.treesitter({
            a = { "@block.outer", "@conditional.outer", "@loop.outer" },
            i = { "@block.inner", "@conditional.inner", "@loop.inner" },
          }, {}),
          f = ai.gen_spec.treesitter({ a = "@function.outer", i = "@function.inner" }, {}),
          c = ai.gen_spec.treesitter({ a = "@class.outer", i = "@class.inner" }, {}),
          t = { "<([%p%w]-)%f[^<%w][^<>]->.-</%1>", "^<.->().*()</[^/]->$" },
        },
      }
    end,
  },

  -- Surround
  {
    "echasnovski/mini.surround",
    keys = function(_, keys)
      local plugin = require("lazy.core.config").spec.plugins["mini.surround"]
      local opts = require("lazy.core.plugin").values(plugin, "opts", false)
      local mappings = {
        { opts.mappings.add, desc = "Add surrounding", mode = { "n", "v" } },
        { opts.mappings.delete, desc = "Delete surrounding" },
        { opts.mappings.find, desc = "Find right surrounding" },
        { opts.mappings.find_left, desc = "Find left surrounding" },
        { opts.mappings.highlight, desc = "Highlight surrounding" },
        { opts.mappings.replace, desc = "Replace surrounding" },
        { opts.mappings.update_n_lines, desc = "Update 'MiniSurround.config.n_lines'" },
      }
      mappings = vim.tbl_filter(function(m)
        return m[1] and #m[1] > 0
      end, mappings)
      return vim.list_extend(mappings, keys)
    end,
    opts = {
      mappings = {
        add = "gsa", -- Add surrounding in Normal and Visual modes
        delete = "gsd", -- Delete surrounding
        find = "gsf", -- Find surrounding (to the right)
        find_left = "gsF", -- Find surrounding (to the left)
        highlight = "gsh", -- Highlight surrounding
        replace = "gsr", -- Replace surrounding
        update_n_lines = "gsn", -- Update 'config.n_lines'
      },
    },
  },

  -- Search and replace
  {
    "nvim-pack/nvim-spectre",
    build = false,
    cmd = "Spectre",
    opts = { open_cmd = "noswapfile vnew" },
    keys = {
      { "<leader>sr", function() require("spectre").open() end, desc = "Replace in files (Spectre)" },
    },
  },

  -- Trouble for better diagnostics
  {
    "folke/trouble.nvim",
    cmd = { "TroubleToggle", "Trouble" },
    opts = { use_diagnostic_signs = true },
    keys = {
      { "<leader>xx", "<cmd>TroubleToggle document_diagnostics<cr>", desc = "Document Diagnostics (Trouble)" },
      { "<leader>xX", "<cmd>TroubleToggle workspace_diagnostics<cr>", desc = "Workspace Diagnostics (Trouble)" },
      { "<leader>xL", "<cmd>TroubleToggle loclist<cr>", desc = "Location List (Trouble)" },
      { "<leader>xQ", "<cmd>TroubleToggle quickfix<cr>", desc = "Quickfix List (Trouble)" },
      {
        "[q",
        function()
          if require("trouble").is_open() then
            require("trouble").previous({ skip_groups = true, jump = true })
          else
            local ok, err = pcall(vim.cmd.cprev)
            if not ok then
              vim.notify(err, vim.log.levels.ERROR)
            end
          end
        end,
        desc = "Previous trouble/quickfix item",
      },
      {
        "]q",
        function()
          if require("trouble").is_open() then
            require("trouble").next({ skip_groups = true, jump = true })
          else
            local ok, err = pcall(vim.cmd.cnext)
            if not ok then
              vim.notify(err, vim.log.levels.ERROR)
            end
          end
        end,
        desc = "Next trouble/quickfix item",
      },
    },
  },

  -- Todo comments
  {
    "folke/todo-comments.nvim",
    cmd = { "TodoTrouble", "TodoTelescope" },
    event = { "BufReadPost", "BufNewFile" },
    config = true,
    keys = {
      { "]t", function() require("todo-comments").jump_next() end, desc = "Next todo comment" },
      { "[t", function() require("todo-comments").jump_prev() end, desc = "Previous todo comment" },
      { "<leader>xt", "<cmd>TodoTrouble<cr>", desc = "Todo (Trouble)" },
      { "<leader>xT", "<cmd>TodoTrouble keywords=TODO,FIX,FIXME<cr>", desc = "Todo/Fix/Fixme (Trouble)" },
      { "<leader>st", "<cmd>TodoTelescope<cr>", desc = "Todo" },
      { "<leader>sT", "<cmd>TodoTelescope keywords=TODO,FIX,FIXME<cr>", desc = "Todo/Fix/Fixme" },
    },
  },

  -- Better fold text
  {
    "kevinhwang91/nvim-ufo",
    dependencies = "kevinhwang91/promise-async",
    event = "VeryLazy",
    opts = {},
    init = function()
      vim.o.foldcolumn = "1" -- '0' is not bad
      vim.o.foldlevel = 99 -- Using ufo provider need a large value, feel free to decrease the value
      vim.o.foldlevelstart = 99
      vim.o.foldenable = true
    end,
  },

  -- Parentheses highlighting
  {
    "HiPhish/rainbow-delimiters.nvim",
    event = "VeryLazy",
    config = function()
      local rainbow_delimiters = require 'rainbow-delimiters'
      vim.g.rainbow_delimiters = {
        strategy = {
          [''] = rainbow_delimiters.strategy['global'],
          vim = rainbow_delimiters.strategy['local'],
        },
        query = {
          [''] = 'rainbow-delimiters',
          lua = 'rainbow-blocks',
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
}
`;

  await Deno.writeTextFile(`${configPath}/lua/plugins/productivity.lua`, content);
}

async function createGitPlugins(configPath: string): Promise<void> {
  const content = `-- Git integration plugins

return {
  -- Git signs
  {
    "lewis6991/gitsigns.nvim",
    event = { "BufReadPre", "BufNewFile" },
    opts = {
      signs = {
        add = { text = "▎" },
        change = { text = "▎" },
        delete = { text = "" },
        topdelete = { text = "" },
        changedelete = { text = "▎" },
        untracked = { text = "▎" },
      },
      on_attach = function(buffer)
        local gs = package.loaded.gitsigns

        local function map(mode, l, r, desc)
          vim.keymap.set(mode, l, r, { buffer = buffer, desc = desc })
        end

        -- stylua: ignore start
        map("n", "]h", gs.next_hunk, "Next Hunk")
        map("n", "[h", gs.prev_hunk, "Prev Hunk")
        map({ "n", "v" }, "<leader>ghs", ":Gitsigns stage_hunk<CR>", "Stage Hunk")
        map({ "n", "v" }, "<leader>ghr", ":Gitsigns reset_hunk<CR>", "Reset Hunk")
        map("n", "<leader>ghS", gs.stage_buffer, "Stage Buffer")
        map("n", "<leader>ghu", gs.undo_stage_hunk, "Undo Stage Hunk")
        map("n", "<leader>ghR", gs.reset_buffer, "Reset Buffer")
        map("n", "<leader>ghp", gs.preview_hunk, "Preview Hunk")
        map("n", "<leader>ghb", function() gs.blame_line({ full = true }) end, "Blame Line")
        map("n", "<leader>ghd", gs.diffthis, "Diff This")
        map("n", "<leader>ghD", function() gs.diffthis("~") end, "Diff This ~")
        map({ "o", "x" }, "ih", ":<C-U>Gitsigns select_hunk<CR>", "GitSigns Select Hunk")
      end,
    },
  },

  -- Lazygit
  {
    "kdheepak/lazygit.nvim",
    dependencies = {
      "nvim-telescope/telescope.nvim",
      "nvim-lua/plenary.nvim",
    },
    config = function()
      require("telescope").load_extension("lazygit")
    end,
    keys = {
      { "<leader>gg", "<cmd>LazyGit<cr>", desc = "LazyGit" },
    },
  },

  -- Diff view
  {
    "sindrets/diffview.nvim",
    cmd = { "DiffviewOpen", "DiffviewClose", "DiffviewToggleFiles", "DiffviewFocusFiles" },
    config = true,
    keys = {
      { "<leader>gd", "<cmd>DiffviewOpen<cr>", desc = "DiffView" },
    },
  },
}
`;

  await Deno.writeTextFile(`${configPath}/lua/plugins/git.lua`, content);
}

async function createDebuggingPlugins(configPath: string): Promise<void> {
  const content = `-- Debugging plugins for TypeScript/Deno development

return {
  -- Debug Adapter Protocol
  {
    "mfussenegger/nvim-dap",
    dependencies = {
      "rcarriga/nvim-dap-ui",
      "theHamsta/nvim-dap-virtual-text",
      "nvim-neotest/nvim-nio",
      "williamboman/mason.nvim",
    },
    keys = {
      { "<leader>dB", function() require("dap").set_breakpoint(vim.fn.input('Breakpoint condition: ')) end, desc = "Breakpoint Condition" },
      { "<leader>db", function() require("dap").toggle_breakpoint() end, desc = "Toggle Breakpoint" },
      { "<leader>dc", function() require("dap").continue() end, desc = "Continue" },
      { "<leader>da", function() require("dap").continue({ before = get_args }) end, desc = "Run with Args" },
      { "<leader>dC", function() require("dap").run_to_cursor() end, desc = "Run to Cursor" },
      { "<leader>dg", function() require("dap").goto_() end, desc = "Go to line (no execute)" },
      { "<leader>di", function() require("dap").step_into() end, desc = "Step Into" },
      { "<leader>dj", function() require("dap").down() end, desc = "Down" },
      { "<leader>dk", function() require("dap").up() end, desc = "Up" },
      { "<leader>dl", function() require("dap").run_last() end, desc = "Run Last" },
      { "<leader>do", function() require("dap").step_out() end, desc = "Step Out" },
      { "<leader>dO", function() require("dap").step_over() end, desc = "Step Over" },
      { "<leader>dp", function() require("dap").pause() end, desc = "Pause" },
      { "<leader>dr", function() require("dap").repl.toggle() end, desc = "Toggle REPL" },
      { "<leader>ds", function() require("dap").session() end, desc = "Session" },
      { "<leader>dt", function() require("dap").terminate() end, desc = "Terminate" },
      { "<leader>dw", function() require("dap.ui.widgets").hover() end, desc = "Widgets" },
    },
    config = function()
      local dap = require("dap")
      
      -- Deno debugging configuration
      dap.adapters.deno = {
        type = "executable",
        command = "deno",
        args = { "run", "--inspect-brk", "--allow-all" },
      }

      dap.configurations.typescript = {
        {
          type = "deno",
          request = "launch",
          name = "Launch Deno",
          program = "${file}",
          cwd = "${workspaceFolder}",
          runtimeExecutable = "deno",
          runtimeArgs = { "run", "--inspect-brk", "--allow-all" },
          attachSimplePort = 9229,
        },
        {
          type = "deno",
          request = "attach",
          name = "Attach to Deno",
          localRoot = "${workspaceFolder}",
          remoteRoot = "${workspaceFolder}",
          port = 9229,
        },
      }

      -- Copy typescript config to javascript
      dap.configurations.javascript = dap.configurations.typescript

      -- UI setup
      local dapui = require("dapui")
      dapui.setup({
        icons = { expanded = "", collapsed = "", current_frame = "" },
        mappings = {
          expand = { "<CR>", "<2-LeftMouse>" },
          open = "o",
          remove = "d",
          edit = "e",
          repl = "r",
          toggle = "t",
        },
        element_mappings = {},
        expand_lines = vim.fn.has("nvim-0.7") == 1,
        layouts = {
          {
            elements = {
              { id = "scopes", size = 0.25 },
              "breakpoints",
              "stacks",
              "watches",
            },
            size = 40,
            position = "left",
          },
          {
            elements = {
              "repl",
              "console",
            },
            size = 0.25,
            position = "bottom",
          },
        },
        controls = {
          enabled = true,
          element = "repl",
          icons = {
            pause = "",
            play = "",
            step_into = "",
            step_over = "",
            step_out = "",
            step_back = "",
            run_last = "",
            terminate = "",
          },
        },
        floating = {
          max_height = nil,
          max_width = nil,
          border = "single",
          mappings = {
            close = { "q", "<Esc>" },
          },
        },
        windows = { indent = 1 },
        render = {
          max_type_length = nil,
          max_value_lines = 100,
        },
      })

      -- Automatically open/close DAP UI
      dap.listeners.after.event_initialized["dapui_config"] = function()
        dapui.open()
      end
      dap.listeners.before.event_terminated["dapui_config"] = function()
        dapui.close()
      end
      dap.listeners.before.event_exited["dapui_config"] = function()
        dapui.close()
      end

      -- Virtual text setup
      require("nvim-dap-virtual-text").setup({
        enabled = true,
        enabled_commands = true,
        highlight_changed_variables = true,
        highlight_new_as_changed = false,
        show_stop_reason = true,
        commented = false,
        only_first_definition = true,
        all_references = false,
        clear_on_continue = false,
        display_callback = function(variable, buf, stackframe, node, options)
          if options.virt_text_pos == "inline" then
            return " = " .. variable.value
          else
            return variable.name .. " = " .. variable.value
          end
        end,
        virt_text_pos = vim.fn.has("nvim-0.10") == 1 and "inline" or "eol",
        all_frames = false,
        virt_lines = false,
        virt_text_win_col = nil,
      })
    end,
  },

  -- DAP UI
  {
    "rcarriga/nvim-dap-ui",
    dependencies = { "nvim-neotest/nvim-nio" },
    keys = {
      { "<leader>du", function() require("dapui").toggle({ }) end, desc = "Dap UI" },
      { "<leader>de", function() require("dapui").eval() end, desc = "Eval", mode = {"n", "v"} },
    },
    opts = {},
    config = function(_, opts)
      local dap = require("dap")
      local dapui = require("dapui")
      dapui.setup(opts)
      dap.listeners.after.event_initialized["dapui_config"] = function()
        dapui.open({})
      end
      dap.listeners.before.event_terminated["dapui_config"] = function()
        dapui.close({})
      end
      dap.listeners.before.event_exited["dapui_config"] = function()
        dapui.close({})
      end
    end,
  },

  -- Mason DAP for easy debugger installation
  {
    "jay-babu/mason-nvim-dap.nvim",
    dependencies = "mason.nvim",
    cmd = { "DapInstall", "DapUninstall" },
    opts = {
      automatic_installation = true,
      handlers = {},
      ensure_installed = {
        -- Install debuggers for common languages
      },
    },
  },
}
`;

  await Deno.writeTextFile(`${configPath}/lua/plugins/debugging.lua`, content);
}

async function createDenoConfig(configPath: string): Promise<void> {
  const content = `-- Deno-specific configuration and project setup

-- Create sample deno.json if it doesn't exist
local function createDenoConfig()
  local deno_json_path = vim.fn.getcwd() .. "/deno.json"
  
  if vim.fn.filereadable(deno_json_path) == 0 then
    local deno_config = {
      tasks = {
        dev = "deno run --allow-net --allow-read --watch main.ts",
        start = "deno run --allow-net --allow-read main.ts",
        test = "deno test --allow-all",
        fmt = "deno fmt",
        lint = "deno lint"
      },
      imports = {
        ["@std/"] = "https://deno.land/std@0.208.0/",
        ["@oak/"] = "https://deno.land/x/oak@v12.6.1/"
      },
      compilerOptions = {
        allowJs = true,
        lib = { "deno.window" },
        strict = true
      },
      fmt = {
        files = {
          include = { "src/" },
          exclude = { "build/" }
        },
        options = {
          useTabs = false,
          lineWidth = 80,
          indentWidth = 2
        }
      },
      lint = {
        files = {
          include = { "src/" },
          exclude = { "build/" }
        },
        rules = {
          tags = { "recommended" }
        }
      }
    }
    
    local json_str = vim.fn.json_encode(deno_config)
    vim.fn.writefile(vim.split(json_str, '\n'), deno_json_path)
    print("Created deno.json configuration")
  end
end

-- Create sample TypeScript file
local function createSampleDenoFile()
  local main_ts_path = vim.fn.getcwd() .. "/main.ts"
  
  if vim.fn.filereadable(main_ts_path) == 0 then
    local sample_content = {
      'import { serve } from "@std/http/server";',
      '',
      'const handler = (req: Request): Response => {',
      '  return new Response("Hello, Deno Genesis!");',
      '};',
      '',
      'console.log("Server running on http://localhost:8000");',
      'serve(handler, { port: 8000 });'
    }
    
    vim.fn.writefile(sample_content, main_ts_path)
    print("Created sample main.ts file")
  end
end

-- Auto-create Deno configuration when opening a TypeScript file in an empty directory
vim.api.nvim_create_autocmd({"BufRead", "BufNewFile"}, {
  pattern = "*.ts",
  callback = function()
    local current_dir = vim.fn.getcwd()
    local has_deno_json = vim.fn.filereadable(current_dir .. "/deno.json") == 1
    local has_package_json = vim.fn.filereadable(current_dir .. "/package.json") == 1
    
    -- If no package.json and no deno.json, assume this is a new Deno project
    if not has_package_json and not has_deno_json then
      vim.defer_fn(function()
        local choice = vim.fn.confirm("No configuration found. Create Deno project?", "&Yes\n&No", 1)
        if choice == 1 then
          createDenoConfig()
          createSampleDenoFile()
          -- Restart LSP to pick up new configuration
          vim.cmd("LspRestart")
        end
      end, 100)
    end
  end,
})

-- Deno-specific commands
vim.api.nvim_create_user_command("DenoRun", function(opts)
  local file = opts.args ~= "" and opts.args or vim.fn.expand("%")
  vim.cmd("!" .. "deno run --allow-all " .. file)
end, { nargs = "?", desc = "Run Deno file" })

vim.api.nvim_create_user_command("DenoTest", function()
  vim.cmd("!deno test --allow-all")
end, { desc = "Run Deno tests" })

vim.api.nvim_create_user_command("DenoFmt", function()
  vim.cmd("!deno fmt")
end, { desc = "Format all files with Deno" })

vim.api.nvim_create_user_command("DenoLint", function()
  vim.cmd("!deno lint")
end, { desc = "Lint all files with Deno" })

vim.api.nvim_create_user_command("DenoCheck", function(opts)
  local file = opts.args ~= "" and opts.args or vim.fn.expand("%")
  vim.cmd("!" .. "deno check " .. file)
end, { nargs = "?", desc = "Type check Deno file" })

vim.api.nvim_create_user_command("DenoInfo", function(opts)
  local file = opts.args ~= "" and opts.args or vim.fn.expand("%")
  vim.cmd("!" .. "deno info " .. file)
end, { nargs = "?", desc = "Show Deno file info" })

vim.api.nvim_create_user_command("DenoTask", function(opts)
  local task = opts.args ~= "" and opts.args or ""
  vim.cmd("!" .. "deno task " .. task)
end, { nargs = "?", desc = "Run Deno task" })

-- Database-aware completion for multi-tenant development
local function setupDatabaseCompletion()
  -- Add common database table names for completion
  local database_tables = {
    "sites", "content", "projects", "transactions", 
    "contact_messages", "admin_users", "site_settings"
  }
  
  -- Add database-specific snippets
  local luasnip = require("luasnip")
  local s = luasnip.snippet
  local t = luasnip.text_node
  local i = luasnip.insert_node
  
  luasnip.add_snippets("typescript", {
    s("dbquery", {
      t("const query = `SELECT * FROM "), i(1, "table_name"), 
      t(" WHERE site_key = ?`;"),
    }),
    s("dbinsert", {
      t("const query = `INSERT INTO "), i(1, "table_name"), 
      t(" (site_key, "), i(2, "columns"), t(") VALUES (?, "), i(3, "values"), t(")`;"),
    }),
    s("dbupdate", {
      t("const query = `UPDATE "), i(1, "table_name"), 
      t(" SET "), i(2, "column = ?"), t(" WHERE site_key = ? AND id = ?`;"),
    }),
  })
end

-- Setup database completion if luasnip is available
vim.defer_fn(function()
  if package.loaded["luasnip"] then
    setupDatabaseCompletion()
  end
end, 1000)

return {}
`;

  await Deno.writeTextFile(`${configPath}/lua/config/deno.lua`, content);
}

// Install plugins and run initial setup
async function installPlugins(platform: PlatformInfo): Promise<boolean> {
  logHeader("Installing Plugins");
  
  try {
    logInfo("Running Neovim headless to install plugins...");
    
    // Run Neovim headless to install plugins
    const success = await runCommand([
      "nvim",
      "--headless",
      "-c", "autocmd User LazyVimStarted quitall",
      "-c", "Lazy! sync",
    ], { stdout: "null" });
    
    if (success) {
      logSuccess("Plugins installed successfully");
      return true;
    } else {
      logError("Plugin installation failed");
      return false;
    }
  } catch (error) {
    logError(`Plugin installation error: ${error.message}`);
    return false;
  }
}

// Create sample project structure
async function createSampleProject(): Promise<boolean> {
  logHeader("Creating Sample Deno Project Structure");
  
  try {
    // Create directories
    await ensureDir("src");
    await ensureDir("tests");
    await ensureDir("docs");
    
    // Create deno.json
    const denoConfig = {
      tasks: {
        dev: "deno run --allow-net --allow-read --watch src/main.ts",
        start: "deno run --allow-net --allow-read src/main.ts",
        test: "deno test --allow-all tests/",
        fmt: "deno fmt",
        lint: "deno lint",
        check: "deno check src/main.ts"
      },
      imports: {
        "@std/": "https://deno.land/std@0.208.0/",
        "@oak/": "https://deno.land/x/oak@v12.6.1/",
        "@genesis/": "./src/"
      },
      compilerOptions: {
        allowJs: true,
        lib: ["deno.window"],
        strict: true
      },
      fmt: {
        files: {
          include: ["src/", "tests/"],
          exclude: ["build/", "dist/"]
        },
        options: {
          useTabs: false,
          lineWidth: 80,
          indentWidth: 2
        }
      },
      lint: {
        files: {
          include: ["src/", "tests/"],
          exclude: ["build/", "dist/"]
        },
        rules: {
          tags: ["recommended"]
        }
      }
    };
    
    await Deno.writeTextFile("deno.json", JSON.stringify(denoConfig, null, 2));
    
    // Create sample main.ts
    const mainContent = `import { serve } from "@std/http/server";

const handler = (req: Request): Response => {
  const url = new URL(req.url);
  
  switch (url.pathname) {
    case "/":
      return new Response("Welcome to Deno Genesis!");
    case "/health":
      return new Response(JSON.stringify({ status: "healthy" }), {
        headers: { "content-type": "application/json" },
      });
    default:
      return new Response("Not Found", { status: 404 });
  }
};

console.log("🚀 Deno Genesis server starting on http://localhost:8000");
serve(handler, { port: 8000 });
`;
    
    await Deno.writeTextFile("src/main.ts", mainContent);
    
    // Create sample test
    const testContent = `import { assertEquals } from "@std/testing/asserts";

Deno.test("sample test", () => {
  assertEquals(1 + 1, 2);
});
`;
    
    await Deno.writeTextFile("tests/main_test.ts", testContent);
    
    // Create README
    const readmeContent = `# Deno Genesis Project

A TypeScript project built with Deno and configured with Neovim.

## Getting Started

\`\`\`bash
# Run the development server
deno task dev

# Run tests
deno task test

# Format code
deno task fmt

# Lint code
deno task lint
\`\`\`

## Neovim Key Mappings

- \`<leader>dr\` - Run current Deno file
- \`<leader>dt\` - Run Deno tests
- \`<leader>df\` - Format with Deno
- \`<leader>dl\` - Lint with Deno
- \`<leader>dc\` - Type check with Deno
- \`<leader>di\` - Show Deno info

## Project Structure

- \`src/\` - Source code
- \`tests/\` - Test files
- \`docs/\` - Documentation
`;
    
    await Deno.writeTextFile("README.md", readmeContent);
    
    logSuccess("Sample project structure created");
    return true;
  } catch (error) {
    logError(`Failed to create sample project: ${error.message}`);
    return false;
  }
}

// Print final instructions
function printFinalInstructions(): void {
  logHeader("Setup Complete!");
  
  logSuccess("Neovim has been configured for Deno Genesis TypeScript development");
  
  log("\n📋 Next Steps:", colors.cyan);
  log("1. Start Neovim: nvim", colors.green);
  log("2. Wait for plugins to finish installing", colors.green);
  log("3. Open a .ts file to activate Deno LSP", colors.green);
  log("4. Run :checkhealth to verify setup", colors.green);
  
  log("\n⌨️  Key Mappings:", colors.cyan);
  log("- <leader>ff: Find files", colors.blue);
  log("- <leader>fg: Live grep", colors.blue);
  log("- <leader>e: Toggle file explorer", colors.blue);
  log("- <leader>dr: Run Deno file", colors.blue);
  log("- <leader>dt: Run Deno tests", colors.blue);
  log("- <leader>df: Format with Deno", colors.blue);
  log("- <leader>dl: Lint with Deno", colors.blue);
  log("- <leader>dc: Type check with Deno", colors.blue);
  
  log("\n🛠️  Deno Commands:", colors.cyan);
  log("- :DenoRun [file]: Run Deno file", colors.blue);
  log("- :DenoTest: Run all tests", colors.blue);
  log("- :DenoFmt: Format all files", colors.blue);
  log("- :DenoLint: Lint all files", colors.blue);
  log("- :DenoCheck [file]: Type check file", colors.blue);
  log("- :DenoTask [task]: Run Deno task", colors.blue);
  
  log("\n🔧 Troubleshooting:", colors.yellow);
  log("- If LSP doesn't start: :LspRestart", colors.yellow);
  log("- If plugins fail: :Lazy sync", colors.yellow);
  log("- For health check: :checkhealth", colors.yellow);
  
  log("\n🎉 Happy coding with Deno Genesis!", colors.magenta);
}

// Main setup function
async function main(): Promise<void> {
  const args = parseArgs(Deno.args);
  
  const options: SetupOptions = {
    minimal: args.minimal || false,
    backupOnly: args["backup-only"] || false,
    skipPlugins: args["skip-plugins"] || false,
    verbose: args.verbose || args.v || false,
    configPath: args["config-path"],
  };
  
  logHeader("Neovim Deno Genesis Setup");
  logInfo("Configuring Neovim for optimal Deno TypeScript development");
  
  try {
    // Detect platform
    const platform = await detectPlatform();
    logInfo(`Platform detected: ${platform.os} with ${platform.packageManager}`);
    
    // Check prerequisites
    const prereqsOk = await checkPrerequisites(platform);
    if (!prereqsOk) {
      logError("Prerequisites check failed. Please install missing dependencies and try again.");
      Deno.exit(1);
    }
    
    // Backup existing configuration
    if (!await backupExistingConfig(platform)) {
      logError("Failed to backup existing configuration");
      Deno.exit(1);
    }
    
    if (options.backupOnly) {
      logSuccess("Backup completed. Exiting as requested.");
      return;
    }
    
    // Create configuration
    if (!await createConfiguration(platform, options)) {
      logError("Failed to create configuration");
      Deno.exit(1);
    }
    
    // Install plugins unless skipped
    if (!options.skipPlugins) {
      if (!await installPlugins(platform)) {
        logWarning("Plugin installation failed, but configuration is ready");
      }
    }
    
    // Create sample project if directory is empty
    const isEmpty = (await Array.fromAsync(Deno.readDir("."))).length <= 1;
    if (isEmpty) {
      const createSample = confirm("Create sample Deno project structure?");
      if (createSample) {
        await createSampleProject();
      }
    }
    
    // Print final instructions
    printFinalInstructions();
    
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    Deno.exit(1);
  }
}

// Run the setup if this is the main module
if (import.meta.main) {
  await main();
}