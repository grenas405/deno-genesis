-- config/autocmds.lua - Modern Auto Commands for Deno Genesis
-- Updated for 2025 with vim.uv and improved performance patterns
-- Optimized for TypeScript workflow and Deno project detection

local autocmd = vim.api.nvim_create_autocmd
local augroup = vim.api.nvim_create_augroup

-- =============================================================================
-- GENERAL EDITOR IMPROVEMENTS
-- =============================================================================

-- Highlight on yank with modern approach
augroup("YankHighlight", { clear = true })
autocmd("TextYankPost", {
  group = "YankHighlight",
  pattern = "*",
  callback = function()
    vim.highlight.on_yank({ 
      higroup = "IncSearch", 
      timeout = 150,
      on_macro = true,
    })
  end,
  desc = "Highlight yanked text",
})

-- Remove trailing whitespace on save (with exclusions)
augroup("TrimWhitespace", { clear = true })
autocmd("BufWritePre", {
  group = "TrimWhitespace",
  pattern = "*",
  callback = function()
    -- Skip certain filetypes where whitespace matters
    local exclude_ft = {
      "markdown",
      "diff",
      "gitcommit",
      "help",
    }
    
    if vim.tbl_contains(exclude_ft, vim.bo.filetype) then
      return
    end
    
    local save_cursor = vim.fn.getpos(".")
    vim.cmd([[%s/\s\+$//e]])
    vim.fn.setpos(".", save_cursor)
  end,
  desc = "Remove trailing whitespace on save",
})

-- Auto-create directories when saving files (using vim.uv)
augroup("CreateDirs", { clear = true })
autocmd("BufWritePre", {
  group = "CreateDirs",
  pattern = "*",
  callback = function(event)
    if event.match:match("^%w%w+:[\\/][\\/]") then
      return
    end
    local file = vim.uv.fs_realpath(event.match) or event.match
    vim.fn.mkdir(vim.fn.fnamemodify(file, ":p:h"), "p")
  end,
  desc = "Auto-create parent directories",
})

-- Close certain filetypes with <q>
augroup("CloseWithQ", { clear = true })
autocmd("FileType", {
  group = "CloseWithQ",
  pattern = {
    "qf",
    "help",
    "man",
    "notify",
    "lspinfo",
    "checkhealth",
    "query",
  },
  callback = function(event)
    vim.bo[event.buf].buflisted = false
    vim.keymap.set("n", "q", "<cmd>close<cr>", { 
      buffer = event.buf, 
      silent = true,
      desc = "Quit buffer",
    })
  end,
  desc = "Close with q",
})

-- =============================================================================
-- FILE TYPE SPECIFIC CONFIGURATIONS
-- =============================================================================

-- TypeScript/JavaScript optimizations for Deno
augroup("DenoTypeScript", { clear = true })
autocmd({ "BufRead", "BufNewFile" }, {
  group = "DenoTypeScript",
  pattern = { "*.ts", "*.tsx", "*.js", "*.jsx" },
  callback = function(event)
    local bufnr = event.buf
    local file_path = vim.api.nvim_buf_get_name(bufnr)
    
    -- Enhanced Deno project detection using vim.fs
    local deno_indicators = { "deno.json", "deno.jsonc", "deno.lock" }
    local root = vim.fs.root(file_path, deno_indicators)
    
    if root then
      -- Set buffer-local variables for Deno project
      vim.b[bufnr].deno_project = true
      vim.b[bufnr].deno_root = root
      
      -- Set TypeScript-specific options for Deno
      vim.bo[bufnr].expandtab = true
      vim.bo[bufnr].shiftwidth = 2
      vim.bo[bufnr].tabstop = 2
      vim.bo[bufnr].softtabstop = 2
      
      -- Better comment string for TypeScript
      vim.bo[bufnr].commentstring = "// %s"
    else
      -- Regular Node.js TypeScript project
      vim.b[bufnr].deno_project = false
      
      -- Standard TypeScript settings
      vim.bo[bufnr].expandtab = true
      vim.bo[bufnr].shiftwidth = 2
      vim.bo[bufnr].tabstop = 2
      vim.bo[bufnr].softtabstop = 2
      vim.bo[bufnr].commentstring = "// %s"
    end
  end,
  desc = "Configure TypeScript/JavaScript files",
})

-- JSON file configuration
augroup("JsonFiles", { clear = true })
autocmd({ "BufRead", "BufNewFile" }, {
  group = "JsonFiles",
  pattern = { "*.json", "*.jsonc" },
  callback = function(event)
    local bufnr = event.buf
    vim.bo[bufnr].expandtab = true
    vim.bo[bufnr].shiftwidth = 2
    vim.bo[bufnr].tabstop = 2
    vim.bo[bufnr].softtabstop = 2
    vim.bo[bufnr].conceallevel = 0 -- Don't hide quotes in JSON
  end,
  desc = "Configure JSON files",
})

-- Markdown configuration
augroup("MarkdownFiles", { clear = true })
autocmd({ "BufRead", "BufNewFile" }, {
  group = "MarkdownFiles",
  pattern = { "*.md", "*.markdown" },
  callback = function(event)
    local bufnr = event.buf
    vim.bo[bufnr].expandtab = true
    vim.bo[bufnr].shiftwidth = 2
    vim.bo[bufnr].tabstop = 2
    vim.bo[bufnr].softtabstop = 2
    vim.bo[bufnr].wrap = true
    vim.bo[bufnr].linebreak = true
    vim.wo.conceallevel = 2
  end,
  desc = "Configure Markdown files",
})

-- =============================================================================
-- WINDOW AND BUFFER MANAGEMENT
-- =============================================================================

-- Equalize splits when Vim is resized
augroup("ResizeSplits", { clear = true })
autocmd("VimResized", {
  group = "ResizeSplits",
  pattern = "*",
  command = "tabdo wincmd =",
  desc = "Resize splits when terminal is resized",
})

-- Return to last edit position when opening files
augroup("RestoreCursor", { clear = true })
autocmd("BufReadPost", {
  group = "RestoreCursor",
  pattern = "*",
  callback = function(event)
    local exclude_ft = {
      "gitcommit",
      "gitrebase",
      "svn",
      "hgcommit",
    }
    
    if vim.tbl_contains(exclude_ft, vim.bo[event.buf].filetype) then
      return
    end
    
    local mark = vim.api.nvim_buf_get_mark(event.buf, '"')
    local lcount = vim.api.nvim_buf_line_count(event.buf)
    if mark[1] > 0 and mark[1] <= lcount then
      pcall(vim.api.nvim_win_set_cursor, 0, mark)
    end
  end,
  desc = "Return to last edit position",
})

-- Auto-save when focus is lost (for non-critical files)
augroup("AutoSave", { clear = true })
autocmd({ "FocusLost", "BufLeave" }, {
  group = "AutoSave",
  pattern = "*",
  callback = function(event)
    if vim.bo[event.buf].buftype == "" and vim.bo[event.buf].readonly == false then
      vim.cmd("silent! wall")
    end
  end,
  desc = "Auto-save when losing focus",
})

-- =============================================================================
-- DENO-SPECIFIC AUTOMATION
-- =============================================================================

-- Deno task management and shortcuts
augroup("DenoIntegration", { clear = true })

-- Auto-detect Deno tasks from deno.json
autocmd({ "BufRead", "BufNewFile" }, {
  group = "DenoIntegration",
  pattern = { "deno.json", "deno.jsonc" },
  callback = function(event)
    local bufnr = event.buf
    vim.bo[bufnr].filetype = "jsonc"
    
    -- Parse deno.json to extract available tasks
    local file_path = vim.api.nvim_buf_get_name(bufnr)
    local ok, content = pcall(vim.fn.readfile, file_path)
    if ok and #content > 0 then
      local json_str = table.concat(content, "\n")
      local success, config = pcall(vim.json.decode, json_str)
      if success and config.tasks then
        -- Store tasks in buffer variable for later use
        vim.b[bufnr].deno_tasks = vim.tbl_keys(config.tasks)
      end
    end
  end,
  desc = "Configure Deno configuration files",
})

-- Set up Deno-specific keymaps when in a Deno project
autocmd("LspAttach", {
  group = "DenoIntegration", 
  pattern = "*",
  callback = function(event)
    local client = vim.lsp.get_client_by_id(event.data.client_id)
    if client and client.name == "denols" then
      local bufnr = event.buf
      local opts = { buffer = bufnr, silent = true }
      
      -- Deno-specific commands
      vim.keymap.set('n', '<leader>dr', function()
        -- Find deno.json and prompt for task selection
        local root = vim.fs.root(vim.api.nvim_buf_get_name(bufnr), { "deno.json", "deno.jsonc" })
        if root then
          local config_file = root .. "/deno.json"
          if not vim.uv.fs_stat(config_file) then
            config_file = root .. "/deno.jsonc"
          end
          
          if vim.uv.fs_stat(config_file) then
            local ok, content = pcall(vim.fn.readfile, config_file)
            if ok then
              local json_str = table.concat(content, "\n")
              local success, config = pcall(vim.json.decode, json_str)
              if success and config.tasks then
                local tasks = vim.tbl_keys(config.tasks)
                vim.ui.select(tasks, {
                  prompt = "Select Deno task:",
                }, function(choice)
                  if choice then
                    vim.cmd("!deno task " .. choice)
                  end
                end)
              else
                vim.notify("No tasks found in deno.json", vim.log.levels.WARN)
              end
            end
          end
        else
          vim.notify("No deno.json found", vim.log.levels.WARN)
        end
      end, vim.tbl_extend('force', opts, { desc = "Run Deno task" }))
      
      vim.keymap.set('n', '<leader>dt', function()
        vim.cmd("!deno test")
      end, vim.tbl_extend('force', opts, { desc = "Run Deno tests" }))
      
      vim.keymap.set('n', '<leader>dc', function()
        vim.cmd("!deno check %")
      end, vim.tbl_extend('force', opts, { desc = "Check current file" }))
      
      vim.keymap.set('n', '<leader>df', function()
        vim.cmd("!deno fmt %")
        vim.cmd("edit!")
      end, vim.tbl_extend('force', opts, { desc = "Format with Deno" }))
      
      vim.keymap.set('n', '<leader>dl', function()
        vim.cmd("!deno lint %")
      end, vim.tbl_extend('force', opts, { desc = "Lint with Deno" }))
    end
  end,
  desc = "Set up Deno-specific keymaps",
})

-- =============================================================================
-- PERFORMANCE AND UX OPTIMIZATIONS
-- =============================================================================

-- Disable syntax highlighting for large files
augroup("LargeFileOptimizations", { clear = true })
autocmd("BufReadPre", {
  group = "LargeFileOptimizations",
  pattern = "*",
  callback = function(event)
    local file = vim.api.nvim_buf_get_name(event.buf)
    local size = vim.uv.fs_stat(file)
    
    if size and size.size > 1024 * 1024 then -- 1MB
      vim.b[event.buf].large_buf = true
      vim.opt_local.syntax = "off"
      vim.opt_local.swapfile = false
      vim.opt_local.bufhidden = "unload"
      vim.opt_local.undolevels = -1
      vim.opt_local.undoreload = 0
      vim.notify(string.format("Large file detected (%s). Some features disabled.", 
        vim.fn.fnamemodify(file, ":t")), vim.log.levels.WARN)
    end
  end,
  desc = "Optimize for large files",
})

-- Automatically check for external file changes
augroup("CheckTime", { clear = true })
autocmd({ "FocusGained", "TermClose", "TermLeave" }, {
  group = "CheckTime",
  command = "checktime",
  desc = "Check for external file changes",
})

-- =============================================================================
-- USER COMMANDS FOR DENO DEVELOPMENT
-- =============================================================================

-- Create user commands for common Deno operations
vim.api.nvim_create_user_command("DenoRun", function(opts)
  local args = opts.args ~= "" and opts.args or vim.fn.expand("%")
  vim.cmd("!deno run " .. args)
end, {
  nargs = "?",
  complete = "file",
  desc = "Run Deno script",
})

vim.api.nvim_create_user_command("DenoTask", function(opts)
  if opts.args == "" then
    -- Interactive task selection
    local root = vim.fs.root(0, { "deno.json", "deno.jsonc" })
    if root then
      local config_file = root .. "/deno.json"
      if not vim.uv.fs_stat(config_file) then
        config_file = root .. "/deno.jsonc"
      end
      
      if vim.uv.fs_stat(config_file) then
        local ok, content = pcall(vim.fn.readfile, config_file)
        if ok then
          local json_str = table.concat(content, "\n")
          local success, config = pcall(vim.json.decode, json_str)
          if success and config.tasks then
            local tasks = vim.tbl_keys(config.tasks)
            vim.ui.select(tasks, {
              prompt = "Select Deno task:",
            }, function(choice)
              if choice then
                vim.cmd("!deno task " .. choice)
              end
            end)
            return
          end
        end
      end
    end
    vim.notify("No deno.json with tasks found", vim.log.levels.WARN)
  else
    vim.cmd("!deno task " .. opts.args)
  end
end, {
  nargs = "?",
  complete = function()
    -- Try to read tasks from deno.json
    local root = vim.fs.root(0, { "deno.json", "deno.jsonc" })
    if root then
      local config_file = root .. "/deno.json"
      if not vim.uv.fs_stat(config_file) then
        config_file = root .. "/deno.jsonc"
      end
      
      if vim.uv.fs_stat(config_file) then
        local ok, content = pcall(vim.fn.readfile, config_file)
        if ok then
          local json_str = table.concat(content, "\n")
          local success, config = pcall(vim.json.decode, json_str)
          if success and config.tasks then
            return vim.tbl_keys(config.tasks)
          end
        end
      end
    end
    return {}
  end,
  desc = "Run Deno task",
})

-- Command to check Deno project health
vim.api.nvim_create_user_command("DenoHealthCheck", function()
  local checks = {}
  
  -- Check for Deno installation
  local deno_version = vim.fn.system("deno --version 2>/dev/null")
  if vim.v.shell_error == 0 then
    table.insert(checks, "✅ Deno installed: " .. string.match(deno_version, "deno ([%d%.]+)"))
  else
    table.insert(checks, "❌ Deno not found")
  end
  
  -- Check for Deno config
  local root = vim.fs.root(0, { "deno.json", "deno.jsonc", "deno.lock" })
  if root then
    table.insert(checks, "✅ Deno project detected at: " .. root)
  else
    table.insert(checks, "ℹ️  No Deno project detected in current directory tree")
  end
  
  -- Check LSP status
  local clients = vim.lsp.get_clients({ bufnr = 0 })
  local deno_lsp_active = false
  local ts_lsp_active = false
  
  for _, client in ipairs(clients) do
    if client.name == "denols" then
      deno_lsp_active = true
    elseif client.name == "ts_ls" or client.name == "tsserver" then
      ts_lsp_active = true
    end
  end
  
  if deno_lsp_active then
    table.insert(checks, "✅ Deno LSP active")
  else
    table.insert(checks, "⚠️  Deno LSP not active")
  end
  
  if ts_lsp_active and deno_lsp_active then
    table.insert(checks, "⚠️  Both Deno and TypeScript LSP active (potential conflict)")
  end
  
  -- Check for common Deno files
  local deno_files = { "deno.json", "deno.jsonc", "deno.lock", "import_map.json" }
  for _, file in ipairs(deno_files) do
    if vim.uv.fs_stat(file) then
      table.insert(checks, "✅ Found: " .. file)
    end
  end
  
  -- Display results
  vim.notify(table.concat(checks, "\n"), vim.log.levels.INFO, { 
    title = "Deno Health Check",
    timeout = 5000,
  })
end, { desc = "Check Deno project health" })

-- Command to initialize a new Deno project
vim.api.nvim_create_user_command("DenoInit", function()
  local cwd = vim.fn.getcwd()
  
  -- Check if already a Deno project
  if vim.uv.fs_stat("deno.json") or vim.uv.fs_stat("deno.jsonc") then
    vim.notify("Already a Deno project", vim.log.levels.WARN)
    return
  end
  
  -- Create basic deno.json
  local deno_config = {
    compilerOptions = {
      allowJs = true,
      lib = { "deno.window" },
      strict = true,
    },
    lint = {
      rules = {
        tags = { "recommended" },
      },
    },
    fmt = {
      useTabs = false,
      lineWidth = 80,
      indentWidth = 2,
      semiColons = true,
      singleQuote = false,
      proseWrap = "preserve",
    },
    tasks = {
      dev = "deno run --watch main.ts",
      start = "deno run main.ts",
      test = "deno test",
    },
  }
  
  -- Write deno.json
  vim.fn.writefile(
    vim.split(vim.fn.json_encode(deno_config), "\n"),
    "deno.json"
  )
  
  -- Create basic main.ts if it doesn't exist
  if not vim.uv.fs_stat("main.ts") then
    local main_content = {
      '// Welcome to Deno! 🦕',
      '',
      'function main(): void {',
      '  console.log("Hello from Deno!");',
      '}',
      '',
      'if (import.meta.main) {',
      '  main();',
      '}',
    }
    vim.fn.writefile(main_content, "main.ts")
  end
  
  vim.notify("Deno project initialized successfully!", vim.log.levels.INFO)
  vim.cmd("edit deno.json")
end, { desc = "Initialize new Deno project" })