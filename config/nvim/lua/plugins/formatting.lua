-- lua/plugins/formatting.lua
return {
  {
    "stevearc/conform.nvim",
    config = function()
      require("conform").setup({
        formatters_by_ft = {
          javascript = { "deno_fmt" },
          typescript = { "deno_fmt" },
          javascriptreact = { "deno_fmt" },
          typescriptreact = { "deno_fmt" },
          json = { "deno_fmt" },
          jsonc = { "deno_fmt" },
          markdown = { "deno_fmt" },
        },
        format_on_save = {
          timeout_ms = 500,
          lsp_format = "fallback",
        },
      })
    end,
  },
}
