-- plugins/lsp.lua - Modern LSP Configuration for Deno Genesis
-- Updated for 2025 with vim.uv, improved Deno/TS conflict resolution
-- Uses latest nvim-lspconfig patterns and performance optimizations

return {
  -- LSP Configuration
  {
    "neovim/nvim-lspconfig",
    event = { "BufReadPre", "BufNewFile" },
    dependencies = {
      "mason.nvim",
      "williamboman/mason-lspconfig.nvim",
      "hrsh7th/cmp-nvim-lsp",
    },
    opts = {
      -- Global diagnostic configuration
      diagnostics = {
        underline = true,
        update_in_insert = false,
        virtual_text = {
          spacing = 4,
          source = "if_many",
          prefix = "●",
          severity_sort = true,
        },
        float = {
          focusable = false,
          style = "minimal",
          border = "rounded",
          source = "always",
          header = "",
          prefix = "",
        },
        severity_sort = true,
        signs = {
          text = {
            [vim.diagnostic.severity.ERROR] = " ",
            [vim.diagnostic.severity.WARN] = " ",
            [vim.diagnostic.severity.HINT] = " ",
            [vim.diagnostic.severity.INFO] = " ",
          },
        },
      },
      -- Inlay hints configuration
      inlay_hints = {
        enabled = true,
        exclude = { "vue" }, -- Exclude certain filetypes
      },
      -- Document formatting
      format = {
        formatting_options = nil,
        timeout_ms = nil,
      },
      -- Capabilities enhancement
      capabilities = {
        workspace = {
          fileOperations = {
            didRename = true,
            willRename = true,
          },
        },
      },
    },
    config = function(_, opts)
      local lspconfig = require("lspconfig")
      local cmp_nvim_lsp = require("cmp_nvim_lsp")
      
      -- Setup diagnostic configuration
      vim.diagnostic.config(vim.deepcopy(opts.diagnostics))
      
      -- Enhanced capabilities with nvim-cmp
      local capabilities = vim.tbl_deep_extend(
        "force",
        {},
        vim.lsp.protocol.make_client_capabilities(),
        cmp_nvim_lsp.default_capabilities(),
        opts.capabilities or {}
      )
      
      -- Enable folding capability for nvim-ufo
      capabilities.textDocument.foldingRange = {
        dynamicRegistration = false,
        lineFoldingOnly = true,
      }
      
      -- =================================================================
      -- MODERN DENO/TYPESCRIPT LSP CONFLICT RESOLUTION
      -- =================================================================
      
      -- Improved root pattern detection to prevent LSP conflicts
      local function get_deno_root(fname)
        local util = require("lspconfig.util")
        return util.root_pattern("deno.json", "deno.jsonc", "deno.lock")(fname)
      end
      
      local function get_node_root(fname)
        local util = require("lspconfig.util")
        return util.root_pattern("package.json", "tsconfig.json", "jsconfig.json")(fname)
      end
      
      -- Deno LSP Configuration with enhanced settings
      lspconfig.denols.setup({
        root_dir = get_deno_root,
        capabilities = capabilities,
        single_file_support = false, -- Prevent attaching to random TS files
        init_options = {
          lint = true,
          unstable = true,
          suggest = {
            imports = {
              hosts = {
                ["https://deno.land"] = true,
                ["https://cdn.nest.land"] = true,
                ["https://crux.land"] = true,
                ["https://esm.sh"] = true,
              },
            },
          },
          inlayHints = {
            parameterNames = { enabled = "all" },
            parameterTypes = { enabled = true },
            variableTypes = { enabled = true },
            propertyDeclarationTypes = { enabled = true },
            functionLikeReturnTypes = { enabled = true },
            enumMemberValues = { enabled = true },
          },
        },
        settings = {
          deno = {
            enable = true,
            lint = true,
            unstable = true,
            suggest = {
              imports = {
                hosts = {
                  ["https://deno.land"] = true,
                  ["https://cdn.nest.land"] = true,
                  ["https://crux.land"] = true,
                  ["https://esm.sh"] = true,
                },
              },
            },
            inlayHints = {
              parameterNames = { enabled = "all" },
              parameterTypes = { enabled = true },
              variableTypes = { enabled = true },
              propertyDeclarationTypes = { enabled = true },
              functionLikeReturnTypes = { enabled = true },
              enumMemberValues = { enabled = true },
            },
          },
        },
        on_attach = function(client, bufnr)
          -- Set buffer variable to indicate Deno project
          vim.b[bufnr].deno_project = true
          
          -- Disable tsserver if running in same buffer
          local clients = vim.lsp.get_clients({ bufnr = bufnr })
          for _, c in ipairs(clients) do
            if c.name == "ts_ls" or c.name == "tsserver" then
              vim.lsp.stop_client(c.id)
            end
          end
        end,
      })
      
      -- TypeScript LSP (only for non-Deno projects)
      lspconfig.ts_ls.setup({
        root_dir = function(fname)
          local deno_root = get_deno_root(fname)
          if deno_root then
            return nil -- Don't attach if Deno project detected
          end
          return get_node_root(fname)
        end,
        capabilities = capabilities,
        single_file_support = true,
        settings = {
          typescript = {
            inlayHints = {
              includeInlayParameterNameHints = "all",
              includeInlayParameterNameHintsWhenArgumentMatchesName = false,
              includeInlayFunctionParameterTypeHints = true,
              includeInlayVariableTypeHints = true,
              includeInlayPropertyDeclarationTypeHints = true,
              includeInlayFunctionLikeReturnTypeHints = true,
              includeInlayEnumMemberValueHints = true,
            },
          },
          javascript = {
            inlayHints = {
              includeInlayParameterNameHints = "all",
              includeInlayParameterNameHintsWhenArgumentMatchesName = false,
              includeInlayFunctionParameterTypeHints = true,
              includeInlayVariableTypeHints = true,
              includeInlayPropertyDeclarationTypeHints = true,
              includeInlayFunctionLikeReturnTypeHints = true,
              includeInlayEnumMemberValueHints = true,
            },
          },
        },
        on_attach = function(client, bufnr)
          -- Disable formatting if Deno is available in the project
          if vim.fn.executable("deno") == 1 then
            local deno_config = vim.fs.find(
              { "deno.json", "deno.jsonc" },
              { path = vim.fs.dirname(vim.api.nvim_buf_get_name(bufnr)), upward = true }
            )[1]
            if deno_config then
              client.server_capabilities.documentFormattingProvider = false
              client.server_capabilities.documentRangeFormattingProvider = false
            end
          end
        end,
      })
      
      -- JSON LSP with schema support
      lspconfig.jsonls.setup({
        capabilities = capabilities,
        settings = {
          json = {
            schemas = require("schemastore").json.schemas(),
            validate = { enable = true },
          },
        },
      })
      
      -- Lua LSP (for Neovim configuration)
      lspconfig.lua_ls.setup({
        capabilities = capabilities,
        settings = {
          Lua = {
            runtime = {
              version = "LuaJIT",
            },
            workspace = {
              checkThirdParty = false,
              library = {
                vim.env.VIMRUNTIME,
                "${3rd}/luv/library",
              },
            },
            completion = {
              callSnippet = "Replace",
            },
            diagnostics = {
              globals = { "vim" },
            },
            hint = {
              enable = true,
            },
            telemetry = {
              enable = false,
            },
          },
        },
      })
      
      -- Markdown LSP
      lspconfig.marksman.setup({
        capabilities = capabilities,
      })
      
      -- =================================================================
      -- GLOBAL LSP KEYMAPS AND HANDLERS (Modern 2025 Patterns)
      -- =================================================================
      
      -- Global LSP keymaps (applied to all LSP buffers)
      vim.api.nvim_create_autocmd("LspAttach", {
        group = vim.api.nvim_create_augroup("UserLspConfig", {}),
        callback = function(event)
          local opts = { buffer = event.buf, silent = true }
          local client = vim.lsp.get_client_by_id(event.data.client_id)
          
          -- Navigation keymaps
          vim.keymap.set('n', 'gD', vim.lsp.buf.declaration, 
            vim.tbl_extend('force', opts, { desc = "Go to declaration" }))
          vim.keymap.set('n', 'gd', vim.lsp.buf.definition, 
            vim.tbl_extend('force', opts, { desc = "Go to definition" }))
          vim.keymap.set('n', 'gi', vim.lsp.buf.implementation, 
            vim.tbl_extend('force', opts, { desc = "Go to implementation" }))
          vim.keymap.set('n', 'gr', vim.lsp.buf.references, 
            vim.tbl_extend('force', opts, { desc = "Go to references" }))
          vim.keymap.set('n', 'gy', vim.lsp.buf.type_definition, 
            vim.tbl_extend('force', opts, { desc = "Go to type definition" }))
          
          -- Information and documentation
          vim.keymap.set('n', 'K', vim.lsp.buf.hover, 
            vim.tbl_extend('force', opts, { desc = "Hover information" }))
          vim.keymap.set('n', '<C-k>', vim.lsp.buf.signature_help, 
            vim.tbl_extend('force', opts, { desc = "Signature help" }))
          vim.keymap.set('i', '<C-h>', vim.lsp.buf.signature_help, 
            vim.tbl_extend('force', opts, { desc = "Signature help" }))
          
          -- Code actions and refactoring
          vim.keymap.set({'n', 'v'}, '<leader>ca', vim.lsp.buf.code_action, 
            vim.tbl_extend('force', opts, { desc = "Code action" }))
          vim.keymap.set('n', '<leader>rn', vim.lsp.buf.rename, 
            vim.tbl_extend('force', opts, { desc = "Rename symbol" }))
          
          -- Workspace management
          vim.keymap.set('n', '<leader>wa', vim.lsp.buf.add_workspace_folder, 
            vim.tbl_extend('force', opts, { desc = "Add workspace folder" }))
          vim.keymap.set('n', '<leader>wr', vim.lsp.buf.remove_workspace_folder, 
            vim.tbl_extend('force', opts, { desc = "Remove workspace folder" }))
          vim.keymap.set('n', '<leader>wl', function()
            print(vim.inspect(vim.lsp.buf.list_workspace_folders()))
          end, vim.tbl_extend('force', opts, { desc = "List workspace folders" }))
          
          -- Formatting (with Deno-specific logic)
          if client and client.supports_method("textDocument/formatting") then
            vim.keymap.set('n', '<leader>cf', function()
              -- Use Deno formatting if in Deno project, otherwise LSP
              if vim.b.deno_project and vim.fn.executable("deno") == 1 then
                vim.cmd("!deno fmt %")
                vim.cmd("edit!")
              else
                vim.lsp.buf.format({ async = true })
              end
            end, vim.tbl_extend('force', opts, { desc = "Format document" }))
          end
          
          -- Inlay hints toggle (if supported)
          if client and client.supports_method("textDocument/inlayHint") then
            vim.keymap.set('n', '<leader>th', function()
              vim.lsp.inlay_hint.enable(not vim.lsp.inlay_hint.is_enabled({ bufnr = event.buf }), { bufnr = event.buf })
            end, vim.tbl_extend('force', opts, { desc = "Toggle inlay hints" }))
          end
          
          -- Set up autocommands for the buffer
          if client and client.supports_method("textDocument/documentHighlight") then
            local highlight_augroup = vim.api.nvim_create_augroup("lsp-highlight", { clear = false })
            vim.api.nvim_create_autocmd({ "CursorHold", "CursorHoldI" }, {
              buffer = event.buf,
              group = highlight_augroup,
              callback = vim.lsp.buf.document_highlight,
            })
            vim.api.nvim_create_autocmd({ "CursorMoved", "CursorMovedI" }, {
              buffer = event.buf,
              group = highlight_augroup,
              callback = vim.lsp.buf.clear_references,
            })
          end
        end,
      })
      
      -- =================================================================
      -- ENHANCED LSP HANDLERS FOR BETTER UX
      -- =================================================================
      
      -- Enhanced hover handler with border
      vim.lsp.handlers["textDocument/hover"] = vim.lsp.with(
        vim.lsp.handlers.hover, {
          border = "rounded",
          focusable = false,
          close_events = { "BufLeave", "CursorMoved", "InsertEnter", "FocusLost" },
        }
      )
      
      -- Enhanced signature help handler
      vim.lsp.handlers["textDocument/signatureHelp"] = vim.lsp.with(
        vim.lsp.handlers.signature_help, {
          border = "rounded",
          focusable = false,
          close_events = { "CursorMoved", "BufHidden", "InsertLeave" },
        }
      )
      
      -- Progress handler for better loading indication
      local progress = {}
      vim.lsp.handlers["$/progress"] = function(_, result, ctx)
        local client_id = ctx.client_id
        local value = result.value
        
        if not value.kind then
          return
        end
        
        local client = vim.lsp.get_client_by_id(client_id)
        local name = client and client.name or string.format("client-%d", client_id)
        
        if value.kind == "begin" then
          progress[client_id] = {
            title = value.title,
            message = value.message,
            percentage = value.percentage,
          }
        elseif value.kind == "report" then
          if progress[client_id] then
            progress[client_id].message = value.message
            progress[client_id].percentage = value.percentage
          end
        elseif value.kind == "end" then
          if progress[client_id] then
            local msg = string.format("%s: %s", name, progress[client_id].title)
            if progress[client_id].message then
              msg = msg .. " - " .. progress[client_id].message
            end
            vim.notify(msg .. " completed", vim.log.levels.INFO)
            progress[client_id] = nil
          end
        end
      end
    end,
  },
  
  -- Schema support for JSON files
  {
    "b0o/SchemaStore.nvim",
    lazy = true,
    version = false, -- last release is way too old
  },
}