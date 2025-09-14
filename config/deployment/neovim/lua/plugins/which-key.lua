-- plugins/which-key.lua
-- Modern which-key.nvim configuration compatible with latest versions
-- Fixes deprecation warnings and follows current best practices

return {
  "folke/which-key.nvim",
  event = "VeryLazy",
  dependencies = {
    "nvim-tree/nvim-web-devicons", -- Icons for which-key
    "echasnovski/mini.icons", -- Alternative icon provider
  },
  config = function()
    local wk = require("which-key")
    
    -- Modern which-key setup (v3.0+ compatible)
    wk.setup({
      preset = "modern", -- Use modern preset for v3+
      delay = 300, -- Replaces old timeout
      expand = 1, -- Expand groups by default
      notify = true, -- Show notifications for issues
      
      -- Window configuration
      win = {
        border = "rounded",
        padding = { 1, 2 }, -- Extra window padding [top/bottom, right/left]
        wo = {
          winblend = 10, -- Window transparency
        },
      },
      
      -- Layout configuration  
      layout = {
        width = { min = 20, max = 50 },
        spacing = 3,
        align = "left",
      },
      
      -- Icon configuration
      icons = {
        breadcrumb = "»", -- Symbol used in command line area
        separator = "➜", -- Symbol used between command and description
        group = "+", -- Symbol prepended to group name
        ellipsis = "…", -- Used for truncated descriptions
        -- Set to false to disable icons completely
        mappings = true,
        rules = false,
      },
      
      -- Disable conflicting built-in mappings
      disable = {
        ft = {},
        bt = {},
      },
      
      -- Trigger configuration (replaces old triggers option)
      triggers = {
        { "<auto>", mode = "nixsotc" }, -- Auto-trigger for these modes
        { "<leader>", mode = { "n", "v" } },
      },
    })

    -- Key mappings registration (modern spec format)
    wk.add({
      -- File operations
      { "<leader>f", group = "File" },
      { "<leader>ff", "<cmd>Telescope find_files<cr>", desc = "Find Files" },
      { "<leader>fg", "<cmd>Telescope live_grep<cr>", desc = "Live Grep" },
      { "<leader>fb", "<cmd>Telescope buffers<cr>", desc = "Find Buffers" },
      { "<leader>fh", "<cmd>Telescope help_tags<cr>", desc = "Help Tags" },
      { "<leader>fr", "<cmd>Telescope oldfiles<cr>", desc = "Recent Files" },
      { "<leader>fc", "<cmd>edit ~/.config/nvim/init.lua<cr>", desc = "Config" },
      
      -- Buffer operations
      { "<leader>b", group = "Buffer" },
      { "<leader>bb", "<cmd>e #<cr>", desc = "Switch to Other Buffer" },
      { "<leader>bd", "<cmd>bdelete<cr>", desc = "Delete Buffer" },
      { "<leader>bn", "<cmd>bnext<cr>", desc = "Next Buffer" },
      { "<leader>bp", "<cmd>bprevious<cr>", desc = "Previous Buffer" },
      { "<leader>bl", "<cmd>Telescope buffers<cr>", desc = "List Buffers" },
      
      -- Code operations
      { "<leader>c", group = "Code" },
      { "<leader>ca", "<cmd>lua vim.lsp.buf.code_action()<cr>", desc = "Code Action" },
      { "<leader>cf", "<cmd>lua vim.lsp.buf.format()<cr>", desc = "Format" },
      { "<leader>cr", "<cmd>lua vim.lsp.buf.rename()<cr>", desc = "Rename" },
      { "<leader>ch", "<cmd>lua vim.lsp.buf.hover()<cr>", desc = "Hover Documentation" },
      { "<leader>cs", "<cmd>lua vim.lsp.buf.signature_help()<cr>", desc = "Signature Help" },
      
      -- Deno specific operations
      { "<leader>d", group = "Deno" },
      { "<leader>dr", "<cmd>!deno run %<cr>", desc = "Run File" },
      { "<leader>dt", "<cmd>!deno test<cr>", desc = "Run Tests" },
      { "<leader>df", "<cmd>!deno fmt %<cr>", desc = "Format File" },
      { "<leader>dl", "<cmd>!deno lint %<cr>", desc = "Lint File" },
      { "<leader>dc", "<cmd>!deno check %<cr>", desc = "Check File" },
      { "<leader>di", "<cmd>!deno info %<cr>", desc = "File Info" },
      
      -- Git operations
      { "<leader>g", group = "Git" },
      { "<leader>gg", "<cmd>LazyGit<cr>", desc = "LazyGit" },
      { "<leader>gs", "<cmd>Telescope git_status<cr>", desc = "Git Status" },
      { "<leader>gb", "<cmd>Telescope git_branches<cr>", desc = "Git Branches" },
      { "<leader>gc", "<cmd>Telescope git_commits<cr>", desc = "Git Commits" },
      
      -- Search operations
      { "<leader>s", group = "Search" },
      { "<leader>ss", "<cmd>Telescope grep_string<cr>", desc = "Search String" },
      { "<leader>sw", "<cmd>Telescope grep_string<cr>", desc = "Search Word" },
      { "<leader>sr", "<cmd>Telescope resume<cr>", desc = "Resume Search" },
      
      -- Toggle operations
      { "<leader>t", group = "Toggle" },
      { "<leader>tn", "<cmd>set number!<cr>", desc = "Line Numbers" },
      { "<leader>tr", "<cmd>set relativenumber!<cr>", desc = "Relative Numbers" },
      { "<leader>tw", "<cmd>set wrap!<cr>", desc = "Word Wrap" },
      { "<leader>ts", "<cmd>set spell!<cr>", desc = "Spelling" },
      
      -- Window operations
      { "<leader>w", group = "Window" },
      { "<leader>ww", "<C-W>p", desc = "Other Window" },
      { "<leader>wd", "<C-W>c", desc = "Delete Window" },
      { "<leader>w-", "<C-W>s", desc = "Split Window Below" },
      { "<leader>w|", "<C-W>v", desc = "Split Window Right" },
      { "<leader>w=", "<C-W>=", desc = "Balance Windows" },
      
      -- Help and documentation
      { "<leader>h", group = "Help" },
      { "<leader>hh", "<cmd>Telescope help_tags<cr>", desc = "Help Tags" },
      { "<leader>hm", "<cmd>Telescope man_pages<cr>", desc = "Man Pages" },
      { "<leader>hk", "<cmd>Telescope keymaps<cr>", desc = "Keymaps" },
      { "<leader>hc", "<cmd>checkhealth<cr>", desc = "Check Health" },
      
      -- LSP diagnostics
      { "<leader>l", group = "LSP" },
      { "<leader>ld", "<cmd>Telescope diagnostics<cr>", desc = "Diagnostics" },
      { "<leader>li", "<cmd>LspInfo<cr>", desc = "LSP Info" },
      { "<leader>lr", "<cmd>LspRestart<cr>", desc = "LSP Restart" },
      { "<leader>ls", "<cmd>Telescope lsp_document_symbols<cr>", desc = "Document Symbols" },
      { "<leader>lw", "<cmd>Telescope lsp_workspace_symbols<cr>", desc = "Workspace Symbols" },
    })
  end,
}
