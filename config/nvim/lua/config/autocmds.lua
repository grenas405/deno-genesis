-- Auto commands for enhanced Deno TypeScript development
-- Place this file at: ~/.config/nvim/lua/config/autocmds.lua

local function augroup(name)
  return vim.api.nvim_create_augroup("deno_genesis_" .. name, { clear = true })
end

-- Resize splits if window got resized
vim.api.nvim_create_autocmd({ "VimResized" }, {
  group = augroup("resize_splits"),
  callback = function()
    local current_tab = vim.fn.tabpagenr()
    vim.cmd("tabdo wincmd =")
    vim.cmd("tabnext " .. current_tab)
  end,
})

-- Go to last location when opening a buffer
vim.api.nvim_create_autocmd("BufReadPost", {
  group = augroup("last_loc"),
  callback = function(event)
    local exclude = { "gitcommit" }
    local buf = event.buf
    if vim.tbl_contains(exclude, vim.bo[buf].filetype) or vim.b[buf].deno_genesis_last_loc then
      return
    end
    vim.b[buf].deno_genesis_last_loc = true
    local mark = vim.api.nvim_buf_get_mark(buf, '"')
    local lcount = vim.api.nvim_buf_line_count(buf)
    if mark[1] > 0 and mark[1] <= lcount then
      pcall(vim.api.nvim_win_set_cursor, 0, mark)
    end
  end,
})

-- Close some filetypes with <q>
vim.api.nvim_create_autocmd("FileType", {
  group = augroup("close_with_q"),
  pattern = {
    "PlenaryTestPopup",
    "help",
    "lspinfo",
    "man",
    "notify",
    "qf",
    "query",
    "spectre_panel",
    "startuptime",
    "tsplayground",
    "neotest-output",
    "checkhealth",
    "neotest-summary",
    "neotest-output-panel",
  },
  callback = function(event)
    vim.bo[event.buf].buflisted = false
    vim.keymap.set("n", "q", "<cmd>close<cr>", { buffer = event.buf, silent = true })
  end,
})

-- Wrap and check for spell in text filetypes
vim.api.nvim_create_autocmd("FileType", {
  group = augroup("wrap_spell"),
  pattern = { "gitcommit", "markdown" },
  callback = function()
    vim.opt_local.wrap = true
    vim.opt_local.spell = true
  end,
})

-- Auto create dir when saving a file, in case some intermediate directory does not exist
vim.api.nvim_create_autocmd({ "BufWritePre" }, {
  group = augroup("auto_create_dir"),
  callback = function(event)
    if event.match:match("^%w%w+://") then
      return
    end
    local file = vim.loop.fs_realpath(event.match) or event.match
    vim.fn.mkdir(vim.fn.fnamemodify(file, ":p:h"), "p")
  end,
})

-- Highlight on yank
vim.api.nvim_create_autocmd("TextYankPost", {
  group = augroup("highlight_yank"),
  callback = function()
    vim.highlight.on_yank()
  end,
})

-- Deno-specific autocommands
-- Detect Deno projects and configure accordingly
vim.api.nvim_create_autocmd({ "BufEnter", "BufNewFile" }, {
  group = augroup("deno_detection"),
  pattern = { "*.ts", "*.tsx", "*.js", "*.jsx" },
  callback = function()
    local root_dir = vim.fn.getcwd()
    local deno_files = {
      "deno.json",
      "deno.jsonc",
      "deps.ts",
      "import_map.json",
    }
    
    -- Check if we're in a Deno project
    local is_deno_project = false
    for _, file in ipairs(deno_files) do
      if vim.fn.filereadable(root_dir .. "/" .. file) == 1 then
        is_deno_project = true
        break
      end
    end
    
    if is_deno_project then
      -- Set Deno-specific options
      vim.bo.expandtab = true
      vim.bo.shiftwidth = 2
      vim.bo.tabstop = 2
      vim.bo.softtabstop = 2
      
      -- Set buffer variable for LSP configuration
      vim.b.deno_project = true
      
      -- Create Deno-specific key mappings for this buffer
      local opts = { buffer = true, silent = true }
      vim.keymap.set("n", "<leader>dr", "<cmd>!deno task dev<cr>", vim.tbl_extend("force", opts, { desc = "Run Deno dev task" }))
      vim.keymap.set("n", "<leader>dt", "<cmd>!deno test<cr>", vim.tbl_extend("force", opts, { desc = "Run Deno tests" }))
      vim.keymap.set("n", "<leader>df", "<cmd>!deno fmt %<cr>", vim.tbl_extend("force", opts, { desc = "Format with Deno" }))
      vim.keymap.set("n", "<leader>dl", "<cmd>!deno lint %<cr>", vim.tbl_extend("force", opts, { desc = "Lint with Deno" }))
      vim.keymap.set("n", "<leader>dc", "<cmd>!deno check %<cr>", vim.tbl_extend("force", opts, { desc = "Type check with Deno" }))
      vim.keymap.set("n", "<leader>di", "<cmd>!deno info %<cr>", vim.tbl_extend("force", opts, { desc = "Deno info" }))
    end
  end,
})

-- Auto-format on save for supported filetypes
vim.api.nvim_create_autocmd("BufWritePre", {
  group = augroup("auto_format"),
  pattern = { "*.ts", "*.tsx", "*.js", "*.jsx", "*.lua", "*.json", "*.md" },
  callback = function(event)
    local bufnr = event.buf
    
    -- Only format if LSP formatting is available
    local clients = vim.lsp.get_active_clients({ bufnr = bufnr })
    local has_formatter = false
    
    for _, client in ipairs(clients) do
      if client.supports_method("textDocument/formatting") then
        has_formatter = true
        break
      end
    end
    
    if has_formatter then
      vim.lsp.buf.format({
        bufnr = bufnr,
        timeout_ms = 3000,
      })
    end
  end,
})

-- Remove trailing whitespace on save
vim.api.nvim_create_autocmd("BufWritePre", {
  group = augroup("remove_trailing_whitespace"),
  pattern = "*",
  callback = function()
    -- Save cursor position
    local save_cursor = vim.fn.getpos(".")
    
    -- Remove trailing whitespace
    vim.cmd([[%s/\s\+$//e]])
    
    -- Restore cursor position
    vim.fn.setpos(".", save_cursor)
  end,
})

-- Terminal configuration
vim.api.nvim_create_autocmd("TermOpen", {
  group = augroup("terminal_config"),
  callback = function()
    vim.opt_local.number = false
    vim.opt_local.relativenumber = false
    vim.opt_local.scrolloff = 0
    
    -- Enter insert mode when switching to terminal
    vim.cmd("startinsert")
  end,
})

-- Exit terminal mode when leaving terminal buffer
vim.api.nvim_create_autocmd("BufLeave", {
  group = augroup("terminal_leave"),
  pattern = "term://*",
  callback = function()
    vim.cmd("stopinsert")
  end,
})

-- LSP attach configurations
vim.api.nvim_create_autocmd("LspAttach", {
  group = augroup("lsp_attach"),
  callback = function(event)
    local opts = { buffer = event.buf, silent = true }
    
    -- LSP keymaps
    vim.keymap.set("n", "gd", vim.lsp.buf.definition, vim.tbl_extend("force", opts, { desc = "Go to definition" }))
    vim.keymap.set("n", "gr", vim.lsp.buf.references, vim.tbl_extend("force", opts, { desc = "Go to references" }))
    vim.keymap.set("n", "gI", vim.lsp.buf.implementation, vim.tbl_extend("force", opts, { desc = "Go to implementation" }))
    vim.keymap.set("n", "gy", vim.lsp.buf.type_definition, vim.tbl_extend("force", opts, { desc = "Go to type definition" }))
    vim.keymap.set("n", "gD", vim.lsp.buf.declaration, vim.tbl_extend("force", opts, { desc = "Go to declaration" }))
    vim.keymap.set("n", "K", vim.lsp.buf.hover, vim.tbl_extend("force", opts, { desc = "Hover documentation" }))
    vim.keymap.set("n", "gK", vim.lsp.buf.signature_help, vim.tbl_extend("force", opts, { desc = "Signature help" }))
    vim.keymap.set("i", "<c-k>", vim.lsp.buf.signature_help, vim.tbl_extend("force", opts, { desc = "Signature help" }))
    vim.keymap.set("n", "<leader>ca", vim.lsp.buf.code_action, vim.tbl_extend("force", opts, { desc = "Code action" }))
    vim.keymap.set("n", "<leader>cr", vim.lsp.buf.rename, vim.tbl_extend("force", opts, { desc = "Rename" }))
    
    -- Diagnostic keymaps
    vim.keymap.set("n", "<leader>cd", vim.diagnostic.open_float, vim.tbl_extend("force", opts, { desc = "Line diagnostics" }))
    vim.keymap.set("n", "]d", vim.diagnostic.goto_next, vim.tbl_extend("force", opts, { desc = "Next diagnostic" }))
    vim.keymap.set("n", "[d", vim.diagnostic.goto_prev, vim.tbl_extend("force", opts, { desc = "Previous diagnostic" }))
  end,
})

-- File type specific configurations
vim.api.nvim_create_autocmd("FileType", {
  group = augroup("filetype_configs"),
  pattern = "lua",
  callback = function()
    vim.bo.expandtab = true
    vim.bo.shiftwidth = 2
    vim.bo.tabstop = 2
    vim.bo.softtabstop = 2
  end,
})

-- JSON files configuration
vim.api.nvim_create_autocmd("FileType", {
  group = augroup("json_config"),
  pattern = { "json", "jsonc" },
  callback = function()
    vim.bo.expandtab = true
    vim.bo.shiftwidth = 2
    vim.bo.tabstop = 2
    vim.bo.softtabstop = 2
    vim.opt_local.conceallevel = 0
  end,
})

-- Markdown specific configurations
vim.api.nvim_create_autocmd("FileType", {
  group = augroup("markdown_config"),
  pattern = "markdown",
  callback = function()
    vim.opt_local.wrap = true
    vim.opt_local.linebreak = true
    vim.opt_local.spell = true
    vim.opt_local.conceallevel = 2
  end,
})

-- Check if we need to reload the file when it changed
vim.api.nvim_create_autocmd({ "FocusGained", "TermClose", "TermLeave" }, {
  group = augroup("checktime"),
  callback = function()
    if vim.o.buftype ~= "nofile" then
      vim.cmd("checktime")
    end
  end,
})

-- Large file optimizations
vim.api.nvim_create_autocmd("BufReadPre", {
  group = augroup("large_file"),
  callback = function(event)
    local file_size = vim.fn.getfsize(event.match)
    if file_size > 1024 * 1024 then -- 1MB
      vim.opt_local.eventignore:append({
        "FileType",
        "Syntax",
        "BufEnter",
        "BufLeave",
        "BufWinEnter",
        "BufWinLeave",
        "BufNewFile",
        "BufRead",
        "BufReadPost",
      })
      vim.opt_local.undolevels = -1
      vim.opt_local.swapfile = false
      vim.opt_local.foldmethod = "manual"
      vim.opt_local.spell = false
    end
  end,
})