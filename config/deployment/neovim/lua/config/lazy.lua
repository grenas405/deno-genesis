-- config/keymaps.lua - Modern Keymaps for Deno Genesis Development
-- Optimized for TypeScript workflow and productivity

local keymap = vim.keymap.set
local opts = { silent = true }

-- =============================================================================
-- GENERAL EDITOR KEYMAPS
-- =============================================================================

-- Clear search highlights
keymap("n", "<Esc>", "<cmd>nohlsearch<CR>", opts)

-- Better up/down
keymap({ "n", "x" }, "j", "v:count == 0 ? 'gj' : 'j'", { expr = true, silent = true })
keymap({ "n", "x" }, "k", "v:count == 0 ? 'gk' : 'k'", { expr = true, silent = true })

-- Move to window using the <ctrl> hjkl keys
keymap("n", "<C-h>", "<C-w>h", { desc = "Go to left window", remap = true })
keymap("n", "<C-j>", "<C-w>j", { desc = "Go to lower window", remap = true })
keymap("n", "<C-k>", "<C-w>k", { desc = "Go to upper window", remap = true })
keymap("n", "<C-l>", "<C-w>l", { desc = "Go to right window", remap = true })

-- Resize window using <ctrl> arrow keys
keymap("n", "<C-Up>", "<cmd>resize +2<cr>", { desc = "Increase window height" })
keymap("n", "<C-Down>", "<cmd>resize -2<cr>", { desc = "Decrease window height" })
keymap("n", "<C-Left>", "<cmd>vertical resize -2<cr>", { desc = "Decrease window width" })
keymap("n", "<C-Right>", "<cmd>vertical resize +2<cr>", { desc = "Increase window width" })

-- Move Lines
keymap("n", "<A-j>", "<cmd>m .+1<cr>==", { desc = "Move line down" })
keymap("n", "<A-k>", "<cmd>m .-2<cr>==", { desc = "Move line up" })
keymap("i", "<A-j>", "<esc><cmd>m .+1<cr>==gi", { desc = "Move line down" })
keymap("i", "<A-k>", "<esc><cmd>m .-2<cr>==gi", { desc = "Move line up" })
keymap("v", "<A-j>", ":m '>+1<cr>gv=gv", { desc = "Move selection down" })
keymap("v", "<A-k>", ":m '<-2<cr>gv=gv", { desc = "Move selection up" })

-- Buffer management
keymap("n", "<S-h>", "<cmd>bprevious<cr>", { desc = "Prev buffer" })
keymap("n", "<S-l>", "<cmd>bnext<cr>", { desc = "Next buffer" })
keymap("n", "[b", "<cmd>bprevious<cr>", { desc = "Prev buffer" })
keymap("n", "]b", "<cmd>bnext<cr>", { desc = "Next buffer" })
keymap("n", "<leader>bb", "<cmd>e #<cr>", { desc = "Switch to other buffer" })
keymap("n", "<leader>bd", "<cmd>bdelete<cr>", { desc = "Delete buffer" })
keymap("n", "<leader>bD", "<cmd>bdelete!<cr>", { desc = "Delete buffer (force)" })

-- Better indenting
keymap("v", "<", "<gv")
keymap("v", ">", ">gv")

-- Lazy (plugin manager)
keymap("n", "<leader>l", "<cmd>Lazy<cr>", { desc = "Lazy" })

-- New file
keymap("n", "<leader>fn", "<cmd>enew<cr>", { desc = "New File" })

-- Save and quit
keymap({ "i", "x", "n", "s" }, "<C-s>", "<cmd>w<cr><esc>", { desc = "Save file" })
keymap("n", "<leader>qq", "<cmd>qa<cr>", { desc = "Quit all" })

-- Line operations
keymap("n", "<leader>o", "o<Esc>", { desc = "Add line below" })
keymap("n", "<leader>O", "O<Esc>", { desc = "Add line above" })

-- =============================================================================
-- LEADER KEY MAPPINGS
-- =============================================================================

-- File operations
keymap("n", "<leader>ff", function() require("telescope.builtin").find_files() end, { desc = "Find files" })
keymap("n", "<leader>fg", function() require("telescope.builtin").live_grep() end, { desc = "Live grep" })
keymap("n", "<leader>fb", function() require("telescope.builtin").buffers() end, { desc = "Find buffers" })
keymap("n", "<leader>fh", function() require("telescope.builtin").help_tags() end, { desc = "Help tags" })
keymap("n", "<leader>fr", function() require("telescope.builtin").oldfiles() end, { desc = "Recent files" })

-- Explorer
keymap("n", "<leader>e", "<cmd>Neotree toggle<cr>", { desc = "Toggle file explorer" })
keymap("n", "<leader>E", "<cmd>Neotree focus<cr>", { desc = "Focus file explorer" })

-- Terminal
keymap("n", "<leader>t", function()
  local count = vim.v.count1
  require("toggleterm").toggle(count)
end, { desc = "Toggle terminal" })

-- Window management
keymap("n", "<leader>ww", "<C-W>p", { desc = "Other window", remap = true })
keymap("n", "<leader>wd", "<C-W>c", { desc = "Delete window", remap = true })
keymap("n", "<leader>w-", "<C-W>s", { desc = "Split window below", remap = true })
keymap("n", "<leader>w|", "<C-W>v", { desc = "Split window right", remap = true })
keymap("n", "<leader>-", "<C-W>s", { desc = "Split window below", remap = true })
keymap("n", "<leader>|", "<C-W>v", { desc = "Split window right", remap = true })

-- Tabs
keymap("n", "<leader><tab>l", "<cmd>tablast<cr>", { desc = "Last Tab" })
keymap("n", "<leader><tab>f", "<cmd>tabfirst<cr>", { desc = "First Tab" })
keymap("n", "<leader><tab><tab>", "<cmd>tabnew<cr>", { desc = "New Tab" })
keymap("n", "<leader><tab>]", "<cmd>tabnext<cr>", { desc = "Next Tab" })
keymap("n", "<leader><tab>d", "<cmd>tabclose<cr>", { desc = "Close Tab" })
keymap("n", "<leader><tab>[", "<cmd>tabprevious<cr>", { desc = "Previous Tab" })

-- =============================================================================
-- DENO-SPECIFIC KEYMAPS (Enhanced when LSP attaches)
-- =============================================================================

-- These will be enhanced by LSP configuration
keymap("n", "<leader>dr", "<cmd>DenoTask<cr>", { desc = "Run Deno task" })
keymap("n", "<leader>dt", "<cmd>!deno test<cr>", { desc = "Run Deno tests" })
keymap("n", "<leader>dc", "<cmd>!deno check %<cr>", { desc = "Check current file" })
keymap("n", "<leader>df", "<cmd>!deno fmt %<cr><cmd>edit!<cr>", { desc = "Format with Deno" })
keymap("n", "<leader>dl", "<cmd>!deno lint %<cr>", { desc = "Lint with Deno" })
keymap("n", "<leader>dh", "<cmd>DenoHealthCheck<cr>", { desc = "Deno health check" })

-- =============================================================================
-- DIAGNOSTIC AND LSP NAVIGATION (Enhanced by LSP config)
-- =============================================================================

-- Diagnostic navigation
keymap("n", "[d", vim.diagnostic.goto_prev, { desc = "Go to previous diagnostic" })
keymap("n", "]d", vim.diagnostic.goto_next, { desc = "Go to next diagnostic" })
keymap("n", "<leader>e", vim.diagnostic.open_float, { desc = "Show diagnostic" })
keymap("n", "<leader>dl", vim.diagnostic.setloclist, { desc = "Diagnostic loclist" })

-- Quickfix navigation
keymap("n", "<C-j>", "<cmd>cnext<CR>zz", opts)
keymap("n", "<C-k>", "<cmd>cprev<CR>zz", opts)
keymap("n", "<leader>j", "<cmd>lnext<CR>zz", opts)
keymap("n", "<leader>k", "<cmd>lprev<CR>zz", opts)

-- =============================================================================
-- TEXT OBJECTS AND MOTIONS
-- =============================================================================

-- Better text objects
keymap({ "o", "x" }, "ar", "<cmd>lua require('various-textobjs').restOfParagraph()<cr>", { desc = "Rest of paragraph" })
keymap({ "o", "x" }, "ir", "<cmd>lua require('various-textobjs').restOfIndent()<cr>", { desc = "Rest of indent" })

-- URL handling
keymap("n", "gx", function()
  local url = vim.fn.expand("<cWORD>")
  if url:match("^https?://") then
    vim.fn.system(string.format('open "%s"', url))
  end
end, { desc = "Open URL under cursor" })
EOF

  log "Created config/keymaps.lua"
}

generate_lazy_config() {
  local config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/nvim"
  
  cat > "$config_dir/lua/config/lazy.lua" << 'EOF'
-- config/lazy.lua - Modern Plugin Manager Configuration
-- Bootstrap and configure lazy.nvim for optimal performance

local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.uv.fs_stat(lazypath) then
  local lazyrepo = "https://github.com/folke/lazy.nvim.git"
  local out = vim.fn.system({ "git", "clone", "--filter=blob:none", "--branch=stable", lazyrepo, lazypath })
  if vim.v.shell_error ~= 0 then
    vim.api.nvim_echo({
      { "Failed to clone lazy.nvim:\n", "ErrorMsg" },
      { out, "WarningMsg" },
      { "\nPress any key to exit..." },
    }, true, {})
    vim.fn.getchar()
    os.exit(1)
  end
end
vim.opt.rtp:prepend(lazypath)

require("lazy").setup("plugins", {
  defaults = {
    lazy = false,
    version = false, -- Always use HEAD for latest features
  },
  install = { 
    colorscheme = { "tokyonight", "habamax" },
    missing = true,
  },
  checker = { 
    enabled = true,
    notify = false,
    frequency = 3600,
  },
  change_detection = {
    enabled = true,
    notify = false,
  },
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
    size = { width = 0.8, height = 0.8 },
    wrap = true,
    border = "none",
    backdrop = 60,
  },
})