---@type LazySpec
return {
  "nvim-treesitter/nvim-treesitter",
  opts = {
    ensure_installed = {
      "lua",
      "vim",
      "c",
      "python",
      -- add more arguments for adding more treesitter parsers
    },
  },
}
