-- lua/plugins/deno.lua
return {
  {
    "sigmaSd/deno-nvim",
    dependencies = { "neovim/nvim-lspconfig" },
    ft = { "javascript", "typescript", "javascriptreact", "typescriptreact" },
    config = function()
      require("deno-nvim").setup({
        server = {
          on_attach = function(client, bufnr)
            local bufopts = { noremap = true, silent = true, buffer = bufnr }
            -- Deno-specific mappings
            vim.keymap.set('n', '<leader>dr', function() 
              vim.lsp.codelens.refresh()
              vim.lsp.codelens.run()
            end, bufopts)
            vim.keymap.set('n', '<leader>dt', '<cmd>!deno task<cr>', bufopts)
            vim.keymap.set('n', '<leader>dc', '<cmd>!deno check %<cr>', bufopts)
          end,
          capabilities = require('cmp_nvim_lsp').default_capabilities(),
        },
      })
    end,
  },
}
