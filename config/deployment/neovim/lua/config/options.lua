-- config/options.lua - Modern Neovim Options for Deno Genesis
-- Optimized for TypeScript development and performance

vim.g.mapleader = " "
vim.g.maplocalleader = "\\"

local opt = vim.opt

-- Performance optimizations
opt.updatetime = 200
opt.timeout = true
opt.timeoutlen = 300
opt.redrawtime = 10000
opt.maxmempattern = 20000

-- UI enhancements
opt.number = true
opt.relativenumber = true
opt.signcolumn = "yes"
opt.cursorline = true
opt.wrap = false
opt.scrolloff = 8
opt.sidescrolloff = 8
opt.colorcolumn = "80,100"

-- Search improvements
opt.ignorecase = true
opt.smartcase = true
opt.incsearch = true
opt.hlsearch = true

-- Indentation (will be overridden by filetype)
opt.expandtab = true
opt.shiftwidth = 2
opt.tabstop = 2
opt.softtabstop = 2
opt.smartindent = true
opt.breakindent = true

-- File handling
opt.backup = false
opt.writebackup = false
opt.swapfile = false
opt.undofile = true
opt.undodir = os.getenv("HOME") .. "/.vim/undodir"

-- Completion enhancements
opt.completeopt = "menu,menuone,noselect"
opt.pumheight = 10
opt.pumblend = 10

-- Clipboard integration
opt.clipboard = "unnamedplus"

-- Split behavior
opt.splitright = true
opt.splitbelow = true

-- Modern features
opt.termguicolors = true
opt.winblend = 0
opt.wildmode = "longest:full,full"
opt.conceallevel = 2
opt.concealcursor = "niv"

-- Session options
opt.sessionoptions = "buffers,curdir,folds,help,tabpages,winsize,winpos,terminal,localoptions"

-- Spelling
opt.spell = false
opt.spelllang = { "en_us" }

-- Folding (for nvim-ufo)
opt.foldcolumn = "1"
opt.foldlevel = 99
opt.foldlevelstart = 99
opt.foldenable = true

-- Fill characters
opt.fillchars = {
  foldopen = "",
  foldclose = "",
  fold = " ",
  foldsep = " ",
  diff = "╱",
  eob = " ",
}

-- List characters
opt.list = true
opt.listchars = {
  tab = "» ",
  trail = "·",
  nbsp = "␣",
  extends = "❯",
  precedes = "❮",
}

-- Mouse support
opt.mouse = "a"

-- Command line
opt.cmdheight = 1
opt.laststatus = 3 -- Global statusline
opt.showmode = false

-- Window options
opt.winminwidth = 5
opt.equalalways = false

-- Format options
opt.formatoptions = "jcroqlnt"

-- Neovim provider settings
vim.g.loaded_ruby_provider = 0
vim.g.loaded_perl_provider = 0
vim.g.loaded_python3_provider = 0
vim.g.loaded_node_provider = 0

-- Disable some built-in plugins for performance
local disabled_built_ins = {
  "2html_plugin",
  "getscript",
  "getscriptPlugin",
  "gzip",
  "logipat",
  "netrw",
  "netrwPlugin",
  "netrwSettings",
  "netrwFileHandlers",
  "matchit",
  "tar",
  "tarPlugin",
  "rrhelper",
  "spellfile_plugin",
  "vimball",
  "vimballPlugin",
  "zip",
  "zipPlugin",
  "tutor",
  "rplugin",
  "synmenu",
  "optwin",
  "compiler",
  "bugreport",
  "ftplugin",
}

for _, plugin in pairs(disabled_built_ins) do
  vim.g["loaded_" .. plugin] = 1
end