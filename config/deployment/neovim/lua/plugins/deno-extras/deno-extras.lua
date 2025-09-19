-- ~/.config/nvim/lua/plugins/deno-extras.lua
-- Additional Deno-specific plugins and configurations

return {
  -- Enhanced TypeScript support specifically for Deno
  {
    "jose-elias-alvarez/typescript.nvim",
    enabled = false, -- Disable in favor of Deno LSP
  },

  -- Better JSON/JSONC support for Deno config files
  {
    "b0o/schemastore.nvim",
    ft = { "json", "jsonc" },
    config = function()
      require("lspconfig").jsonls.setup({
        settings = {
          json = {
            schemas = require("schemastore").json.schemas({
              select = {
                "deno.json",
                "deno.jsonc",
                "package.json",
                "tsconfig.json",
                "jsconfig.json",
              },
            }),
            validate = { enable = true },
          },
        },
      })
    end,
  },

  -- Enhanced markdown support for Deno docs
  {
    "iamcco/markdown-preview.nvim",
    cmd = { "MarkdownPreviewToggle", "MarkdownPreview", "MarkdownPreviewStop" },
    ft = { "markdown" },
    build = function() vim.fn["mkdp#util#install"]() end,
    keys = {
      { "<leader>mp", "<cmd>MarkdownPreviewToggle<cr>", desc = "Markdown Preview" },
    },
    config = function()
      vim.g.mkdp_filetypes = { "markdown" }
      vim.g.mkdp_theme = "dark"
      vim.g.mkdp_combine_preview = 1
      vim.g.mkdp_auto_close = 1
    end,
  },

  -- Database integration for projects using Deno with databases
  {
    "tpope/vim-dadbod",
    dependencies = {
      "kristijanhusak/vim-dadbod-ui",
      "kristijanhusak/vim-dadbod-completion",
    },
    cmd = { "DBUI" },
    keys = {
      { "<leader>Du", "<cmd>DBUI<cr>", desc = "Database UI" },
    },
    config = function()
      vim.g.db_ui_use_nerd_fonts = 1
      vim.g.db_ui_winwidth = 30
      vim.g.db_ui_notification_width = 50
      
      -- Auto-completion for SQL
      vim.api.nvim_create_autocmd("FileType", {
        pattern = "sql",
        callback = function()
          require("cmp").setup.buffer({ sources = { { name = "vim-dadbod-completion" } } })
        end,
      })
    end,
  },

  -- Task runner integration
  {
    "stevearc/overseer.nvim",
    cmd = { "OverseerRun", "OverseerToggle" },
    keys = {
      { "<leader>or", "<cmd>OverseerRun<cr>", desc = "Run Task" },
      { "<leader>ot", "<cmd>OverseerToggle<cr>", desc = "Toggle Overseer" },
    },
    config = function()
      require("overseer").setup({
        templates = {
          "builtin",
          "deno.run",
          "deno.test", 
          "deno.fmt",
          "deno.lint",
          "deno.compile",
        },
        task_list = {
          direction = "bottom",
          min_height = 25,
          max_height = 25,
          default_detail = 1,
        },
      })

      -- Custom Deno task templates
      require("overseer").register_template({
        name = "deno.run",
        builder = function()
          local file = vim.fn.expand("%:p")
          return {
            cmd = { "deno" },
            args = { "run", "--allow-all", file },
            components = { "default" },
          }
        end,
        condition = {
          filetype = { "typescript", "javascript" },
          callback = function()
            return vim.g.deno_project == true
          end,
        },
      })

      require("overseer").register_template({
        name = "deno.test",
        builder = function()
          return {
            cmd = { "deno" },
            args = { "test", "--allow-all" },
            components = { "default" },
          }
        end,
        condition = {
          callback = function()
            return vim.g.deno_project == true
          end,
        },
      })
    end,
  },

  -- Enhanced git integration
  {
    "sindrets/diffview.nvim",
    cmd = { "DiffviewOpen", "DiffviewClose", "DiffviewToggleFiles", "DiffviewFocusFiles" },
    keys = {
      { "<leader>gd", "<cmd>DiffviewOpen<cr>", desc = "DiffView" },
      { "<leader>gh", "<cmd>DiffviewFileHistory<cr>", desc = "DiffView History" },
    },
    config = function()
      require("diffview").setup({
        enhanced_diff_hl = true,
        view = {
          default = { layout = "diff2_horizontal" },
          merge_tool = { layout = "diff3_horizontal" },
        },
      })
    end,
  },

  -- URL handling for Deno imports
  {
    "axieax/urlview.nvim",
    cmd = "UrlView",
    keys = {
      { "<leader>fu", "<cmd>UrlView<cr>", desc = "View URLs" },
    },
    config = function()
      require("urlview").setup({
        default_picker = "telescope",
        default_prefix = "https://",
        default_action = "clipboard",
      })
    end,
  },

  -- Enhanced fold handling for large TypeScript files
  {
    "kevinhwang91/nvim-ufo",
    dependencies = "kevinhwang91/promise-async",
    event = "BufRead",
    keys = {
      { "zR", function() require("ufo").openAllFolds() end, desc = "Open all folds" },
      { "zM", function() require("ufo").closeAllFolds() end, desc = "Close all folds" },
    },
    config = function()
      require("ufo").setup({
        provider_selector = function(bufnr, filetype, buftype)
          return { "treesitter", "indent" }
        end,
      })
    end,
  },
}