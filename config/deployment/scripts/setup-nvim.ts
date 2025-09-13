// =============================================================================
// UNIX PRINCIPLE: AVOID CAPTIVE USER INTERFACES - MAIN EXECUTION
// =============================================================================

/**
 * Backup existing configuration if it exists
 */
async function backupExistingConfig(configPath: string): Promise<string | undefined> {
  try {
    const stat = await Deno.stat(configPath);
    if (stat.isDirectory) {
      const backupPath = `${configPath}.backup.${Date.now()}`;
      await Deno.rename(configPath, backupPath);
      return backupPath;
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
  return undefined;
}

/**
 * Create directory structure for Neovim configuration
 */
async function createDirectoryStructure(configPath: string): Promise<void> {
  const directories = [
    configPath,
    `${configPath}/lua`,
    `${configPath}/lua/config`,
    `${configPath}/lua/plugins`,
    `${configPath}/undo`,
  ];

  for (const dir of directories) {
    await Deno.mkdir(dir, { recursive: true });
  }
}

/**
 * Write file operations to disk
 */
async function executeFileOperations(operations: FileOperation[]): Promise<string[]> {
  const createdFiles: string[] = [];

  for (const operation of operations) {
    // Ensure directory exists
    const dir = operation.path.substring(0, operation.path.lastIndexOf('/'));
    await Deno.mkdir(dir, { recursive: true });

    // Write file
    await Deno.writeTextFile(operation.path, operation.content);

    // Set executable if needed
    if (operation.executable) {
      await Deno.chmod(operation.path, 0o755);
    }

    createdFiles.push(operation.path);
  }

  return createdFiles;
}

/**
 * Check prerequisites for Neovim setup
 */
async function checkPrerequisites(): Promise<{ success: boolean; errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if Neovim is installed
  try {
    const nvimProcess = new Deno.Command("nvim", {
      args: ["--version"],
      stdout: "piped",
      stderr: "piped",
    });
    const nvimResult = await nvimProcess.output();

    if (!nvimResult.success) {
      errors.push("Neovim is not installed or not in PATH");
    } else {
      const version = new TextDecoder().decode(nvimResult.stdout);
      if (!version.includes("NVIM v0.8") && !version.includes("NVIM v0.9") && !version.includes("NVIM v0.10")) {
        warnings.push("Neovim version might be too old. Recommended: 0.8+");
      }
    }
  } catch (error) {
    errors.push(`Failed to check Neovim installation: ${error.message}`);
  }

  // Check if Git is installed (required for plugin manager)
  try {
    const gitProcess = new Deno.Command("git", {
      args: ["--version"],
      stdout: "piped",
      stderr: "piped",
    });
    const gitResult = await gitProcess.output();

    if (!gitResult.success) {
      errors.push("Git is not installed or not in PATH (required for plugin manager)");
    }
  } catch (error) {
    errors.push(`Failed to check Git installation: ${error.message}`);
  }

  // Check if Deno is installed
  try {
    const denoProcess = new Deno.Command("deno", {
      args: ["--version"],
      stdout: "piped",
      stderr: "piped",
    });
    const denoResult = await denoProcess.output();

    if (!denoResult.success) {
      warnings.push("Deno is not installed or not in PATH (LSP features will be limited)");
    }
  } catch (error) {
    warnings.push(`Failed to check Deno installation: ${error.message}`);
  }

  return { success: errors.length === 0, errors, warnings };
}

/**
 * Generate sample deno.json for testing
 */
function generateSampleDenoConfig(): string {
  return `{
  "tasks": {
    "dev": "deno run --watch --allow-all main.ts",
    "start": "deno run --allow-all main.ts",
    "test": "deno test --allow-all",
    "fmt": "deno fmt",
    "lint": "deno lint"
  },
  "imports": {
    "@std/": "https://deno.land/std@0.208.0/"
  },
  "compilerOptions": {
    "allowJs": true,
    "lib": ["deno.window"],
    "strict": true
  },
  "lint": {
    "rules": {
      "tags": ["recommended"]
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
}`;
}

/**
 * Main setup function following Unix Philosophy
 */
async function setupNeovim(config: NvimSetupConfig): Promise<SetupResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let filesCreated: string[] = [];
  let backupPath: string | undefined;

  try {
    // Check prerequisites first
    const prereqCheck = await checkPrerequisites();
    errors.push(...prereqCheck.errors);
    warnings.push(...prereqCheck.warnings);

    if (!prereqCheck.success) {
      return {
        success: false,
        message: "Prerequisites check failed",
        filesCreated: [],
        errors,
        warnings,
      };
    }

    // Backup existing configuration if requested
    if (config.backupExisting) {
      backupPath = await backupExistingConfig(config.configPath);
      if (backupPath) {
        warnings.push(`Existing configuration backed up to: ${backupPath}`);
      }
    }

    // Create directory structure
    await createDirectoryStructure(config.configPath);

    // Generate configuration files
    const operations = generateNvimConfig(config);

    // Execute file operations
    filesCreated = await executeFileOperations(operations);

    // Create sample deno.json if setting up Deno
    if (config.setupDeno) {
      const denoConfigPath = "deno.json";
      try {
        await Deno.stat(denoConfigPath);
        warnings.push("deno.json already exists, skipping creation");
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          await Deno.writeTextFile(denoConfigPath, generateSampleDenoConfig());
          filesCreated.push(denoConfigPath);
        }
      }
    }

    return {
      success: true,
      message: `Neovim configuration successfully created at ${config.configPath}`,
      filesCreated,
      backupPath,
      errors,
      warnings,
    };

  } catch (error) {
    errors.push(`Setup failed: ${error.message}`);
    return {
      success: false,
      message: "Setup failed due to errors",
      filesCreated,
      backupPath,
      errors,
      warnings,
    };
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): NvimSetupConfig {
  const defaultConfig: NvimSetupConfig = {
    configPath: `${Deno.env.get("HOME")}/.config/nvim`,
    backupExisting: true,
    installPlugins: true,
    setupDeno: true,
    theme: 'tokyonight',
    features: {
      lsp: true,
      completion: true,
      treesitter: true,
      telescope: true,
      fileExplorer: true,
      git: true,
    },
  };

  const config = { ...defaultConfig };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--config-path':
        config.configPath = args[++i] || config.configPath;
        break;
      case '--no-backup':
        config.backupExisting = false;
        break;
      case '--no-deno':
        config.setupDeno = false;
        break;
      case '--theme':
        const theme = args[++i];
        if (theme === 'tokyonight' || theme === 'catppuccin' || theme === 'gruvbox') {
          config.theme = theme;
        }
        break;
      case '--minimal':
        config.features = {
          lsp: true,
          completion: true,
          treesitter: false,
          telescope: false,
          fileExplorer: false,
          git: false,
        };
        break;
      case '--help':
      case '-h':
        console.log(`
DenoGenesis Neovim Setup Script

USAGE:
    setup-nvim.ts [OPTIONS]

OPTIONS:
    --config-path <PATH>    Custom config path (default: ~/.config/nvim)
    --no-backup            Don't backup existing configuration
    --no-deno              Don't setup Deno LSP and features
    --theme <THEME>        Color theme: tokyonight, catppuccin, gruvbox
    --minimal              Install only essential features
    --help, -h             Show this help message

EXAMPLES:
    setup-nvim.ts                           # Full setup with defaults
    setup-nvim.ts --minimal --no-deno       # Minimal setup without Deno
    setup-nvim.ts --theme gruvbox           # Setup with Gruvbox theme
    setup-nvim.ts --config-path ~/.nvim     # Custom config location

This script follows Unix Philosophy principles:
- Does one thing well: sets up Neovim for Deno Genesis development
- Returns structured data about the setup process
- Stores configuration as readable text files
`);
        Deno.exit(0);
        break;
    }
  }

  return config;
}

// =============================================================================
// CLI INTERFACE - WHEN RUN DIRECTLY
// =============================================================================

if (import.meta.main) {
  const config = parseArgs(Deno.args);

  console.log("🚀 DenoGenesis Neovim Setup");
  console.log("════════════════════════════");
  console.log(`📁 Config path: ${config.configPath}`);
  console.log(`🎨 Theme: ${config.theme}`);
  console.log(`🦕 Deno setup: ${config.setupDeno ? 'enabled' : 'disabled'}`);
  console.log(`💾 Backup existing: ${config.backupExisting ? 'enabled' : 'disabled'}`);
  console.log("");

  try {
    const result = await setupNeovim(config);

    if (result.success) {
      console.log("✅ Setup completed successfully!");
      console.log(`📝 Message: ${result.message}`);

      if (result.backupPath) {
        console.log(`💾 Backup created: ${result.backupPath}`);
      }

      console.log(`📁 Files created: ${result.filesCreated.length}`);
      for (const file of result.filesCreated) {
        console.log(`   📄 ${file}`);
      }

      if (result.warnings.length > 0) {
        console.log("\n⚠️  Warnings:");
        for (const warning of result.warnings) {
          console.log(`   ⚠️  ${warning}`);
        }
      }

      console.log(`
🎉 Setup Complete! Next steps:

1. Open Neovim: nvim
2. Let plugins install automatically (or run :Lazy sync)
3. Open a TypeScript file in a Deno project
4. Use <Space> to see available keymaps

Key shortcuts:
- <Space>ff: Find files
- <Space>fg: Search text
- <Space>e: Toggle file explorer
- <Space>dr: Run Deno file
- <Space>dt: Run Deno tests

Happy coding with Deno Genesis! 🦕
`);

      Deno.exit(0);
    } else {
      console.error("❌ Setup failed!");
      console.error(`📝 Message: ${result.message}`);

      if (result.errors.length > 0) {
        console.error("\n💥 Errors:");
        for (const error of result.errors) {
          console.error(`   💥 ${error}`);
        }
      }

      if (result.warnings.length > 0) {
        console.error("\n⚠️  Warnings:");
        for (const warning of result.warnings) {
          console.error(`   ⚠️  ${warning}`);
        }
      }

      Deno.exit(1);
    }
  } catch (error) {
    console.error("💥 Fatal error during setup:");
    console.error(error);
    Deno.exit(1);
  }
}

// =============================================================================
// EXPORT FOR PROGRAMMATIC USE
// =============================================================================

export {
  setupNeovim,
  parseArgs,
  generateNvimConfig,
  type NvimSetupConfig,
  type SetupResult,
};

  return `-- =============================================================================
-- DenoGenesis Neovim Configuration - ui.lua
-- =============================================================================
-- Unix Philosophy: Clear interface, minimal but effective

return {
  -- Colorscheme
  {
    'folke/${theme}.nvim',
    priority = 1000,
    init = function()
      vim.cmd.colorscheme '${theme}${theme === 'tokyonight' ? '-night' : ''}'
    end,
    opts = {
      style = "${theme === 'tokyonight' ? 'night' : 'dark'}",
      transparent = false,
      terminal_colors = true,
      styles = {
        comments = { italic = true },
        keywords = { italic = true },
        functions = {},
        variables = {},
      },
      sidebars = { "qf", "help" },
      day_brightness = 0.3,
      hide_inactive_statusline = false,
      dim_inactive = false,
      lualine_bold = false,
    },
  },

  -- Status line
  {
    'nvim-lualine/lualine.nvim',
    dependencies = { 'nvim-tree/nvim-web-devicons' },
    config = function()
      require('lualine').setup {
        options = {
          icons_enabled = true,
          theme = '${theme}',
          component_separators = { left = '|', right = '|' },
          section_separators = { left = '', right = '' },
          disabled_filetypes = {
            statusline = {},
            winbar = {},
          },
          ignore_focus = {},
          always_divide_middle = true,
          globalstatus = true,
          refresh = {
            statusline = 1000,
            tabline = 1000,
            winbar = 1000,
          }
        },
        sections = {
          lualine_a = {'mode'},
          lualine_b = {'branch', 'diff', 'diagnostics'},
          lualine_c = {
            {
              'filename',
              file_status = true,
              newfile_status = false,
              path = 1, -- Show relative path
              shorting_target = 40,
              symbols = {
                modified = '[+]',
                readonly = '[RO]',
                unnamed = '[No Name]',
                newfile = '[New]',
              }
            }
          },
          lualine_x = {
            {
              function()
                if vim.b.deno_enable then
                  return '🦕 Deno'
                end
                return ''
              end,
              color = { fg = '#00ADD8' }
            },
            'encoding',
            'fileformat',
            'filetype'
          },
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
        extensions = {'nvim-tree', 'quickfix', 'man', 'lazy'}
      }
    end,
  },${features.fileExplorer ? `

  -- File explorer
  {
    'nvim-tree/nvim-tree.lua',
    dependencies = { 'nvim-tree/nvim-web-devicons' },
    config = function()
      -- Disable netrw for nvim-tree
      vim.g.loaded_netrw = 1
      vim.g.loaded_netrwPlugin = 1

      require('nvim-tree').setup {
        sort_by = "case_sensitive",
        view = {
          width = 30,
          relativenumber = true,
        },
        renderer = {
          group_empty = true,
          highlight_git = true,
          highlight_opened_files = "name",
          icons = {
            glyphs = {
              default = "",
              symlink = "",
              folder = {
                arrow_closed = "",
                arrow_open = "",
                default = "",
                open = "",
                empty = "",
                empty_open = "",
                symlink = "",
                symlink_open = "",
              },
              git = {
                unstaged = "✗",
                staged = "✓",
                unmerged = "",
                renamed = "➜",
                untracked = "★",
                deleted = "",
                ignored = "◌",
              },
            },
          },
        },
        filters = {
          dotfiles = false,
          custom = {
            "node_modules",
            "\\.cache",
            "__pycache__",
          },
        },
        git = {
          enable = true,
          ignore = false,
          show_on_dirs = true,
          timeout = 400,
        },
        actions = {
          use_system_clipboard = true,
          change_dir = {
            enable = true,
            global = false,
            restrict_above_cwd = false,
          },
          expand_all = {
            max_folder_discovery = 300,
            exclude = {},
          },
          open_file = {
            quit_on_open = false,
            resize_window = true,
            window_picker = {
              enable = true,
              picker = "default",
              chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
              exclude = {
                filetype = { "notify", "packer", "qf", "diff", "fugitive", "fugitiveblame" },
                buftype = { "nofile", "terminal", "help" },
              },
            },
          },
        },
        diagnostics = {
          enable = true,
          show_on_dirs = true,
          debounce_delay = 50,
          icons = {
            hint = "",
            info = "",
            warning = "",
            error = "",
          },
        },
        on_attach = function(bufnr)
          local api = require('nvim-tree.api')

          local function opts(desc)
            return { desc = 'nvim-tree: ' .. desc, buffer = bufnr, noremap = true, silent = true, nowait = true }
          end

          -- Default mappings
          api.config.mappings.default_on_attach(bufnr)

          -- Custom mappings
          vim.keymap.set('n', '<C-t>', api.tree.change_root_to_parent, opts('Up'))
          vim.keymap.set('n', '?', api.tree.toggle_help, opts('Help'))
        end,
      }

      -- Keymaps for nvim-tree
      vim.keymap.set('n', '<leader>e', '<cmd>NvimTreeToggle<CR>',
        { desc = 'Toggle file [E]xplorer', noremap = true, silent = true })
      vim.keymap.set('n', '<leader>ef', '<cmd>NvimTreeFindFileToggle<CR>',
        { desc = 'Toggle file explorer on current [F]ile', noremap = true, silent = true })
      vim.keymap.set('n', '<leader>ec', '<cmd>NvimTreeCollapse<CR>',
        { desc = '[C]ollapse file explorer', noremap = true, silent = true })
      vim.keymap.set('n', '<leader>er', '<cmd>NvimTreeRefresh<CR>',
        { desc = '[R]efresh file explorer', noremap = true, silent = true })
    end,
  },` : ''}

  -- Indent guides
  {
    'lukas-reineke/indent-blankline.nvim',
    main = 'ibl',
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
  },${features.git ? `

  -- Git integration
  {
    'lewis6991/gitsigns.nvim',
    opts = {
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
      attach_to_untracked = false,
      current_line_blame = false,
      current_line_blame_opts = {
        virt_text = true,
        virt_text_pos = 'eol',
        delay = 1000,
        ignore_whitespace = false,
      },
      current_line_blame_formatter = '<author>, <author_time:%Y-%m-%d> - <summary>',
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
        local gs = require('gitsigns')

        local function map(mode, l, r, opts)
          opts = opts or {}
          opts.buffer = bufnr
          vim.keymap.set(mode, l, r, opts)
        end

        -- Navigation
        map('n', ']h', function()
          if vim.wo.diff then return ']c' end
          vim.schedule(function() gs.next_hunk() end)
          return '<Ignore>'
        end, {expr=true, desc="Next git hunk"})

        map('n', '[h', function()
          if vim.wo.diff then return '[c' end
          vim.schedule(function() gs.prev_hunk() end)
          return '<Ignore>'
        end, {expr=true, desc="Previous git hunk"})

        -- Actions
        map('n', '<leader>hs', gs.stage_hunk, {desc="Stage hunk"})
        map('n', '<leader>hr', gs.reset_hunk, {desc="Reset hunk"})
        map('v', '<leader>hs', function() gs.stage_hunk {vim.fn.line('.'), vim.fn.line('v')} end, {desc="Stage hunk"})
        map#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env
/**
 * =============================================================================
 * DenoGenesis Framework - Neovim Setup Script (setup-nvim.ts)
 * =============================================================================
 *
 * Unix Philosophy Implementation:
 * 1. Do One Thing Well: Configure Neovim for Deno TypeScript development ONLY
 * 2. Make Everything a Filter: Accept input configs, transform to nvim setup
 * 3. Avoid Captive User Interfaces: Return structured data about setup process
 * 4. Store Data in Flat Text Files: All configs are readable text files
 * 5. Leverage Software Leverage: Compose with existing nvim plugin ecosystem
 *
 * This script sets up a complete Neovim IDE environment optimized for
 * Deno Genesis development with TypeScript, LSP, completion, and all
 * necessary tooling following Unix Philosophy principles.
 *
 * @module SetupNvim
 * @follows Unix Philosophy: Single responsibility (nvim setup)
 * @permissions --allow-read, --allow-write, --allow-run, --allow-env
 * @version 1.0.0
 * @author AI-Augmented Development
 * @license AGPL-3.0
 * @deno_compatible true
 */

// =============================================================================
// UNIX PRINCIPLE: DO ONE THING WELL - INTERFACES
// =============================================================================

interface NvimSetupConfig {
  readonly configPath: string;
  readonly backupExisting: boolean;
  readonly installPlugins: boolean;
  readonly setupDeno: boolean;
  readonly theme: 'tokyonight' | 'catppuccin' | 'gruvbox';
  readonly features: {
    lsp: boolean;
    completion: boolean;
    treesitter: boolean;
    telescope: boolean;
    fileExplorer: boolean;
    git: boolean;
  };
}

interface SetupResult {
  readonly success: boolean;
  readonly message: string;
  readonly filesCreated: string[];
  readonly backupPath?: string;
  readonly errors: string[];
  readonly warnings: string[];
}

interface FileOperation {
  readonly path: string;
  readonly content: string;
  readonly executable?: boolean;
}

// =============================================================================
// UNIX PRINCIPLE: MAKE EVERYTHING A FILTER - PURE FUNCTIONS
// =============================================================================

/**
 * Generate default Neovim configuration optimized for Deno Genesis
 * Pure function: input config -> output file operations
 */
function generateNvimConfig(config: NvimSetupConfig): FileOperation[] {
  const operations: FileOperation[] = [];

  // Main init.lua
  operations.push({
    path: `${config.configPath}/init.lua`,
    content: generateInitLua(config)
  });

  // Core configuration files
  operations.push({
    path: `${config.configPath}/lua/config/options.lua`,
    content: generateOptionsLua()
  });

  operations.push({
    path: `${config.configPath}/lua/config/lazy.lua`,
    content: generateLazyLua()
  });

  operations.push({
    path: `${config.configPath}/lua/config/keymaps.lua`,
    content: generateKeymapsLua()
  });

  // Plugin configuration files
  if (config.features.lsp) {
    operations.push({
      path: `${config.configPath}/lua/plugins/lsp.lua`,
      content: generateLspLua(config.setupDeno)
    });
  }

  if (config.features.completion) {
    operations.push({
      path: `${config.configPath}/lua/plugins/completion.lua`,
      content: generateCompletionLua()
    });
  }

  if (config.features.treesitter) {
    operations.push({
      path: `${config.configPath}/lua/plugins/treesitter.lua`,
      content: generateTreesitterLua()
    });
  }

  if (config.features.telescope) {
    operations.push({
      path: `${config.configPath}/lua/plugins/telescope.lua`,
      content: generateTelescopeLua()
    });
  }

  operations.push({
    path: `${config.configPath}/lua/plugins/ui.lua`,
    content: generateUiLua(config.theme, config.features)
  });

  return operations;
}

/**
 * Generate main init.lua configuration
 */
function generateInitLua(config: NvimSetupConfig): string {
  return `-- =============================================================================
-- DenoGenesis Neovim Configuration - init.lua
-- =============================================================================
-- Unix Philosophy: Simple, composable, does one thing well
-- Generated by setup-nvim.ts following Deno Genesis principles

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
    local deno_lock = vim.fn.findfile("deno.lock", ".;")

    if deno_config ~= "" or deno_config_c ~= "" or deno_lock ~= "" then
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

-- DenoGenesis specific file type detection
vim.api.nvim_create_autocmd({"BufRead", "BufNewFile"}, {
  group = augroup,
  pattern = {"*/sites/*/main.ts", "*/core/utils/*.ts", "*-config.ts"},
  callback = function()
    vim.b.deno_enable = true
    vim.b.deno_genesis_project = true

    -- Set buffer-local keymaps for Deno Genesis
    local opts = { buffer = true, silent = true }
    vim.keymap.set('n', '<leader>dr', '<cmd>!deno run --allow-all %<CR>',
      vim.tbl_extend('force', opts, { desc = 'Run Deno file' }))
    vim.keymap.set('n', '<leader>dt', '<cmd>!deno test --allow-all<CR>',
      vim.tbl_extend('force', opts, { desc = 'Run Deno tests' }))
    vim.keymap.set('n', '<leader>df', '<cmd>!deno fmt %<CR>',
      vim.tbl_extend('force', opts, { desc = 'Format with Deno' }))
    vim.keymap.set('n', '<leader>dl', '<cmd>!deno lint %<CR>',
      vim.tbl_extend('force', opts, { desc = 'Lint with Deno' }))
  end,
})

-- Set up project-wide Deno commands
vim.api.nvim_create_user_command('DenoCheck', function()
  vim.cmd('!deno check %')
end, { desc = 'Run Deno type checking on current file' })

vim.api.nvim_create_user_command('DenoInfo', function()
  vim.cmd('!deno info %')
end, { desc = 'Show Deno module info for current file' })

vim.api.nvim_create_user_command('DenoCache', function()
  vim.cmd('!deno cache --reload %')
end, { desc = 'Reload Deno cache for current file' })

-- Configure diagnostics for better Deno development
vim.diagnostic.config({
  virtual_text = {
    prefix = '●',
    source = 'if_many',
  },
  float = {
    source = 'always',
    border = 'rounded',
  },
  signs = true,
  underline = true,
  update_in_insert = false,
  severity_sort = true,
})

-- Set up automatic formatting on save for TypeScript files
vim.api.nvim_create_autocmd("BufWritePre", {
  group = augroup,
  pattern = {"*.ts", "*.tsx", "*.js", "*.jsx"},
  callback = function()
    if vim.b.deno_enable then
      vim.lsp.buf.format({ async = false })
    end
  end,
})`;
}

/**
 * Generate options.lua configuration
 */
function generateOptionsLua(): string {
  return `-- =============================================================================
-- DenoGenesis Neovim Configuration - options.lua
-- =============================================================================
-- Unix Philosophy: Clear, minimal, effective defaults

local opt = vim.opt

-- Line numbers - essential for development
opt.number = true
opt.relativenumber = true

-- Tabs and indentation - optimized for TypeScript/JavaScript
opt.tabstop = 2        -- Deno standard: 2 spaces
opt.softtabstop = 2
opt.shiftwidth = 2
opt.expandtab = true   -- Always use spaces
opt.autoindent = true
opt.smartindent = true

-- Line wrapping - prefer horizontal scrolling for code
opt.wrap = false
opt.breakindent = true

-- Search settings - smart and highlighted
opt.ignorecase = true
opt.smartcase = true
opt.hlsearch = true
opt.incsearch = true

-- Cursor and appearance
opt.cursorline = true
opt.termguicolors = true
opt.background = "dark"
opt.signcolumn = "yes"
opt.colorcolumn = "100"  -- Deno line length standard

-- Backspace behavior
opt.backspace = "indent,eol,start"

-- Clipboard integration - system clipboard
opt.clipboard:append("unnamedplus")

-- Split windows behavior
opt.splitright = true
opt.splitbelow = true

-- Undo and backup
opt.undofile = true
opt.undodir = vim.fn.expand("~/.config/nvim/undo")
opt.backup = false
opt.writebackup = false
opt.swapfile = false

-- Update time - responsive editor
opt.updatetime = 250
opt.timeoutlen = 300

-- File encoding and format
opt.fileencoding = "utf-8"
opt.fileformat = "unix"

-- Completion menu
opt.completeopt = { "menu", "menuone", "noselect" }

-- Scrolling behavior
opt.scrolloff = 8
opt.sidescrolloff = 8

-- Show matching brackets
opt.showmatch = true

-- Command line height
opt.cmdheight = 1

-- Better display for messages
opt.shortmess:append("c")

-- Don't show mode in command line (status line shows it)
opt.showmode = false

-- Enable mouse support
opt.mouse = "a"

-- Folding settings - use treesitter
opt.foldmethod = "expr"
opt.foldexpr = "nvim_treesitter#foldexpr()"
opt.foldenable = false  -- Start with all folds open

-- Performance improvements
opt.lazyredraw = false
opt.ttyfast = true

-- Show invisible characters
opt.list = true
opt.listchars = { tab = "▸ ", trail = "·", nbsp = "⎵" }

-- Window title
opt.title = true
opt.titlestring = "%t - Neovim"`;
}

/**
 * Generate lazy.lua plugin manager configuration
 */
function generateLazyLua(): string {
  return `-- =============================================================================
-- DenoGenesis Neovim Configuration - lazy.lua
-- =============================================================================
-- Unix Philosophy: Leverage existing software, compose cleanly

-- Bootstrap lazy.nvim plugin manager
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not (vim.uv or vim.loop).fs_stat(lazypath) then
  local lazyrepo = "https://github.com/folke/lazy.nvim.git"
  vim.fn.system({ "git", "clone", "--filter=blob:none", "--branch=stable", lazyrepo, lazypath })
end
vim.opt.rtp:prepend(lazypath)

-- Setup lazy.nvim with DenoGenesis optimizations
require("lazy").setup({
  spec = {
    -- Import plugin configurations
    { import = "plugins" },
  },

  defaults = {
    lazy = false, -- Load plugins immediately for better startup
    version = false,
  },

  install = {
    colorscheme = { "tokyonight", "habamax" }
  },

  checker = {
    enabled = true,
    notify = false,  -- Don't spam notifications
  },

  change_detection = {
    enabled = true,
    notify = false,  -- Silent updates
  },

  performance = {
    rtp = {
      -- Disable unused vim plugins for better performance
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
    border = "rounded",
  },
})`;
}

/**
 * Generate keymaps.lua configuration
 */
function generateKeymapsLua(): string {
  return `-- =============================================================================
-- DenoGenesis Neovim Configuration - keymaps.lua
-- =============================================================================
-- Unix Philosophy: Intuitive interface, composable commands

-- Set leader key - space for easy access
vim.g.mapleader = ' '
vim.g.maplocalleader = ' '

local keymap = vim.keymap.set
local opts = { noremap = true, silent = true }

-- =============================================================================
-- GENERAL KEYMAPS
-- =============================================================================

-- Clear search highlights
keymap('n', '<leader>nh', ':nohlsearch<CR>',
  vim.tbl_extend('force', opts, { desc = 'Clear search highlights' }))

-- Better window navigation
keymap('n', '<C-h>', '<C-w><C-h>',
  vim.tbl_extend('force', opts, { desc = 'Move to left window' }))
keymap('n', '<C-j>', '<C-w><C-j>',
  vim.tbl_extend('force', opts, { desc = 'Move to lower window' }))
keymap('n', '<C-k>', '<C-w><C-k>',
  vim.tbl_extend('force', opts, { desc = 'Move to upper window' }))
keymap('n', '<C-l>', '<C-w><C-l>',
  vim.tbl_extend('force', opts, { desc = 'Move to right window' }))

-- Window management
keymap('n', '<leader>sv', '<C-w>v',
  vim.tbl_extend('force', opts, { desc = 'Split window vertically' }))
keymap('n', '<leader>sh', '<C-w>s',
  vim.tbl_extend('force', opts, { desc = 'Split window horizontally' }))
keymap('n', '<leader>se', '<C-w>=',
  vim.tbl_extend('force', opts, { desc = 'Make splits equal size' }))
keymap('n', '<leader>sx', '<cmd>close<CR>',
  vim.tbl_extend('force', opts, { desc = 'Close current split' }))

-- Tab management
keymap('n', '<leader>to', '<cmd>tabnew<CR>',
  vim.tbl_extend('force', opts, { desc = 'Open new tab' }))
keymap('n', '<leader>tx', '<cmd>tabclose<CR>',
  vim.tbl_extend('force', opts, { desc = 'Close current tab' }))
keymap('n', '<leader>tn', '<cmd>tabn<CR>',
  vim.tbl_extend('force', opts, { desc = 'Next tab' }))
keymap('n', '<leader>tp', '<cmd>tabp<CR>',
  vim.tbl_extend('force', opts, { desc = 'Previous tab' }))
keymap('n', '<leader>tf', '<cmd>tabnew %<CR>',
  vim.tbl_extend('force', opts, { desc = 'Open current file in new tab' }))

-- Buffer management
keymap('n', '<leader>bd', '<cmd>bdelete<CR>',
  vim.tbl_extend('force', opts, { desc = 'Delete buffer' }))
keymap('n', '<leader>bn', '<cmd>bnext<CR>',
  vim.tbl_extend('force', opts, { desc = 'Next buffer' }))
keymap('n', '<leader>bp', '<cmd>bprevious<CR>',
  vim.tbl_extend('force', opts, { desc = 'Previous buffer' }))

-- Better text editing
keymap('v', '<', '<gv', opts)  -- Stay in visual mode when indenting
keymap('v', '>', '>gv', opts)
keymap('v', 'J', ":m '>+1<CR>gv=gv", opts)  -- Move selection down
keymap('v', 'K', ":m '<-2<CR>gv=gv", opts)  -- Move selection up

-- Center screen on navigation
keymap('n', '<C-d>', '<C-d>zz', opts)
keymap('n', '<C-u>', '<C-u>zz', opts)
keymap('n', 'n', 'nzzzv', opts)
keymap('n', 'N', 'Nzzzv', opts)

-- Better paste (don't lose register)
keymap('x', '<leader>p', '"_dP',
  vim.tbl_extend('force', opts, { desc = 'Paste without losing register' }))

-- =============================================================================
-- DENO GENESIS SPECIFIC KEYMAPS
-- =============================================================================

-- Deno commands
keymap('n', '<leader>dr', '<cmd>!deno run --allow-all %<CR>',
  vim.tbl_extend('force', opts, { desc = 'Run current Deno file' }))
keymap('n', '<leader>dt', '<cmd>!deno test --allow-all<CR>',
  vim.tbl_extend('force', opts, { desc = 'Run Deno tests' }))
keymap('n', '<leader>df', '<cmd>!deno fmt %<CR>',
  vim.tbl_extend('force', opts, { desc = 'Format current file with Deno' }))
keymap('n', '<leader>dl', '<cmd>!deno lint %<CR>',
  vim.tbl_extend('force', opts, { desc = 'Lint current file with Deno' }))
keymap('n', '<leader>dc', '<cmd>DenoCheck<CR>',
  vim.tbl_extend('force', opts, { desc = 'Run Deno type check' }))
keymap('n', '<leader>di', '<cmd>DenoInfo<CR>',
  vim.tbl_extend('force', opts, { desc = 'Show Deno module info' }))
keymap('n', '<leader>dR', '<cmd>DenoCache<CR>',
  vim.tbl_extend('force', opts, { desc = 'Reload Deno cache' }))

-- Quick project navigation (DenoGenesis structure)
keymap('n', '<leader>pc', '<cmd>edit core/<CR>',
  vim.tbl_extend('force', opts, { desc = 'Navigate to core directory' }))
keymap('n', '<leader>ps', '<cmd>edit sites/<CR>',
  vim.tbl_extend('force', opts, { desc = 'Navigate to sites directory' }))
keymap('n', '<leader>pd', '<cmd>edit docs/<CR>',
  vim.tbl_extend('force', opts, { desc = 'Navigate to docs directory' }))

-- =============================================================================
-- LSP KEYMAPS (will be overridden by LSP when attached)
-- =============================================================================

-- Diagnostic navigation
keymap('n', '[d', vim.diagnostic.goto_prev,
  vim.tbl_extend('force', opts, { desc = 'Previous diagnostic' }))
keymap('n', ']d', vim.diagnostic.goto_next,
  vim.tbl_extend('force', opts, { desc = 'Next diagnostic' }))
keymap('n', '<leader>q', vim.diagnostic.setloclist,
  vim.tbl_extend('force', opts, { desc = 'Open diagnostic quickfix' }))
keymap('n', '<leader>Q', vim.diagnostic.setqflist,
  vim.tbl_extend('force', opts, { desc = 'Open diagnostic quickfix (all)' }))

-- Format current buffer
keymap('n', '<leader>ff', function()
  vim.lsp.buf.format({ async = true })
end, vim.tbl_extend('force', opts, { desc = 'Format current buffer' }))

-- Toggle word wrap
keymap('n', '<leader>tw', '<cmd>set wrap!<CR>',
  vim.tbl_extend('force', opts, { desc = 'Toggle word wrap' }))

-- Toggle line numbers
keymap('n', '<leader>tn', '<cmd>set number!<CR>',
  vim.tbl_extend('force', opts, { desc = 'Toggle line numbers' }))

-- Quick save and quit
keymap('n', '<leader>w', '<cmd>write<CR>',
  vim.tbl_extend('force', opts, { desc = 'Save file' }))
keymap('n', '<leader>q', '<cmd>quit<CR>',
  vim.tbl_extend('force', opts, { desc = 'Quit' }))
keymap('n', '<leader>Q', '<cmd>quitall<CR>',
  vim.tbl_extend('force', opts, { desc = 'Quit all' }))`;
}

/**
 * Generate LSP configuration
 */
function generateLspLua(setupDeno: boolean): string {
  return `-- =============================================================================
-- DenoGenesis Neovim Configuration - lsp.lua
-- =============================================================================
-- Unix Philosophy: Leverage existing tools (LSP), compose intelligently

return {
  -- LSP Configuration & Plugins
  {
    'neovim/nvim-lspconfig',
    dependencies = {
      -- Automatically install LSPs to stdpath for neovim
      'williamboman/mason.nvim',
      'williamboman/mason-lspconfig.nvim',
      'WhoIsSethDaniel/mason-tool-installer.nvim',

      -- Useful status updates for LSP
      { 'j-hui/fidget.nvim', opts = {} },

      -- Additional lua configuration for neovim
      { 'folke/neodev.nvim', opts = {} },
    },
    config = function()
      -- LSP attach autocmd - set keymaps when LSP attaches to buffer
      vim.api.nvim_create_autocmd('LspAttach', {
        group = vim.api.nvim_create_augroup('lsp-attach', { clear = true }),
        callback = function(event)
          local map = function(keys, func, desc)
            vim.keymap.set('n', keys, func, {
              buffer = event.buf,
              desc = 'LSP: ' .. desc,
              noremap = true,
              silent = true
            })
          end

          -- Jump to definitions and references
          map('gd', require('telescope.builtin').lsp_definitions, '[G]oto [D]efinition')
          map('gr', require('telescope.builtin').lsp_references, '[G]oto [R]eferences')
          map('gI', require('telescope.builtin').lsp_implementations, '[G]oto [I]mplementation')
          map('<leader>D', require('telescope.builtin').lsp_type_definitions, 'Type [D]efinition')

          -- Symbols and workspace
          map('<leader>ds', require('telescope.builtin').lsp_document_symbols, '[D]ocument [S]ymbols')
          map('<leader>ws', require('telescope.builtin').lsp_dynamic_workspace_symbols, '[W]orkspace [S]ymbols')

          -- Code actions and refactoring
          map('<leader>rn', vim.lsp.buf.rename, '[R]e[n]ame')
          map('<leader>ca', vim.lsp.buf.code_action, '[C]ode [A]ction')

          -- Documentation and declarations
          map('K', vim.lsp.buf.hover, 'Hover Documentation')
          map('gD', vim.lsp.buf.declaration, '[G]oto [D]eclaration')

          -- Signature help
          map('<C-k>', vim.lsp.buf.signature_help, 'Signature Documentation')

          -- Workspace folders
          map('<leader>wa', vim.lsp.buf.add_workspace_folder, '[W]orkspace [A]dd Folder')
          map('<leader>wr', vim.lsp.buf.remove_workspace_folder, '[W]orkspace [R]emove Folder')
          map('<leader>wl', function()
            print(vim.inspect(vim.lsp.buf.list_workspace_folders()))
          end, '[W]orkspace [L]ist Folders')

          -- Highlight references under cursor
          local client = vim.lsp.get_client_by_id(event.data.client_id)
          if client and client.server_capabilities.documentHighlightProvider then
            local highlight_augroup = vim.api.nvim_create_augroup('lsp-highlight', { clear = false })
            vim.api.nvim_create_autocmd({ 'CursorHold', 'CursorHoldI' }, {
              buffer = event.buf,
              group = highlight_augroup,
              callback = vim.lsp.buf.document_highlight,
            })

            vim.api.nvim_create_autocmd({ 'CursorMoved', 'CursorMovedI' }, {
              buffer = event.buf,
              group = highlight_augroup,
              callback = vim.lsp.buf.clear_references,
            })

            vim.api.nvim_create_autocmd('LspDetach', {
              group = vim.api.nvim_create_augroup('lsp-detach', { clear = true }),
              callback = function(event2)
                vim.lsp.buf.clear_references()
                vim.api.nvim_clear_autocmds { group = 'lsp-highlight', buffer = event2.buf }
              end,
            })
          end

          -- Toggle inlay hints if available
          if client and client.server_capabilities.inlayHintProvider and vim.lsp.inlay_hint then
            map('<leader>th', function()
              vim.lsp.inlay_hint.enable(0, not vim.lsp.inlay_hint.is_enabled())
            end, '[T]oggle Inlay [H]ints')
          end
        end,
      })

      -- LSP capabilities for completion
      local capabilities = vim.lsp.protocol.make_client_capabilities()
      capabilities = vim.tbl_deep_extend('force', capabilities, require('cmp_nvim_lsp').default_capabilities())

      -- Define LSP servers configuration
      local servers = {${setupDeno ? `
        -- Deno LSP server configuration
        denols = {
          root_dir = require('lspconfig.util').root_pattern('deno.json', 'deno.jsonc', 'import_map.json'),
          init_options = {
            lint = true,
            unstable = true,
            suggest = {
              imports = {
                hosts = {
                  ["https://deno.land"] = true,
                  ["https://cdn.nest.land"] = true,
                  ["https://crux.land"] = true,
                  ["https://cdn.skypack.dev"] = true,
                  ["https://cdn.jsdelivr.net"] = true,
                }
              }
            }
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
                    ["https://cdn.jsdelivr.net"] = true,
                  }
                }
              },
              inlayHints = {
                parameterNames = { enabled = "all" },
                parameterTypes = { enabled = true },
                variableTypes = { enabled = true },
                propertyDeclarationTypes = { enabled = true },
                functionLikeReturnTypes = { enabled = true },
                enumMemberValues = { enabled = true },
              }
            }
          },
          single_file_support = true,
        },` : ''}

        -- Lua LSP for Neovim configuration
        lua_ls = {
          settings = {
            Lua = {
              completion = {
                callSnippet = 'Replace',
              },
              diagnostics = {
                globals = { 'vim' },
                disable = { 'missing-fields' },
              },
              workspace = {
                library = {
                  [vim.fn.expand('$VIMRUNTIME/lua')] = true,
                  [vim.fn.stdpath('config') .. '/lua'] = true,
                },
              },
              telemetry = { enable = false },
              hint = {
                enable = true,
                setType = false,
                paramType = true,
                paramName = "Disable",
                semicolon = "Disable",
                arrayIndex = "Disable",
              },
            },
          },
        },

        -- JSON LSP
        jsonls = {
          settings = {
            json = {
              schemas = require('schemastore').json.schemas(),
              validate = { enable = true },
            },
          },
        },
        
        -- TypeScript LSP (for non-Deno projects)
        tsserver = {
          root_dir = require('lspconfig.util').root_pattern('package.json'),
          single_file_support = false,
        },
      }

      -- Setup Mason for LSP management
      require('mason').setup({
        ui = {
          border = 'rounded',
          icons = {
            package_installed = "✓",
            package_pending = "➜",
            package_uninstalled = "✗"
          }
        }
      })

      -- Define tools to ensure installation
      local ensure_installed = vim.tbl_keys(servers or {})
      vim.list_extend(ensure_installed, {
        'stylua',  -- Lua formatter
        'prettier', -- General formatter
      })
      
      -- Add Deno if configured
      if vim.tbl_contains(ensure_installed, 'denols') then
        vim.list_extend(ensure_installed, { 'deno' })
      end

      require('mason-tool-installer').setup { 
        ensure_installed = ensure_installed,
        auto_update = false,
        run_on_start = true,
      }

      require('mason-lspconfig').setup {
        handlers = {
          function(server_name)
            local server = servers[server_name] or {}
            -- This handles overriding only values explicitly passed
            -- by the server configuration above. Useful for disabling
            -- certain features of an LSP (for example, turning off formatting for tsserver)
            server.capabilities = vim.tbl_deep_extend('force', {}, capabilities, server.capabilities or {})
            require('lspconfig')[server_name].setup(server)
          end,
        }
      }
    end,
  },
}`