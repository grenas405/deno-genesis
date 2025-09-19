-- ~/.config/nvim/init.lua
-- Bootstrap LazyVim with Deno-specific optimizations

-- Set leader keys early
vim.g.mapleader = " "
vim.g.maplocalleader = "\\"

-- LazyVim auto format
vim.g.autoformat = true

-- LazyVim root dir detection
vim.g.root_spec = { "lsp", { ".git", "lua" }, "cwd" }

-- Load LazyVim configuration
require("config.lazy")