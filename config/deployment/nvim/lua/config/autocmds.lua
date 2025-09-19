---

-- ~/.config/nvim/lua/config/autocmds.lua
-- Deno-specific autocommands

local function augroup(name)
  return vim.api.nvim_create_augroup("lazyvim_" .. name, { clear = true })
end

-- Check if we need to reload the file when it changed
vim.api.nvim_create_autocmd({ "FocusGained", "TermClose", "TermLeave" }, {
  group = augroup("checktime"),
  callback = function()
    if vim.o.buftype ~= "nofile" then
      vim.cmd("checktime")
    end
  end,
})

-- Highlight on yank
vim.api.nvim_create_autocmd("TextYankPost", {
  group = augroup("highlight_yank"),
  callback = function()
    vim.highlight.on_yank()
  end,
})

-- resize splits if window got resized
vim.api.nvim_create_autocmd({ "VimResized" }, {
  group = augroup("resize_splits"),
  callback = function()
    local current_tab = vim.fn.tabpagenr()
    vim.cmd("tabdo wincmd =")
    vim.cmd("tabnext " .. current_tab)
  end,
})

-- go to last loc when opening a buffer
vim.api.nvim_create_autocmd("BufReadPost", {
  group = augroup("last_loc"),
  callback = function(event)
    local exclude = { "gitcommit" }
    local buf = event.buf
    if vim.tbl_contains(exclude, vim.bo[buf].filetype) or vim.b[buf].lazyvim_last_loc then
      return
    end
    vim.b[buf].lazyvim_last_loc = true
    local mark = vim.api.nvim_buf_get_mark(buf, '"')
    local lcount = vim.api.nvim_buf_line_count(buf)
    if mark[1] > 0 and mark[1] <= lcount then
      pcall(vim.api.nvim_win_set_cursor, 0, mark)
    end
  end,
})

-- close some filetypes with <q>
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

-- wrap and check for spell in text filetypes
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
    local file = vim.uv.fs_realpath(event.match) or event.match
    vim.fn.mkdir(vim.fn.fnamemodify(file, ":p:h"), "p")
  end,
})

-- Deno-specific autocommands
vim.api.nvim_create_autocmd({ "BufRead", "BufNewFile" }, {
  group = augroup("deno_detection"),
  pattern = { "*.ts", "*.js", "*.tsx", "*.jsx" },
  callback = function()
    local deno_files = { "deno.json", "deno.jsonc", "import_map.json", "deps.ts" }
    for _, file in ipairs(deno_files) do
      if vim.fn.filereadable(file) == 1 then
        -- Set Deno-specific buffer options
        vim.bo.expandtab = true
        vim.bo.shiftwidth = 2
        vim.bo.tabstop = 2
        vim.bo.softtabstop = 2
        
        -- Enable Deno LSP features
        vim.g.deno_project = true
        
        -- Set up Deno-specific buffer mappings
        local map = vim.keymap.set
        local opts = { buffer = true, silent = true }
        
        map("n", "<leader>dr", ":DenoRun %<CR>", vim.tbl_extend("force", opts, { desc = "Run current file" }))
        map("n", "<leader>dw", function()
          vim.cmd("TermExec cmd='deno run --watch --allow-all " .. vim.fn.expand("%") .. "'")
        end, vim.tbl_extend("force", opts, { desc = "Watch current file" }))
        
        break
      end
    end
  end,
})

-- Auto-format on save for Deno projects
vim.api.nvim_create_autocmd("BufWritePre", {
  group = augroup("deno_format"),
  pattern = { "*.ts", "*.js", "*.tsx", "*.jsx", "*.json", "*.jsonc", "*.md" },
  callback = function()
    if vim.g.deno_project then
      vim.lsp.buf.format({ async = false })
    end
  end,
})

-- Set up import sorting for Deno
vim.api.nvim_create_autocmd("BufWritePre", {
  group = augroup("deno_organize_imports"),
  pattern = { "*.ts", "*.js", "*.tsx", "*.jsx" },
  callback = function()
    if vim.g.deno_project then
      local params = {
        command = "_typescript.organizeImports",
        arguments = { vim.api.nvim_buf_get_name(0) },
        title = "",
      }
      vim.lsp.buf.execute_command(params)
    end
  end,
})

-- Enhanced file type detection for Deno
vim.api.nvim_create_autocmd({ "BufRead", "BufNewFile" }, {
  group = augroup("deno_filetypes"),
  pattern = {
    "*.config.ts",
    "*.test.ts", 
    "*.spec.ts",
    "*.bench.ts",
    "deno.json",
    "deno.jsonc",
    "import_map.json",
    "deps.ts",
    "mod.ts"
  },
  callback = function()
    vim.g.deno_project = true
    
    -- Set up enhanced syntax highlighting
    vim.cmd([[
      syntax keyword denoKeyword Deno
      syntax keyword denoGlobal console setTimeout setInterval clearTimeout clearInterval
      syntax match denoImport /https:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*/
      
      highlight link denoKeyword Keyword
      highlight link denoGlobal Global
      highlight link denoImport String
    ]])
  end,
})