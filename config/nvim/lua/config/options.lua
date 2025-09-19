local opt = vim.opt

-- Editor behavior
opt.number = true
opt.relativenumber = true
opt.signcolumn = "yes"
opt.wrap = false
opt.scrolloff = 4
opt.sidescrolloff = 8
opt.cursorline = true

-- Indentation
opt.expandtab = true
opt.shiftwidth = 2
opt.tabstop = 2
opt.smartindent = true

-- Search
opt.ignorecase = true
opt.smartcase = true
opt.hlsearch = false
opt.incsearch = true

-- Completion
opt.completeopt = "menu,menuone,noselect"
opt.shortmess:append "c"

-- Performance
opt.lazyredraw = false
opt.updatetime = 250
opt.timeout = true
opt.timeoutlen = 300

-- UI
opt.termguicolors = true
opt.showmode = false
opt.conceallevel = 0
opt.pumheight = 10
opt.pumblend = 10
opt.winblend = 0

-- Files
opt.backup = false
opt.writebackup = false
opt.undofile = true
opt.swapfile = false

-- Splits
opt.splitbelow = true
opt.splitright = true

-- Clipboard
opt.clipboard = "unnamedplus"

-- Mouse
opt.mouse = "a"
