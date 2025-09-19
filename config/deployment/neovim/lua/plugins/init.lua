
-- =============================================================================
-- EXAMPLE: Plugin Loader init.lua
-- =============================================================================
-- ~/.config/nvim/lua/plugins/init.lua - Plugin aggregation

-- Return all plugin specifications as a flat table
return {
  -- Core LazyVim plugins
  { "LazyVim/LazyVim", import = "lazyvim.plugins" },
  
  -- Language pack imports
  { import = "lazyvim.plugins.extras.lang.typescript" },
  { import = "lazyvim.plugins.extras.lang.python" },
  { import = "lazyvim.plugins.extras.lang.rust" },
  
  -- Custom plugin configurations
  { import = "plugins.editor" },
  { import = "plugins.ui" },
  { import = "plugins.lsp" },
  { import = "plugins.coding" },
  { import = "plugins.git" },