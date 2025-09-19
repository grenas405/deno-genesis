-- ~/.config/nvim/lua/config/lazy.lua
-- Universal Deno Genesis LazyVim Setup
-- Optimized for TypeScript/JavaScript development with Deno runtime
-- Supports: LSP, DAP, Linting, Formatting, Testing, and Project Management

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

-- Deno-specific environment detection
local function is_deno_project()
  local deno_files = { "deno.json", "deno.jsonc", "import_map.json", "deps.ts" }
  for _, file in ipairs(deno_files) do
    if vim.fn.filereadable(file) == 1 then
      return true
    end
  end
  return false
end

-- Global Deno settings
vim.g.deno_project = is_deno_project()

require("lazy").setup({
  -- Core LazyVim
  { "LazyVim/LazyVim", import = "lazyvim.plugins" },
  
  -- Essential plugins for Deno development
  { import = "lazyvim.plugins.extras.lang.typescript" },
  { import = "lazyvim.plugins.extras.linting.eslint" },
  { import = "lazyvim.plugins.extras.formatting.prettier" },
  { import = "lazyvim.plugins.extras.test.core" },
  { import = "lazyvim.plugins.extras.dap.core" },
  { import = "lazyvim.plugins.extras.util.project" },

  -- Deno-specific Language Server Configuration
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        denols = {
          -- Deno Language Server configuration
          root_dir = require("lspconfig.util").root_pattern("deno.json", "deno.jsonc", "import_map.json"),
          init_options = {
            enable = true,
            lint = true,
            unstable = true,
            suggest = {
              imports = {
                hosts = {
                  ["https://deno.land"] = true,
                  ["https://cdn.nest.land"] = true,
                  ["https://crux.land"] = true,
                  ["https://esm.sh"] = true,
                  ["https://unpkg.com"] = true,
                  ["https://cdn.skypack.dev"] = true,
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
                completeFunctionCalls = false,
                names = true,
                paths = true,
                autoImports = true,
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
        tsserver = {
          -- Disable TypeScript server in Deno projects
          root_dir = function(fname)
            local deno_root = require("lspconfig.util").root_pattern("deno.json", "deno.jsonc", "import_map.json")(fname)
            if deno_root then
              return nil
            end
            return require("lspconfig.util").root_pattern("package.json", "tsconfig.json", "jsconfig.json")(fname)
          end,
        },
      },
    },
  },

  -- Enhanced TypeScript/JavaScript support
  {
    "pmizio/typescript-tools.nvim",
    enabled = not vim.g.deno_project,
    dependencies = { "nvim-lua/plenary.nvim", "neovim/nvim-lspconfig" },
    opts = {
      settings = {
        separate_diagnostic_server = true,
        expose_as_code_action = "all",
        jsx_close_tag = {
          enable = true,
          filetypes = { "javascriptreact", "typescriptreact" },
        },
      },
    },
  },

  -- Deno-specific file type detection and settings
  {
    "williamboman/mason.nvim",
    opts = {
      ensure_installed = {
        "deno",
        "typescript-language-server",
        "prettier",
        "eslint-lsp",
        "json-lsp",
      },
    },
  },

  -- Treesitter configuration for better syntax highlighting
  {
    "nvim-treesitter/nvim-treesitter",
    opts = {
      ensure_installed = {
        "typescript",
        "javascript",
        "tsx",
        "json",
        "jsonc",
        "html",
        "css",
        "markdown",
        "markdown_inline",
        "bash",
        "lua",
        "vim",
        "yaml",
      },
      highlight = {
        enable = true,
        additional_vim_regex_highlighting = false,
      },
      indent = {
        enable = true,
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
    },
  },

  -- File explorer with Deno-specific configurations
  {
    "nvim-neo-tree/neo-tree.nvim",
    opts = {
      filesystem = {
        filtered_items = {
          hide_dotfiles = false,
          hide_gitignored = false,
          hide_by_name = {
            ".git",
            ".DS_Store",
            "node_modules",
            ".deno",
          },
          never_show = {
            ".DS_Store",
            "thumbs.db",
          },
        },
        follow_current_file = {
          enabled = true,
          leave_dirs_open = true,
        },
      },
      buffers = {
        follow_current_file = {
          enabled = true,
        },
      },
    },
  },

  -- Enhanced terminal integration for Deno commands
  {
    "akinsho/toggleterm.nvim",
    opts = {
      size = 20,
      open_mapping = [[<c-\>]],
      hide_numbers = true,
      shade_terminals = true,
      start_in_insert = true,
      insert_mappings = true,
      terminal_mappings = true,
      persist_size = true,
      direction = "float",
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
    config = function(_, opts)
      require("toggleterm").setup(opts)
      
      -- Deno-specific terminal commands
      local Terminal = require("toggleterm.terminal").Terminal
      
      local deno_run = Terminal:new({
        cmd = "deno run --allow-all",
        dir = "git_dir",
        direction = "float",
        float_opts = { border = "curved" },
        on_open = function(term)
          vim.cmd("startinsert!")
          vim.api.nvim_buf_set_keymap(term.bufnr, "n", "q", "<cmd>close<CR>", { noremap = true, silent = true })
        end,
      })

      local deno_test = Terminal:new({
        cmd = "deno test --allow-all",
        dir = "git_dir",
        direction = "horizontal",
        size = 15,
      })

      local deno_fmt = Terminal:new({
        cmd = "deno fmt",
        dir = "git_dir",
        direction = "float",
        float_opts = { border = "curved" },
      })

      local deno_lint = Terminal:new({
        cmd = "deno lint",
        dir = "git_dir",
        direction = "horizontal",
        size = 15,
      })

      -- Keymaps for Deno commands
      vim.keymap.set("n", "<leader>dr", function() deno_run:toggle() end, { desc = "Deno Run" })
      vim.keymap.set("n", "<leader>dt", function() deno_test:toggle() end, { desc = "Deno Test" })
      vim.keymap.set("n", "<leader>df", function() deno_fmt:toggle() end, { desc = "Deno Format" })
      vim.keymap.set("n", "<leader>dl", function() deno_lint:toggle() end, { desc = "Deno Lint" })
    end,
  },

  -- Code formatting with Deno support
  {
    "stevearc/conform.nvim",
    opts = {
      formatters_by_ft = {
        typescript = function()
          if vim.g.deno_project then
            return { "deno_fmt" }
          end
          return { "prettier" }
        end,
        javascript = function()
          if vim.g.deno_project then
            return { "deno_fmt" }
          end
          return { "prettier" }
        end,
        typescriptreact = function()
          if vim.g.deno_project then
            return { "deno_fmt" }
          end
          return { "prettier" }
        end,
        javascriptreact = function()
          if vim.g.deno_project then
            return { "deno_fmt" }
          end
          return { "prettier" }
        end,
        json = function()
          if vim.g.deno_project then
            return { "deno_fmt" }
          end
          return { "prettier" }
        end,
        jsonc = function()
          if vim.g.deno_project then
            return { "deno_fmt" }
          end
          return { "prettier" }
        end,
        markdown = function()
          if vim.g.deno_project then
            return { "deno_fmt" }
          end
          return { "prettier" }
        end,
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

  -- Linting configuration
  {
    "mfussenegger/nvim-lint",
    opts = {
      linters_by_ft = {
        typescript = function()
          if vim.g.deno_project then
            return { "deno" }
          end
          return { "eslint" }
        end,
        javascript = function()
          if vim.g.deno_project then
            return { "deno" }
          end
          return { "eslint" }
        end,
        typescriptreact = function()
          if vim.g.deno_project then
            return { "deno" }
          end
          return { "eslint" }
        end,
        javascriptreact = function()
          if vim.g.deno_project then
            return { "deno" }
          end
          return { "eslint" }
        end,
      },
      linters = {
        deno = {
          cmd = "deno",
          args = { "lint", "--json", "-" },
          stdin = true,
          stream = "stdout",
          ignore_exitcode = true,
          parser = function(output)
            local diagnostics = {}
            local ok, decoded = pcall(vim.fn.json_decode, output)
            if not ok then
              return diagnostics
            end

            for _, item in ipairs(decoded.diagnostics or {}) do
              table.insert(diagnostics, {
                lnum = (item.range and item.range.start and item.range.start.line) or 0,
                col = (item.range and item.range.start and item.range.start.character) or 0,
                end_lnum = (item.range and item.range["end"] and item.range["end"].line) or 0,
                end_col = (item.range and item.range["end"] and item.range["end"].character) or 0,
                severity = vim.diagnostic.severity.WARN,
                message = item.message or "",
                source = "deno",
                code = item.code or "",
              })
            end

            return diagnostics
          end,
        },
      },
    },
  },

  -- Testing support for Deno
  {
    "nvim-neotest/neotest",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "antoinemadec/FixCursorHold.nvim",
      "nvim-treesitter/nvim-treesitter",
      "MarkEmmons/neotest-deno",
    },
    opts = {
      adapters = {
        ["neotest-deno"] = {
          deno_bin = "deno",
          deno_args = { "test", "--allow-all" },
        },
      },
      status = { virtual_text = true },
      output = { open_on_run = true },
    },
  },

  -- Git integration
  {
    "lewis6991/gitsigns.nvim",
    opts = {
      signs = {
        add = { text = "▎" },
        change = { text = "▎" },
        delete = { text = "" },
        topdelete = { text = "" },
        changedelete = { text = "▎" },
        untracked = { text = "▎" },
      },
    },
  },

  -- Enhanced search and replace
  {
    "nvim-pack/nvim-spectre",
    cmd = "Spectre",
    opts = { open_cmd = "noswapfile vnew" },
    keys = {
      { "<leader>sr", function() require("spectre").open() end, desc = "Replace in files (Spectre)" },
    },
  },

  -- Project management
  {
    "ahmedkhalf/project.nvim",
    opts = {
      detection_methods = { "lsp", "pattern" },
      patterns = { "deno.json", "deno.jsonc", "import_map.json", ".git", "package.json" },
    },
    event = "VeryLazy",
    config = function(_, opts)
      require("project_nvim").setup(opts)
      require("telescope").load_extension("projects")
    end,
    keys = {
      { "<leader>fp", "<cmd>Telescope projects<cr>", desc = "Projects" },
    },
  },

  -- Code completion with Deno-specific snippets
  {
    "L3MON4D3/LuaSnip",
    build = "make install_jsregexp",
    dependencies = {
      "rafamadriz/friendly-snippets",
      config = function()
        require("luasnip.loaders.from_vscode").lazy_load()
        require("luasnip.loaders.from_vscode").lazy_load({
          paths = { vim.fn.stdpath("config") .. "/snippets" }
        })
      end,
    },
    opts = {
      history = true,
      delete_check_events = "TextChanged",
    },
  },

  -- Enhanced UI
  {
    "folke/noice.nvim",
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
      },
    },
    keys = {
      { "<S-Enter>", function() require("noice").redirect(vim.fn.getcmdline()) end, mode = "c", desc = "Redirect Cmdline" },
      { "<leader>snl", function() require("noice").cmd("last") end, desc = "Noice Last Message" },
      { "<leader>snh", function() require("noice").cmd("history") end, desc = "Noice History" },
      { "<leader>sna", function() require("noice").cmd("all") end, desc = "Noice All" },
      { "<leader>snd", function() require("noice").cmd("dismiss") end, desc = "Dismiss All" },
    },
  },

  -- Enhanced which-key for Deno commands
  {
    "folke/which-key.nvim",
    opts = {
      defaults = {
        ["<leader>d"] = { name = "+deno" },
        ["<leader>dt"] = { name = "+test" },
        ["<leader>dp"] = { name = "+project" },
      },
    },
  },

  -- HTTP client for testing Deno web servers
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
          show_http_info = true,
          show_headers = true,
          formatters = {
            json = "jq",
            html = function(body)
              return vim.fn.system({ "tidy", "-i", "-q", "-" }, body)
            end
          },
        },
      })
    end,
    keys = {
      { "<leader>rr", "<cmd>Rest run<cr>", desc = "Run request under cursor" },
      { "<leader>rl", "<cmd>Rest run last<cr>", desc = "Re-run last request" },
    },
  },
}, {
  defaults = {
    lazy = false,
    version = false, -- always use the latest git commit
  },
  install = { colorscheme = { "tokyonight", "habamax" } },
  checker = { enabled = true }, -- automatically check for plugin updates
  performance = {
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
})

-- Deno-specific autocommands
vim.api.nvim_create_autocmd({ "BufRead", "BufNewFile" }, {
  pattern = { "*.ts", "*.js", "*.tsx", "*.jsx" },
  callback = function()
    if is_deno_project() then
      -- Set up Deno-specific settings
      vim.bo.expandtab = true
      vim.bo.shiftwidth = 2
      vim.bo.tabstop = 2
      vim.bo.softtabstop = 2
      
      -- Enable Deno-specific features
      vim.g.deno_enable = true
      
      -- Set import completion to prioritize Deno imports
      vim.cmd([[
        setlocal iskeyword+=-
        setlocal iskeyword+=@-@
      ]])
    end
  end,
})

-- Deno task runner commands
vim.api.nvim_create_user_command("DenoRun", function(opts)
  local cmd = "deno run --allow-all " .. opts.args
  vim.cmd("TermExec cmd='" .. cmd .. "'")
end, { nargs = "*", desc = "Run Deno script" })

vim.api.nvim_create_user_command("DenoTest", function(opts)
  local cmd = "deno test --allow-all " .. opts.args
  vim.cmd("TermExec cmd='" .. cmd .. "'")
end, { nargs = "*", desc = "Run Deno tests" })

vim.api.nvim_create_user_command("DenoFmt", function()
  vim.cmd("TermExec cmd='deno fmt'")
end, { desc = "Format with Deno" })

vim.api.nvim_create_user_command("DenoLint", function()
  vim.cmd("TermExec cmd='deno lint'")
end, { desc = "Lint with Deno" })

vim.api.nvim_create_user_command("DenoInfo", function(opts)
  local cmd = "deno info " .. opts.args
  vim.cmd("TermExec cmd='" .. cmd .. "'")
end, { nargs = "*", desc = "Show Deno module info" })

vim.api.nvim_create_user_command("DenoCache", function(opts)
  local cmd = "deno cache " .. opts.args
  vim.cmd("TermExec cmd='" .. cmd .. "'")
end, { nargs = "*", desc = "Cache Deno dependencies" })

-- Key mappings for enhanced Deno development
vim.keymap.set("n", "<leader>dr", ":DenoRun %<CR>", { desc = "Run current Deno file" })
vim.keymap.set("n", "<leader>dt", ":DenoTest<CR>", { desc = "Run Deno tests" })
vim.keymap.set("n", "<leader>df", ":DenoFmt<CR>", { desc = "Format with Deno" })
vim.keymap.set("n", "<leader>dl", ":DenoLint<CR>", { desc = "Lint with Deno" })
vim.keymap.set("n", "<leader>di", ":DenoInfo %<CR>", { desc = "Show current file info" })
vim.keymap.set("n", "<leader>dc", ":DenoCache %<CR>", { desc = "Cache current file dependencies" })

-- Enhanced LSP keymaps for Deno development
vim.api.nvim_create_autocmd("LspAttach", {
  callback = function(event)
    local map = function(keys, func, desc)
      vim.keymap.set("n", keys, func, { buffer = event.buf, desc = "LSP: " .. desc })
    end

    -- Enhanced navigation
    map("gd", require("telescope.builtin").lsp_definitions, "Go to Definition")
    map("gr", require("telescope.builtin").lsp_references, "Go to References")
    map("gI", require("telescope.builtin").lsp_implementations, "Go to Implementation")
    map("<leader>D", require("telescope.builtin").lsp_type_definitions, "Type Definition")
    map("<leader>ds", require("telescope.builtin").lsp_document_symbols, "Document Symbols")
    map("<leader>ws", require("telescope.builtin").lsp_dynamic_workspace_symbols, "Workspace Symbols")
    
    -- Code actions and refactoring
    map("<leader>rn", vim.lsp.buf.rename, "Rename")
    map("<leader>ca", vim.lsp.buf.code_action, "Code Action")
    map("K", vim.lsp.buf.hover, "Hover Documentation")
    map("gD", vim.lsp.buf.declaration, "Go to Declaration")
    
    -- Diagnostic navigation
    map("[d", vim.diagnostic.goto_prev, "Previous Diagnostic")
    map("]d", vim.diagnostic.goto_next, "Next Diagnostic")
    map("<leader>e", vim.diagnostic.open_float, "Line Diagnostics")
    map("<leader>q", vim.diagnostic.setloclist, "Diagnostic Quickfix")
  end,
})