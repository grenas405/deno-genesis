-- lua/plugins/lsp.lua
return {
  {
    "neovim/nvim-lspconfig",
    config = function()
      -- Prevent conflicts between Deno and TypeScript LSP
      local function root_pattern_exclude(opt)
        local lsputil = require('lspconfig.util')
        return function(fname)
          local excluded_root = lsputil.root_pattern(opt.exclude)(fname)
          local included_root = lsputil.root_pattern(opt.root)(fname)
          if excluded_root then
            return nil
          else
            return included_root
          end
        end
      end

      -- Deno LSP setup with comprehensive configuration
      require('lspconfig').denols.setup({
        root_dir = require('lspconfig').util.root_pattern("deno.json", "deno.jsonc", "deno.lock"),
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
        },
        settings = {
          deno = {
            enable = true,
            codeLens = {
              implementations = true,
              references = true,
            },
            suggest = {
              autoImports = true,
              completeFunctionCalls = false,
              names = true,
              paths = true,
            },
            inlayHints = {
              parameterNames = { enabled = "all" },
              parameterTypes = { enabled = true },
              variableTypes = { enabled = true },
              propertyDeclarationTypes = { enabled = true },
              functionLikeReturnTypes = { enabled = true },
            },
          }
        },
        on_attach = function(client, bufnr)
          -- Deno-specific keymaps
          local opts = { buffer = bufnr, silent = true }
          vim.keymap.set('n', '<leader>dr', vim.lsp.codelens.run, opts)
          vim.keymap.set('n', '<leader>dt', '<cmd>!deno task<cr>', opts)
          vim.keymap.set('n', '<leader>df', '<cmd>!deno fmt %<cr>', opts)
        end,
      })

      -- TypeScript LSP setup with Deno exclusion
      require('lspconfig').ts_ls.setup({
        root_dir = root_pattern_exclude({
          root = { "package.json" },
          exclude = { "deno.json", "deno.jsonc" }
        }),
        single_file_support = false,
      })
    end,
  },
}