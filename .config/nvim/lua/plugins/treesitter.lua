---@type LazySpec
return {
  "nvim-treesitter/nvim-treesitter",
  opts = {
    ensure_installed = {
      "lua",
      "vim",
      "c",
      "python",
      "arduino",
      "blueprint",
      -- add more arguments for adding more treesitter parsers
    },
  },
}
