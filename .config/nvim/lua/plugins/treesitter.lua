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
      "vala",
      -- add more arguments for adding more treesitter parsers
    },
  },
}
