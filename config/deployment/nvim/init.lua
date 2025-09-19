if vim.g.profile_nvim then
  local start = vim.loop.hrtime()
  vim.api.nvim_create_autocmd("VimEnter", {
    callback = function()
      local time = (vim.loop.hrtime() - start) / 1000000
      print("Startup time: " .. time .. "ms")
    end,
  })
end

-- Bootstrap lazy.nvim if not installed
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

-- Set leader keys before loading any plugins
vim.g.mapleader = " "
vim.g.maplocalleader = "\\"

-- Global settings that need to be set early
vim.g.autoformat = true
vim.g.root_spec = { "lsp", { ".git", "lua" }, "cwd" }

-- Load the main configuration
require("config.lazy")