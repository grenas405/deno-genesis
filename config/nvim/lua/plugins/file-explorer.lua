-- lua/plugins/file-explorer.lua
return {
  {
    "nvim-neo-tree/neo-tree.nvim",
    branch = "v3.x",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "nvim-tree/nvim-web-devicons",
      "MunifTanjim/nui.nvim",
    },
    cmd = "Neotree",
    keys = {
      { "<leader>e", "<cmd>Neotree toggle<cr>", desc = "Toggle Explorer" },
      { "<leader>ge", "<cmd>Neotree git_status<cr>", desc = "Git Explorer" },
    },
    config = function()
      require("neo-tree").setup({
        filesystem = {
          filtered_items = {
            visible = false,
            hide_dotfiles = false,
            hide_gitignored = true,
            hide_by_name = {
              "node_modules",
              ".git",
              ".DS_Store",
            },
          },
          follow_current_file = {
            enabled = true,
            leave_dirs_open = false,
          },
        },
        window = {
          position = "left",
          width = 30,
        },
      })
    end,
  },
}
