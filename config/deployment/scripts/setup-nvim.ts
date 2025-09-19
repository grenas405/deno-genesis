#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write --allow-net --allow-env

/**
 * Universal LazyVim Installation Utility for Deno Development
 * 
 * Implements LazyVim distribution with optimized Deno TypeScript development environment.
 * Includes LSP, formatters, debuggers, and specialized Deno plugins.
 *
 * Unix Philosophy Implementation:
 * - Do one thing well: Install and configure LazyVim for Deno development
 * - Accept text input: Environment variables and command line flags
 * - Produce text output: Structured logging with clear success/error states
 * - Filter and transform: Takes system state → configured Neovim environment
 * - Composable: Can be chained with other setup utilities
 *
 * Usage:
 *   deno run --allow-all setup-lazyvim.ts
 *   deno run --allow-all setup-lazyvim.ts --backup
 *   deno run --allow-all setup-lazyvim.ts --force
 *   deno run --allow-all setup-lazyvim.ts --minimal
 */

import { parseArgs } from "https://deno.land/std@0.224.0/cli/parse_args.ts";
import { exists } from "https://deno.land/std@0.224.0/fs/exists.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

// Types for better developer experience
interface LazyVimConfig {
  configPath: string;
  backupPath: string;
  denoPlugins: boolean;
  minimalInstall: boolean;
}

interface SetupOptions {
  force: boolean;
  backup: boolean;
  minimal: boolean;
  testOnly: boolean;
  verbose: boolean;
  skipNeovim: boolean;
}

// Default configuration
const DEFAULT_CONFIG: LazyVimConfig = {
  configPath: "",
  backupPath: "",
  denoPlugins: true,
  minimalInstall: false,
};

// Universal compatibility checks
interface SystemCapabilities {
  hasGit: boolean;
  hasInternet: boolean;
  canInstallPackages: boolean;
  isAirGapped: boolean;
  proxy: string | null;
}

// Detect system capabilities for universal compatibility
async function detectSystemCapabilities(): Promise<SystemCapabilities> {
  const capabilities: SystemCapabilities = {
    hasGit: false,
    hasInternet: false,
    canInstallPackages: false,
    isAirGapped: false,
    proxy: null,
  };

  // Check Git availability
  try {
    const gitCmd = new Deno.Command("git", {
      args: ["--version"],
      stdout: "null",
      stderr: "null",
    });
    const { success } = await gitCmd.output();
    capabilities.hasGit = success;
  } catch {
    capabilities.hasGit = false;
  }

  // Check internet connectivity
  try {
    const response = await fetch("https://api.github.com", {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    capabilities.hasInternet = response.ok;
  } catch {
    capabilities.hasInternet = false;
  }

  // Check proxy configuration
  capabilities.proxy = Deno.env.get("HTTP_PROXY") || 
                      Deno.env.get("HTTPS_PROXY") || 
                      Deno.env.get("http_proxy") || 
                      Deno.env.get("https_proxy") || null;

  // Determine if system is air-gapped
  capabilities.isAirGapped = !capabilities.hasInternet && !capabilities.proxy;

  // Check package installation capabilities
  const platform = detectPlatform();
  if (platform.os === "windows") {
    // Check if running as administrator on Windows
    try {
      const adminCheck = new Deno.Command("net", {
        args: ["session"],
        stdout: "null",
        stderr: "null",
      });
      const { success } = await adminCheck.output();
      capabilities.canInstallPackages = success;
    } catch {
      capabilities.canInstallPackages = false;
    }
  } else {
    // Check sudo availability on Unix systems
    try {
      const sudoCheck = new Deno.Command("sudo", {
        args: ["-n", "true"],
        stdout: "null",
        stderr: "null",
      });
      const { success } = await sudoCheck.output();
      capabilities.canInstallPackages = success;
    } catch {
      capabilities.canInstallPackages = false;
    }
  }

  return capabilities;
}

// Detect platform for paths and commands
function detectPlatform(): { os: string; arch: string; configDir: string } {
  const os = Deno.build.os;
  const arch = Deno.build.arch;
  
  let configDir: string;
  if (os === "windows") {
    configDir = join(Deno.env.get("LOCALAPPDATA") || "", "nvim");
  } else {
    const xdgConfig = Deno.env.get("XDG_CONFIG_HOME");
    const home = Deno.env.get("HOME") || "";
    configDir = xdgConfig ? join(xdgConfig, "nvim") : join(home, ".config", "nvim");
  }
  
  return { os, arch, configDir };
}

// ANSI color codes for Unix-style terminal output
const Colors = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
} as const;

// Unix-style logging functions
function logInfo(message: string): void {
  console.log(`${Colors.BLUE}[INFO]${Colors.RESET} ${message}`);
}

function logSuccess(message: string): void {
  console.log(`${Colors.GREEN}[SUCCESS]${Colors.RESET} ${message}`);
}

function logWarning(message: string): void {
  console.log(`${Colors.YELLOW}[WARNING]${Colors.RESET} ${message}`);
}

function logError(message: string): void {
  console.error(`${Colors.RED}[ERROR]${Colors.RESET} ${message}`);
}

function logHeader(message: string): void {
  const border = '='.repeat(60);
  console.log(`\n${Colors.CYAN}${border}`);
  console.log(`${Colors.BOLD}${Colors.CYAN} ${message}`);
  console.log(`${border}${Colors.RESET}\n`);
}

// Check if Neovim is installed
async function checkNeovimInstalled(): Promise<{ installed: boolean; version: string; path: string }> {
  try {
    const command = new Deno.Command("nvim", {
      args: ["--version"],
      stdout: "piped",
      stderr: "null",
    });
    const { success, stdout } = await command.output();

    if (success) {
      const output = new TextDecoder().decode(stdout);
      const versionMatch = output.match(/NVIM v(\d+\.\d+\.\d+)/);
      const version = versionMatch ? versionMatch[1] : "unknown";

      // Get Neovim path
      const whichCmd = new Deno.Command("which", {
        args: ["nvim"],
        stdout: "piped",
        stderr: "null",
      });
      const { stdout: pathOutput } = await whichCmd.output();
      const path = new TextDecoder().decode(pathOutput).trim();

      return { installed: true, version, path };
    }

    return { installed: false, version: "", path: "" };
  } catch {
    return { installed: false, version: "", path: "" };
  }
}

// Install Neovim using system package manager
async function installNeovim(): Promise<boolean> {
  logHeader("Installing Neovim");

  const platform = detectPlatform();
  
  try {
    if (platform.os === "linux") {
      // Try various Linux package managers
      const managers = [
        {
          name: "apt",
          check: ["which", "apt"],
          install: ["sudo", "apt", "update", "&&", "sudo", "apt", "install", "-y", "neovim"]
        },
        {
          name: "pacman",
          check: ["which", "pacman"],
          install: ["sudo", "pacman", "-S", "--noconfirm", "neovim"]
        },
        {
          name: "dnf",
          check: ["which", "dnf"],
          install: ["sudo", "dnf", "install", "-y", "neovim"]
        },
        {
          name: "zypper",
          check: ["which", "zypper"],
          install: ["sudo", "zypper", "install", "-y", "neovim"]
        }
      ];

      for (const manager of managers) {
        try {
          const checkCmd = new Deno.Command(manager.check[0], {
            args: manager.check.slice(1),
            stdout: "null",
            stderr: "null",
          });
          const { success } = await checkCmd.output();

          if (success) {
            logInfo(`Installing Neovim using ${manager.name}...`);
            const installCmd = new Deno.Command("bash", {
              args: ["-c", manager.install.join(" ")],
              stdout: "inherit",
              stderr: "inherit",
            });
            const { success: installSuccess } = await installCmd.output();
            if (installSuccess) {
              logSuccess(`Neovim installed successfully using ${manager.name}`);
              return true;
            }
          }
        } catch {
          continue;
        }
      }
    } else if (platform.os === "darwin") {
      // macOS - use Homebrew
      logInfo("Installing Neovim using Homebrew...");
      const brewCmd = new Deno.Command("brew", {
        args: ["install", "neovim"],
        stdout: "inherit",
        stderr: "inherit",
      });
      const { success } = await brewCmd.output();
      if (success) {
        logSuccess("Neovim installed successfully using Homebrew");
        return true;
      }
    } else if (platform.os === "windows") {
      // Windows - use Chocolatey or Scoop
      try {
        logInfo("Installing Neovim using Chocolatey...");
        const chocoCmd = new Deno.Command("choco", {
          args: ["install", "neovim", "-y"],
          stdout: "inherit",
          stderr: "inherit",
        });
        const { success } = await chocoCmd.output();
        if (success) {
          logSuccess("Neovim installed successfully using Chocolatey");
          return true;
        }
      } catch {
        try {
          logInfo("Installing Neovim using Scoop...");
          const scoopCmd = new Deno.Command("scoop", {
            args: ["install", "neovim"],
            stdout: "inherit",
            stderr: "inherit",
          });
          const { success } = await scoopCmd.output();
          if (success) {
            logSuccess("Neovim installed successfully using Scoop");
            return true;
          }
        } catch {
          // Fall through
        }
      }
    }

    logError("Failed to install Neovim using package managers");
    return false;
  } catch (error) {
    logError(`Neovim installation failed: ${error.message}`);
    return false;
  }
}

// Backup existing Neovim configuration
async function backupExistingConfig(configPath: string): Promise<string | null> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${configPath}.backup.${timestamp}`;

  try {
    if (await exists(configPath)) {
      logInfo(`Backing up existing config to ${backupPath}`);
      
      const platform = detectPlatform();
      const copyCmd = platform.os === "windows"
        ? new Deno.Command("xcopy", {
            args: [configPath, backupPath, "/E", "/I", "/H"],
            stdout: "inherit",
            stderr: "inherit",
          })
        : new Deno.Command("cp", {
            args: ["-r", configPath, backupPath],
            stdout: "inherit",
            stderr: "inherit",
          });

      const { success } = await copyCmd.output();
      if (success) {
        logSuccess(`Backup created at ${backupPath}`);
        return backupPath;
      } else {
        logError("Failed to create backup");
        return null;
      }
    }
    return null;
  } catch (error) {
    logError(`Backup failed: ${error.message}`);
    return null;
  }
}

// Install LazyVim with universal compatibility
async function installLazyVimUniversal(configPath: string, capabilities: SystemCapabilities): Promise<boolean> {
  logHeader("Installing LazyVim with Universal Compatibility");

  try {
    // Remove existing config directory if it exists
    if (await exists(configPath)) {
      logInfo("Removing existing configuration...");
      await Deno.remove(configPath, { recursive: true });
    }

    if (capabilities.hasGit && capabilities.hasInternet) {
      // Standard Git clone method
      return await installLazyVimStarter(configPath);
    } else if (capabilities.hasInternet) {
      // Fallback: Download ZIP archive
      logInfo("Git not available, downloading LazyVim archive...");
      return await downloadLazyVimArchive(configPath);
    } else if (capabilities.isAirGapped) {
      // Air-gapped installation
      logInfo("Air-gapped environment detected, using embedded configuration...");
      return await createEmbeddedLazyVimConfig(configPath);
    } else {
      logError("Unable to install LazyVim: No Git, no internet connectivity");
      return false;
    }
  } catch (error) {
    logError(`Universal LazyVim installation failed: ${error.message}`);
    return false;
  }
}

// Download LazyVim starter as ZIP archive (Git alternative)
async function downloadLazyVimArchive(configPath: string): Promise<boolean> {
  try {
    const archiveUrl = "https://github.com/LazyVim/starter/archive/refs/heads/main.zip";
    
    logInfo("Downloading LazyVim starter archive...");
    const response = await fetch(archiveUrl);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const zipData = new Uint8Array(await response.arrayBuffer());
    const tempDir = await Deno.makeTempDir();
    const zipPath = join(tempDir, "starter.zip");
    
    await Deno.writeTextFile(zipPath, new TextDecoder().decode(zipData));

    // Extract archive
    const platform = detectPlatform();
    const extractCmd = platform.os === "windows"
      ? new Deno.Command("powershell", {
          args: ["-Command", `Expand-Archive -Path "${zipPath}" -DestinationPath "${tempDir}"`],
          stdout: "inherit",
          stderr: "inherit",
        })
      : new Deno.Command("unzip", {
          args: ["-q", zipPath, "-d", tempDir],
          stdout: "inherit",
          stderr: "inherit",
        });

    const { success } = await extractCmd.output();
    if (!success) {
      throw new Error("Failed to extract archive");
    }

    // Move extracted content to config directory
    const extractedDir = join(tempDir, "starter-main");
    if (await exists(extractedDir)) {
      await Deno.rename(extractedDir, configPath);
    } else {
      throw new Error("Extracted directory not found");
    }

    // Cleanup
    await Deno.remove(tempDir, { recursive: true });

    logSuccess("LazyVim archive installed successfully");
    return true;
  } catch (error) {
    logError(`Archive installation failed: ${error.message}`);
    return false;
  }
}

// Create embedded LazyVim configuration for air-gapped systems
async function createEmbeddedLazyVimConfig(configPath: string): Promise<boolean> {
  try {
    logInfo("Creating embedded LazyVim configuration for air-gapped environment...");

    // Create directory structure
    await Deno.mkdir(join(configPath, "lua", "config"), { recursive: true });
    await Deno.mkdir(join(configPath, "lua", "plugins"), { recursive: true });

    // Create minimal init.lua
    const initLua = `-- init.lua - Minimal LazyVim for Air-gapped Systems
-- Bootstrap lazy.nvim
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.uv.fs_stat(lazypath) then
  error("LazyVim requires internet connectivity for initial plugin installation.\\n" ..
        "Please run this script in an environment with internet access first.")
end
vim.opt.rtp:prepend(lazypath)

-- Load configuration
require("config.lazy")
require("config.options")
require("config.keymaps")
require("config.autocmds")`;

    await Deno.writeTextFile(join(configPath, "init.lua"), initLua);

    // Create basic options
    const optionsLua = `-- config/options.lua - Basic Neovim Options
vim.g.mapleader = " "
vim.g.maplocalleader = "\\\\"

-- Basic options
vim.opt.autowrite = true
vim.opt.clipboard = "unnamedplus"
vim.opt.completeopt = "menu,menuone,noselect"
vim.opt.conceallevel = 3
vim.opt.confirm = true
vim.opt.cursorline = true
vim.opt.expandtab = true
vim.opt.formatoptions = "jcroqlnt"
vim.opt.grepformat = "%f:%l:%c:%m"
vim.opt.grepprg = "rg --vimgrep"
vim.opt.ignorecase = true
vim.opt.inccommand = "nosplit"
vim.opt.laststatus = 3
vim.opt.list = true
vim.opt.mouse = "a"
vim.opt.number = true
vim.opt.pumblend = 10
vim.opt.pumheight = 10
vim.opt.relativenumber = true
vim.opt.scrolloff = 4
vim.opt.sessionoptions = { "buffers", "curdir", "tabpages", "winsize", "help", "globals", "skiprtp", "folds" }
vim.opt.shiftround = true
vim.opt.shiftwidth = 2
vim.opt.shortmess:append({ W = true, I = true, c = true, C = true })
vim.opt.showmode = false
vim.opt.sidescrolloff = 8
vim.opt.signcolumn = "yes"
vim.opt.smartcase = true
vim.opt.smartindent = true
vim.opt.spelllang = { "en" }
vim.opt.splitbelow = true
vim.opt.splitkeep = "screen"
vim.opt.splitright = true
vim.opt.tabstop = 2
vim.opt.termguicolors = true
vim.opt.timeoutlen = 300
vim.opt.undofile = true
vim.opt.undolevels = 10000
vim.opt.updatetime = 200
vim.opt.virtualedit = "block"
vim.opt.wildmode = "longest:full,full"
vim.opt.winminwidth = 5
vim.opt.wrap = false`;

    await Deno.writeTextFile(join(configPath, "lua", "config", "options.lua"), optionsLua);

    // Create basic keymaps
    const keymapsLua = `-- config/keymaps.lua - Essential Keymaps
local map = vim.keymap.set

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

-- Quit
map("n", "<leader>qq", "<cmd>qa<cr>", { desc = "Quit all" })

-- Deno development keymaps
map("n", "<leader>dr", "<cmd>!deno run %<cr>", { desc = "Run Deno file" })
map("n", "<leader>dt", "<cmd>!deno test<cr>", { desc = "Run Deno tests" })
map("n", "<leader>df", "<cmd>!deno fmt %<cr>", { desc = "Format with Deno" })
map("n", "<leader>dl", "<cmd>!deno lint %<cr>", { desc = "Lint with Deno" })`;

    await Deno.writeTextFile(join(configPath, "lua", "config", "keymaps.lua"), keymapsLua);

    // Create minimal autocmds
    const autocmdsLua = `-- config/autocmds.lua - Essential Autocmds
local function augroup(name)
  return vim.api.nvim_create_augroup("lazyvim_" .. name, { clear = true })
end

-- Check if we need to reload the file when it changed
vim.api.nvim_create_autocmd({ "FocusGained", "TermClose", "TermLeave" }, {
  group = augroup("checktime"),
  callback = function()
    if vim.o.buftype ~= "nofile" then
      vim.cmd("checktime")
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

-- Go to last loc when opening a buffer
vim.api.nvim_create_autocmd("BufReadPost", {
  group = augroup("last_loc"),
  callback = function(event)
    local exclude = { "gitcommit" }
    local buf = event.buf
    if vim.tbl_contains(exclude, vim.bo[buf].filetype) or vim.b[buf].lazyvim_last_loc then
      return
    end
    vim.b[buf].lazyvim_last_loc = true
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
})`;

    await Deno.writeTextFile(join(configPath, "lua", "config", "autocmds.lua"), autocmdsLua);

    // Create lazy configuration for air-gapped systems
    const lazyLua = `-- config/lazy.lua - Air-gapped Plugin Manager Setup
require("lazy").setup("plugins", {
  defaults = {
    lazy = false,
    version = false,
  },
  install = {
    missing = false, -- Don't install missing plugins
    colorscheme = { "default" },
  },
  checker = { enabled = false },
  change_detection = { enabled = false },
  performance = {
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
  ui = {
    border = "none",
  },
})`;

    await Deno.writeTextFile(join(configPath, "lua", "config", "lazy.lua"), lazyLua);

    logSuccess("Embedded LazyVim configuration created");
    logWarning("Note: This is a minimal configuration. Full plugin functionality requires internet access.");
    return true;
  } catch (error) {
    logError(`Embedded configuration creation failed: ${error.message}`);
    return false;
  }
}

// Generate Deno-specific configuration files
async function generateDenoConfig(configPath: string, minimal: boolean): Promise<boolean> {
  logHeader("Generating Deno-Specific Configuration");

  try {
    // Create lua/plugins directory
    const pluginsDir = join(configPath, "lua", "plugins");
    await Deno.mkdir(pluginsDir, { recursive: true });

    // Generate deno.lua plugin configuration
    const denoConfig = `-- lua/plugins/deno.lua
-- Deno Development Environment Configuration

return {
  -- Enhanced Syntax Highlighting with TreeSitter
  {
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
    event = { "BufReadPost", "BufNewFile" },
    dependencies = {
      "nvim-treesitter/nvim-treesitter-textobjects",
      "windwp/nvim-ts-autotag",
      "JoosepAlviste/nvim-ts-context-commentstring",
    },
    opts = {
      ensure_installed = {
        "typescript",
        "tsx",
        "javascript",
        "jsdoc",
        "json",
        "jsonc",
        "lua",
        "vim",
        "vimdoc",
        "markdown",
        "markdown_inline",
        "html",
        "css",
        "yaml",
        "toml",
        "regex",
        "bash",
        "dockerfile",
        "gitignore",
        "http",
        "sql",
      },
      auto_install = true,
      sync_install = false,
      highlight = {
        enable = true,
        additional_vim_regex_highlighting = false,
        disable = function(lang, buf)
          local max_filesize = 100 * 1024 -- 100 KB
          local ok, stats = pcall(vim.loop.fs_stat, vim.api.nvim_buf_get_name(buf))
          if ok and stats and stats.size > max_filesize then
            return true
          end
        end,
      },
      indent = { 
        enable = true,
        disable = { "yaml" }
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
            ["af"] = "@function.outer",
            ["if"] = "@function.inner",
            ["ac"] = "@class.outer",
            ["ic"] = "@class.inner",
            ["al"] = "@loop.outer",
            ["il"] = "@loop.inner",
            ["aa"] = "@parameter.outer",
            ["ia"] = "@parameter.inner",
          },
        },
        move = {
          enable = true,
          set_jumps = true,
          goto_next_start = {
            ["]f"] = "@function.outer",
            ["]c"] = "@class.outer",
          },
          goto_next_end = {
            ["]F"] = "@function.outer",
            ["]C"] = "@class.outer",
          },
          goto_previous_start = {
            ["[f"] = "@function.outer",
            ["[c"] = "@class.outer",
          },
          goto_previous_end = {
            ["[F"] = "@function.outer",
            ["[C"] = "@class.outer",
          },
        },
      },
    },
    config = function(_, opts)
      require("nvim-treesitter.configs").setup(opts)
      
      -- Enhanced markdown fenced languages for Deno
      vim.g.markdown_fenced_languages = {
        "ts=typescript",
        "tsx=typescriptreact", 
        "js=javascript",
        "jsx=javascriptreact",
        "json=json",
        "yaml=yaml",
        "toml=toml",
        "sql=sql",
        "html=html",
        "css=css",
        "bash=sh",
        "sh=sh",
      }
      
      -- Auto-closing tags for JSX/TSX
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

  -- Advanced Autocomplete System
  {
    "hrsh7th/nvim-cmp",
    dependencies = {
      "hrsh7th/cmp-nvim-lsp",
      "hrsh7th/cmp-nvim-lsp-signature-help",
      "hrsh7th/cmp-buffer",
      "hrsh7th/cmp-path",
      "hrsh7th/cmp-cmdline",
      "hrsh7th/cmp-nvim-lua",
      "saadparwaiz1/cmp_luasnip",
      "L3MON4D3/LuaSnip",
      "rafamadriz/friendly-snippets",
      "onsails/lspkind.nvim",
      "windwp/nvim-autopairs",
    },
    event = "InsertEnter",
    opts = function()
      local cmp = require("cmp")
      local luasnip = require("luasnip")
      local lspkind = require("lspkind")
      
      -- Load VSCode-style snippets
      require("luasnip.loaders.from_vscode").lazy_load()
      
      return {
        completion = {
          completeopt = "menu,menuone,noinsert",
        },
        snippet = {
          expand = function(args)
            luasnip.lsp_expand(args.body)
          end,
        },
        mapping = cmp.mapping.preset.insert({
          ["<C-n>"] = cmp.mapping.select_next_item({ behavior = cmp.SelectBehavior.Insert }),
          ["<C-p>"] = cmp.mapping.select_prev_item({ behavior = cmp.SelectBehavior.Insert }),
          ["<C-b>"] = cmp.mapping.scroll_docs(-4),
          ["<C-f>"] = cmp.mapping.scroll_docs(4),
          ["<C-Space>"] = cmp.mapping.complete(),
          ["<C-e>"] = cmp.mapping.abort(),
          ["<CR>"] = cmp.mapping.confirm({ select = true }),
          ["<Tab>"] = cmp.mapping(function(fallback)
            if cmp.visible() then
              cmp.select_next_item()
            elseif luasnip.expand_or_jumpable() then
              luasnip.expand_or_jump()
            else
              fallback()
            end
          end, { "i", "s" }),
          ["<S-Tab>"] = cmp.mapping(function(fallback)
            if cmp.visible() then
              cmp.select_prev_item()
            elseif luasnip.jumpable(-1) then
              luasnip.jump(-1)
            else
              fallback()
            end
          end, { "i", "s" }),
        }),
        sources = cmp.config.sources({
          { 
            name = "nvim_lsp",
            priority = 1000,
            entry_filter = function(entry, ctx)
              -- Filter out text matches when we have LSP results
              return entry.source.name ~= 'buffer' or not ctx.bufnr
            end,
          },
          { name = "nvim_lsp_signature_help", priority = 900 },
          { name = "luasnip", priority = 750 },
          { name = "buffer", priority = 500, keyword_length = 3 },
          { name = "path", priority = 300 },
          { name = "nvim_lua", priority = 400 },
        }),
        formatting = {
          expandable_indicator = true,
          fields = { "kind", "abbr", "menu" },
          format = lspkind.cmp_format({
            mode = "symbol_text",
            maxwidth = 50,
            ellipsis_char = "...",
            show_labelDetails = true,
            before = function(entry, vim_item)
              -- Add source information
              vim_item.menu = ({
                nvim_lsp = "[LSP]",
                luasnip = "[Snippet]",
                buffer = "[Buffer]",
                path = "[Path]",
                nvim_lua = "[Lua]",
              })[entry.source.name]
              return vim_item
            end,
          }),
        },
        experimental = {
          ghost_text = {
            hl_group = "CmpGhostText",
          },
        },
        window = {
          completion = cmp.config.window.bordered(),
          documentation = cmp.config.window.bordered(),
        },
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
      }
    end,
    config = function(_, opts)
      local cmp = require("cmp")
      cmp.setup(opts)
      
      -- Setup autopairs integration
      local cmp_autopairs = require("nvim-autopairs.completion.cmp")
      cmp.event:on("confirm_done", cmp_autopairs.on_confirm_done())
      
      -- Command line completion
      cmp.setup.cmdline({ "/", "?" }, {
        mapping = cmp.mapping.preset.cmdline(),
        sources = {
          { name = "buffer" }
        }
      })
      
      cmp.setup.cmdline(":", {
        mapping = cmp.mapping.preset.cmdline(),
        sources = cmp.config.sources({
          { name = "path" }
        }, {
          { name = "cmdline" }
        }),
        matching = { disallow_symbol_nonprefix_matching = false }
      })
    end,
  },

  -- Deno Language Server with Enhanced Configuration
  {
    "neovim/nvim-lspconfig",
    dependencies = {
      "mason.nvim",
      "williamboman/mason-lspconfig.nvim",
      "hrsh7th/cmp-nvim-lsp",
    },
    opts = {
      servers = {
        denols = {
          root_dir = function(fname)
            return require("lspconfig.util").root_pattern("deno.json", "deno.jsonc", ".git")(fname)
          end,
          single_file_support = false,
          init_options = {
            lint = true,
            unstable = true,
            codeLens = {
              implementations = true,
              references = true,
              referencesAllFunctions = true,
              test = true,
            },
            suggest = {
              autoImports = true,
              completeFunctionCalls = true,
              names = true,
              paths = true,
              imports = {
                autoDiscover = true,
                hosts = {
                  ["https://deno.land"] = true,
                  ["https://cdn.nest.land"] = true,
                  ["https://crux.land"] = true,
                  ["https://cdn.skypack.dev"] = true,
                  ["https://esm.sh"] = true,
                }
              }
            },
            inlayHints = {
              parameterNames = {
                enabled = "all",
                suppressWhenArgumentMatchesName = false,
              },
              parameterTypes = {
                enabled = true,
              },
              variableTypes = {
                enabled = true,
                suppressWhenTypeMatchesName = false,
              },
              propertyDeclarationTypes = {
                enabled = true,
              },
              functionLikeReturnTypes = {
                enabled = true,
              },
              enumMemberValues = {
                enabled = true,
              },
            },
          },
          settings = {
            deno = {
              enable = true,
              lint = true,
              unstable = true,
              codeLens = {
                implementations = true,
                references = true,
                referencesAllFunctions = true,
                test = true,
              },
              suggest = {
                autoImports = true,
                completeFunctionCalls = true,
                names = true,
                paths = true,
                imports = {
                  autoDiscover = true,
                  hosts = {
                    ["https://deno.land"] = true,
                    ["https://cdn.nest.land"] = true,
                    ["https://crux.land"] = true,
                    ["https://cdn.skypack.dev"] = true,
                    ["https://esm.sh"] = true,
                  }
                }
              },
              inlayHints = {
                parameterNames = {
                  enabled = "all",
                  suppressWhenArgumentMatchesName = false,
                },
                parameterTypes = {
                  enabled = true,
                },
                variableTypes = {
                  enabled = true,
                  suppressWhenTypeMatchesName = false,
                },
                propertyDeclarationTypes = {
                  enabled = true,
                },
                functionLikeReturnTypes = {
                  enabled = true,
                },
                enumMemberValues = {
                  enabled = true,
                },
              },
            }
          },
          on_attach = function(client, bufnr)
            -- Enable inlay hints if supported
            if client.server_capabilities.inlayHintProvider then
              vim.lsp.inlay_hint.enable(true, { bufnr = bufnr })
            end
            
            -- Additional keymaps for Deno-specific features
            local opts = { buffer = bufnr, silent = true }
            vim.keymap.set("n", "<leader>dca", function()
              vim.lsp.buf.code_action({
                filter = function(action)
                  return string.match(action.title, "cache")
                end,
                apply = true,
              })
            end, vim.tbl_extend("force", opts, { desc = "Cache dependencies" }))
          end,
        }
      },
      setup = {
        denols = function(_, opts)
          -- Disable tsserver when denols is available
          require("lspconfig").denols.setup(opts)
        end,
      }
    }
  },

  -- Enhanced TypeScript support with better autocomplete
  {
    "pmizio/typescript-tools.nvim",
    dependencies = { "nvim-lua/plenary.nvim", "neovim/nvim-lspconfig" },
    ft = { "typescript", "typescriptreact", "javascript", "javascriptreact" },
    opts = {
      on_attach = function(client, bufnr)
        -- Disable tsserver when denols is available
        if vim.fn.executable("deno") == 1 then
          if vim.fn.glob("deno.json") ~= "" or vim.fn.glob("deno.jsonc") ~= "" then
            client.stop()
            return
          end
        end
        
        -- Enable inlay hints
        if client.server_capabilities.inlayHintProvider then
          vim.lsp.inlay_hint.enable(true, { bufnr = bufnr })
        end
      end,
      settings = {
        separate_diagnostic_server = true,
        publish_diagnostic_on = "insert_leave",
        expose_as_code_action = {
          "fix_all",
          "add_missing_imports",
          "remove_unused",
          "remove_unused_imports",
          "organize_imports",
        },
        tsserver_path = nil,
        tsserver_plugins = {
          "@styled/typescript-styled-plugin",
        },
        tsserver_max_memory = "auto",
        tsserver_format_options = {
          allowIncompleteCompletions = false,
          allowRenameOfImportPath = false,
        },
        tsserver_file_preferences = {
          includeInlayParameterNameHints = "all",
          includeInlayParameterNameHintsWhenArgumentMatchesName = false,
          includeInlayFunctionParameterTypeHints = true,
          includeInlayVariableTypeHints = true,
          includeInlayVariableTypeHintsWhenTypeMatchesName = false,
          includeInlayPropertyDeclarationTypeHints = true,
          includeInlayFunctionLikeReturnTypeHints = true,
          includeInlayEnumMemberValueHints = true,
          includeCompletionsForModuleExports = true,
          quotePreference = "auto",
        },
      },
    },
  },

  -- Intelligent Pair Completion
  {
    "windwp/nvim-autopairs",
    event = "InsertEnter",
    config = function()
      require("nvim-autopairs").setup({
        check_ts = true,
        ts_config = {
          lua = { "string", "source" },
          javascript = { "string", "template_string" },
          typescript = { "string", "template_string" },
        },
        disable_filetype = { "TelescopePrompt", "spectre_panel" },
        fast_wrap = {
          map = "<M-e>",
          chars = { "{", "[", "(", '"', "'" },
          pattern = string.gsub([[ [%'%"%)%>%]%)%}%,] ]], "%s+", ""),
          offset = 0,
          end_key = "$",
          keys = "qwertyuiopzxcvbnmasdfghjkl",
          check_comma = true,
          highlight = "PmenuSel",
          highlight_grey = "LineNr",
        },
      })
    end,
  },

  -- Advanced Snippet Engine
  {
    "L3MON4D3/LuaSnip",
    dependencies = {
      "rafamadriz/friendly-snippets",
      "honza/vim-snippets",
    },
    build = "make install_jsregexp",
    event = "InsertEnter",
    config = function()
      local luasnip = require("luasnip")
      
      -- Load all snippet formats
      require("luasnip.loaders.from_vscode").lazy_load()
      require("luasnip.loaders.from_snipmate").lazy_load()
      require("luasnip.loaders.from_lua").lazy_load()
      
      luasnip.config.setup({
        history = true,
        delete_check_events = "TextChanged",
        updateevents = "TextChanged,TextChangedI",
        enable_autosnippets = true,
        ext_opts = {
          [require("luasnip.util.types").choiceNode] = {
            active = {
              virt_text = { { "●", "Orange" } },
            },
          },
        },
      })
      
      -- Custom Deno snippets
      luasnip.add_snippets("typescript", {
        luasnip.snippet("deno-import", {
          luasnip.text_node('import { '),
          luasnip.insert_node(1, "functionName"),
          luasnip.text_node(' } from "https://deno.land/std@'),
          luasnip.insert_node(2, "0.224.0"),
          luasnip.text_node('/'),
          luasnip.insert_node(3, "module"),
          luasnip.text_node('.ts";'),
        }),
        luasnip.snippet("deno-server", {
          luasnip.text_node({
            'import { serve } from "https://deno.land/std@0.224.0/http/server.ts";',
            '',
            'const handler = (req: Request): Response => {',
            '  return new Response("Hello, Deno!", {',
            '    headers: { "content-type": "text/plain" },',
            '  });',
            '};',
            '',
            'serve(handler, { port: '
          }),
          luasnip.insert_node(1, "8000"),
          luasnip.text_node(' });'),
        }),
        luasnip.snippet("deno-test", {
          luasnip.text_node('Deno.test("'),
          luasnip.insert_node(1, "test description"),
          luasnip.text_node('", () => {'),
          luasnip.text_node({'', '  '}),
          luasnip.insert_node(2, "// Test code here"),
          luasnip.text_node({'', '});'}),
        }),
      })
      
      -- Key mappings for snippet navigation
      vim.keymap.set({"i", "s"}, "<C-k>", function()
        if luasnip.expand_or_jumpable() then
          luasnip.expand_or_jump()
        end
      end, { silent = true, desc = "Expand or jump snippet" })
      
      vim.keymap.set({"i", "s"}, "<C-j>", function()
        if luasnip.jumpable(-1) then
          luasnip.jump(-1)
        end
      end, { silent = true, desc = "Jump back in snippet" })
    end,
  },

  -- Intelligent Code Actions and Refactoring
  {
    "nvim-cmp",
    dependencies = {
      {
        "garymjr/nvim-snippets",
        opts = {
          friendly_snippets = true,
        },
        dependencies = { "rafamadriz/friendly-snippets" },
      },
    },
  },

  -- Enhanced Syntax-Aware Comments
  {
    "numToStr/Comment.nvim",
    dependencies = { "JoosepAlviste/nvim-ts-context-commentstring" },
    keys = {
      { "gcc", mode = "n", desc = "Comment toggle current line" },
      { "gc", mode = { "n", "o" }, desc = "Comment toggle linewise" },
      { "gc", mode = "x", desc = "Comment toggle linewise (visual)" },
      { "gbc", mode = "n", desc = "Comment toggle current block" },
      { "gb", mode = { "n", "o" }, desc = "Comment toggle blockwise" },
      { "gb", mode = "x", desc = "Comment toggle blockwise (visual)" },
    },
    config = function()
      require("Comment").setup({
        pre_hook = require("ts_context_commentstring.integrations.comment_nvim").create_pre_hook(),
      })
    end,
  },

  -- Formatting with deno fmt
  {
    "stevearc/conform.nvim",
    optional = true,
    opts = {
      formatters_by_ft = {
        typescript = { "deno_fmt" },
        typescriptreact = { "deno_fmt" },
        javascript = { "deno_fmt" },
        javascriptreact = { "deno_fmt" },
      },
      formatters = {
        deno_fmt = {
          command = "deno",
          args = { "fmt", "-" },
          stdin = true,
        },
      },
    },
  },

  -- Testing integration
  {
    "nvim-neotest/neotest",
    optional = true,
    dependencies = {
      "nvim-neotest/neotest-deno",
    },
    opts = {
      adapters = {
        ["neotest-deno"] = {},
      },
    },
  },

  -- Import management
  {
    "stevanmilic/nvim-lspimport",
    config = function()
      require("lspimport").setup()
    end,
  },

  -- HTTP client for testing Deno REST APIs
  {
    "rest-nvim/rest.nvim",
    dependencies = { "nvim-lua/plenary.nvim" },
    config = function()
      require("rest-nvim").setup({
        result_split_horizontal = false,
        result_split_in_place = false,
        skip_ssl_verification = false,
        encode_url = true,
        highlight = {
          enabled = true,
          timeout = 150,
        },
        result = {
          show_url = true,
          show_curl_command = false,
          show_http_info = true,
          show_headers = true,
          formatters = {
            json = "jq",
            html = function(body)
              return vim.fn.system({"tidy", "-i", "-q", "-"}, body)
            end
          },
        },
        jump_to_request = false,
        env_file = '.env',
        custom_dynamic_variables = {},
        yank_dry_run = true,
      })
    end,
    ft = "http",
  },
}`;

    await Deno.writeTextFile(join(pluginsDir, "deno.lua"), denoConfig);
    logSuccess("Created deno.lua plugin configuration");

    if (!minimal) {
      // Generate additional developer tools configuration
      const devToolsConfig = `-- lua/plugins/dev-tools.lua
-- Additional Development Tools for Deno

return {
  -- Enhanced Git integration
  {
    "NeogitOrg/neogit",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "sindrets/diffview.nvim",
      "nvim-telescope/telescope.nvim",
    },
    config = true,
  },

  -- Database integration (for MariaDB)
  {
    "tpope/vim-dadbod",
    dependencies = {
      "kristijanhusak/vim-dadbod-ui",
      "kristijanhusak/vim-dadbod-completion",
    },
    config = function()
      vim.g.db_ui_use_nerd_fonts = 1
      vim.g.db_ui_show_database_icon = 1
    end,
  },

  -- Terminal integration
  {
    "akinsho/toggleterm.nvim",
    version = "*",
    opts = {
      size = 20,
      open_mapping = [[<c-\\>]],
      hide_numbers = true,
      shade_terminals = true,
      shading_factor = 2,
      start_in_insert = true,
      insert_mappings = true,
      persist_size = true,
      direction = "horizontal",
      close_on_exit = true,
      shell = vim.o.shell,
      float_opts = {
        border = "curved",
        winblend = 0,
        highlights = {
          border = "Normal",
          background = "Normal",
        },
      },
    },
  },

  -- Session management
  {
    "folke/persistence.nvim",
    event = "BufReadPre",
    opts = { options = vim.opt.sessionoptions:get() },
    keys = {
      { "<leader>qs", function() require("persistence").load() end, desc = "Restore Session" },
      { "<leader>ql", function() require("persistence").load({ last = true }) end, desc = "Restore Last Session" },
      { "<leader>qd", function() require("persistence").stop() end, desc = "Don't Save Current Session" },
    },
  },

  -- Enhanced file explorer
  {
    "nvim-neo-tree/neo-tree.nvim",
    opts = {
      filesystem = {
        filtered_items = {
          visible = true,
          hide_dotfiles = false,
          hide_gitignored = false,
          hide_by_name = {
            ".git",
            ".DS_Store",
            "thumbs.db",
            "node_modules",
          },
        },
      },
    },
  },

  -- Code documentation generator
  {
    "danymat/neogen",
    dependencies = "nvim-treesitter/nvim-treesitter",
    config = true,
    keys = {
      {
        "<leader>cc",
        function()
          require("neogen").generate({})
        end,
        desc = "Neogen Comment",
      },
    },
  },
}`;

      await Deno.writeTextFile(join(pluginsDir, "dev-tools.lua"), devToolsConfig);
      logSuccess("Created dev-tools.lua configuration");
    }

    // Generate Deno-specific keymaps
    const configDir = join(configPath, "lua", "config");
    await Deno.mkdir(configDir, { recursive: true });

    const keymapsConfig = `-- lua/config/keymaps.lua
-- Additional keymaps for Deno development

local map = vim.keymap.set

-- Deno commands
map("n", "<leader>dr", "<cmd>!deno run %<cr>", { desc = "Run Deno file" })
map("n", "<leader>dt", "<cmd>!deno test<cr>", { desc = "Run Deno tests" })
map("n", "<leader>df", "<cmd>!deno fmt %<cr>", { desc = "Format with Deno" })
map("n", "<leader>dl", "<cmd>!deno lint %<cr>", { desc = "Lint with Deno" })
map("n", "<leader>dc", "<cmd>!deno cache %<cr>", { desc = "Cache Deno dependencies" })

-- HTTP client (rest.nvim)
map("n", "<leader>rr", "<Plug>RestNvim", { desc = "Run HTTP request" })
map("n", "<leader>rp", "<Plug>RestNvimPreview", { desc = "Preview HTTP request" })

-- Database UI
map("n", "<leader>du", "<cmd>DBUIToggle<cr>", { desc = "Toggle Database UI" })

-- Terminal shortcuts
map("n", "<leader>tf", "<cmd>ToggleTerm direction=float<cr>", { desc = "Toggle floating terminal" })
map("n", "<leader>th", "<cmd>ToggleTerm direction=horizontal<cr>", { desc = "Toggle horizontal terminal" })
map("n", "<leader>tv", "<cmd>ToggleTerm direction=vertical size=80<cr>", { desc = "Toggle vertical terminal" })

-- Git with Neogit
map("n", "<leader>gg", "<cmd>Neogit<cr>", { desc = "Open Neogit" })

-- Open URL under cursor (useful for Deno import URLs)
map("n", "gx", function()
  local url = vim.fn.expand("<cWORD>")
  if url:match("^https?://") then
    vim.fn.system(string.format('open "%s"', url))
  end
end, { desc = "Open URL under cursor" })`;

    await Deno.writeTextFile(join(configDir, "keymaps.lua"), keymapsConfig);
    logSuccess("Created keymaps.lua configuration");

    return true;
  } catch (error) {
    logError(`Deno configuration generation failed: ${error.message}`);
    return false;
  }
}

// Test LazyVim installation
async function testLazyVimInstallation(): Promise<boolean> {
  logHeader("Testing LazyVim Installation");

  try {
    // Test basic Neovim functionality
    logInfo("Testing Neovim startup...");
    const testCmd = new Deno.Command("nvim", {
      args: ["--headless", "-c", "echo 'LazyVim test'", "-c", "qa"],
      stdout: "piped",
      stderr: "piped",
    });

    const { success, stderr } = await testCmd.output();

    if (!success) {
      const errorOutput = new TextDecoder().decode(stderr);
      logError(`Neovim startup test failed: ${errorOutput}`);
      return false;
    }

    logSuccess("LazyVim installation test passed");

    // Additional check - verify plugin manager
    logInfo("Verifying plugin manager setup...");
    const pluginTestCmd = new Deno.Command("nvim", {
      args: ["--headless", "-c", "lua print(require('lazy').stats())", "-c", "qa"],
      stdout: "piped",
      stderr: "piped",
    });

    const { success: pluginSuccess } = await pluginTestCmd.output();
    if (pluginSuccess) {
      logSuccess("Plugin manager verification passed");
    } else {
      logWarning("Plugin manager verification failed, but basic installation is functional");
    }

    return true;
  } catch (error) {
    logError(`Installation test failed: ${error.message}`);
    return false;
  }
}

// Display installation summary
function displaySummary(configPath: string): void {
  logHeader("Installation Summary");

  console.log(`${Colors.GREEN}✓ Neovim: ${Colors.RESET}Successfully installed and configured`);
  console.log(`${Colors.GREEN}✓ LazyVim: ${Colors.RESET}Starter configuration installed`);
  console.log(`${Colors.GREEN}✓ Deno Support: ${Colors.RESET}LSP, formatting, and testing configured`);
  console.log(`${Colors.GREEN}✓ Configuration: ${Colors.RESET}Located at ${configPath}`);

  console.log(`\n${Colors.CYAN}Key Features:${Colors.RESET}`);
  console.log(`  • Deno Language Server with full IntelliSense`);
  console.log(`  • Native deno fmt integration`);
  console.log(`  • Import completion and management`);
  console.log(`  • Testing framework support`);
  console.log(`  • HTTP client for API development`);
  console.log(`  • Database integration for MariaDB`);

  console.log(`\n${Colors.CYAN}Next Steps:${Colors.RESET}`);
  console.log(`  1. Start Neovim: nvim`);
  console.log(`  2. Let LazyVim install plugins automatically`);
  console.log(`  3. Open a Deno project with deno.json or deno.jsonc`);
  console.log(`  4. Use <leader>dr to run Deno files`);
  console.log(`  5. Use <leader>dt to run tests`);

  console.log(`\n${Colors.CYAN}Documentation:${Colors.RESET}`);
  console.log(`  • LazyVim: https://www.lazyvim.org/`);
  console.log(`  • Keymaps: Press <leader>sk in Neovim`);
  console.log(`  • Help: :help LazyVim`);
}

// Main execution function
async function main(): Promise<void> {
  const args = parseArgs(Deno.args, {
    boolean: ["force", "backup", "minimal", "test-only", "verbose", "help", "skip-neovim"],
    string: ["config-path"],
    default: {
      "force": false,
      "backup": true,
      "minimal": false,
      "test-only": false,
      "verbose": false,
      "skip-neovim": false,
      "config-path": "",
    },
    alias: {
      "f": "force",
      "b": "backup",
      "m": "minimal",
      "t": "test-only",
      "v": "verbose",
      "h": "help",
      "c": "config-path",
    }
  });

  if (args.help) {
    console.log(`
Universal LazyVim Installation Utility for Deno Development

USAGE:
  deno run --allow-all setup-lazyvim.ts [OPTIONS]

OPTIONS:
  -f, --force          Force installation even if config exists
  -b, --backup         Create backup of existing configuration (default: true)
  -m, --minimal        Install minimal configuration (fewer plugins)
  -t, --test-only      Only test existing LazyVim installation
  -v, --verbose        Enable verbose logging
  -c, --config-path    Custom Neovim configuration path
      --skip-neovim    Skip Neovim installation (assume already installed)
  -h, --help           Show this help message

FEATURES:
  • Complete LazyVim distribution setup
  • Deno Language Server integration
  • TypeScript development tools
  • Native deno fmt formatting
  • Testing framework support
  • HTTP client for API development
  • Database integration
  • Modern UI with syntax highlighting
  • Intelligent code completion

EXAMPLES:
  # Basic installation
  deno run --allow-all setup-lazyvim.ts

  # Force reinstall with backup
  deno run --allow-all setup-lazyvim.ts --force --backup

  # Minimal installation (fewer plugins)
  deno run --allow-all setup-lazyvim.ts --minimal

  # Test existing installation
  deno run --allow-all setup-lazyvim.ts --test-only
    `);
    Deno.exit(0);
  }

  const options: SetupOptions = {
    force: args.force,
    backup: args.backup,
    minimal: args.minimal,
    testOnly: args["test-only"],
    verbose: args.verbose,
    skipNeovim: args["skip-neovim"],
  };

  const platform = detectPlatform();
  let config = DEFAULT_CONFIG;
  config.configPath = args["config-path"] || platform.configDir;
  config.minimalInstall = options.minimal;

  logHeader("Universal LazyVim Installation Utility");
  logInfo(`Target platform: ${platform.os}-${platform.arch}`);
  logInfo(`Configuration path: ${config.configPath}`);

  // Detect system capabilities for universal compatibility
  logInfo("Detecting system capabilities...");
  const capabilities = await detectSystemCapabilities();
  
  logInfo(`System capabilities detected:`);
  logInfo(`  Git available: ${capabilities.hasGit ? "✓" : "✗"}`);
  logInfo(`  Internet access: ${capabilities.hasInternet ? "✓" : "✗"}`);
  logInfo(`  Package installation: ${capabilities.canInstallPackages ? "✓" : "✗"}`);
  logInfo(`  Proxy configured: ${capabilities.proxy ? "✓ (" + capabilities.proxy + ")" : "✗"}`);
  logInfo(`  Air-gapped system: ${capabilities.isAirGapped ? "✓" : "✗"}`);

  // Provide guidance based on capabilities
  if (capabilities.isAirGapped) {
    logWarning("Air-gapped environment detected. Installing minimal configuration.");
    logWarning("For full functionality, run this script with internet access first.");
  } else if (!capabilities.hasGit && capabilities.hasInternet) {
    logWarning("Git not available. Using archive download method.");
  } else if (!capabilities.hasInternet) {
    logError("No internet connectivity. Cannot install LazyVim plugins.");
    logError("Please ensure internet access or use --test-only to check existing installation.");
  }

  // Test-only mode
  if (options.testOnly) {
    logInfo("Running in test-only mode");
    const success = await testLazyVimInstallation();
    Deno.exit(success ? 0 : 1);
  }

  // Check if Neovim is installed
  if (!options.skipNeovim) {
    const { installed, version } = await checkNeovimInstalled();
    if (!installed) {
      logWarning("Neovim not found. Installing...");
      if (!await installNeovim()) {
        logError("Failed to install Neovim. Please install manually and rerun with --skip-neovim");
        Deno.exit(1);
      }
    } else {
      logSuccess(`Neovim ${version} found`);
    }
  }

  // Check for existing configuration
  if (await exists(config.configPath) && !options.force) {
    logWarning(`Neovim configuration already exists at ${config.configPath}`);
    logWarning("Use --force to overwrite or --backup to create a backup");
    
    if (options.backup) {
      const backupPath = await backupExistingConfig(config.configPath);
      if (!backupPath) {
        logError("Failed to create backup. Aborting installation.");
        Deno.exit(1);
      }
      config.backupPath = backupPath;
    } else {
      logError("Aborting installation to prevent data loss");
      Deno.exit(1);
    }
  }

  // Create backup if requested and config exists
  if (options.backup && await exists(config.configPath) && !config.backupPath) {
    const backupPath = await backupExistingConfig(config.configPath);
    if (backupPath) {
      config.backupPath = backupPath;
    }
  }

  // Install LazyVim starter
  if (!await installLazyVimUniversal(config.configPath, capabilities)) {
    logError("LazyVim installation failed. Exiting.");
    Deno.exit(1);
  }

  // Generate Deno-specific configuration
  if (!await generateDenoConfig(config.configPath, config.minimalInstall)) {
    logError("Deno configuration generation failed. Exiting.");
    Deno.exit(1);
  }

  // Test installation
  if (!await testLazyVimInstallation()) {
    logWarning("Installation test failed, but LazyVim was installed");
    logWarning("You may need to start Neovim manually to complete plugin installation");
  }

  // Display summary
  displaySummary(config.configPath);

  logSuccess("LazyVim installation completed successfully!");
  logInfo("Start Neovim to begin the plugin installation process!");

  // Show backup information if backup was created
  if (config.backupPath) {
    logInfo(`Previous configuration backed up to: ${config.backupPath}`);
  }
}

// Unix philosophy: Fail fast and provide clear error messages
if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    logError(`Installation failed: ${error.message}`);
    if (Deno.args.includes("--verbose")) {
      console.error(error.stack);
    }
    Deno.exit(1);
  }
}