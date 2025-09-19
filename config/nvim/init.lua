-- Neovim Configuration for Deno Genesis TypeScript Development 

vim.g.mapleader = " "
vim.g.maplocalleader = "\\"

-- Disable unnecessary providers for better performance
vim.g.loaded_python3_provider = 0
vim.g.loaded_ruby_provider = 0
vim.g.loaded_perl_provider = 0
vim.g.loaded_node_provider = 0


-- Load core configuration
require("config.lazy")
require("config.options")
require("config.keymaps")
require("config.autocmds")

