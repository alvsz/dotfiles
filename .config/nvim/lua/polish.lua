function RGB_to_hex_in_line()
  local line = vim.api.nvim_get_current_line()
  local modified_line, _ = line:gsub("rgb%((%s*%d+)%s*,(%s*%d+)%s*,(%s*%d+)%s*%)", function(r, g, b)
    r, g, b = tonumber(r), tonumber(g), tonumber(b)
    return string.format("#%02X%02X%02X", r, g, b)
  end)
  if modified_line ~= line then vim.api.nvim_set_current_line(modified_line) end
end

function RGBA_to_hex_in_line()
  local line = vim.api.nvim_get_current_line()
  local modified_line, _ = line:gsub(
    "rgba%((%s*%d+)%s*,(%s*%d+)%s*,(%s*%d+)%s*,(%s*%d+%.?%d*)%s*%)",
    function(r, g, b, a)
      r, g, b, a = tonumber(r), tonumber(g), tonumber(b), tonumber(a)
      a = math.floor(a * 255) -- Converter a parte alfa de 0-1 para 0-255
      return string.format("#%02X%02X%02X%02X", r, g, b, a)
    end
  )
  if modified_line ~= line then vim.api.nvim_set_current_line(modified_line) end
end

function Console_log_word()
  local word = vim.fn.expand "<cword>"
  local log_line = [[console.log("]] .. word .. [[: ", ]] .. word .. [[);]]
  vim.api.nvim_put({ log_line }, "l", true, true)
end

vim.cmd.set "guicursor=i:hor90"
vim.cmd [[
                augroup change_cursor
                au!
                au ExitPre * :set guicursor=a:hor90
                augroup END
                ]]

vim.cmd [[
  nnoremap <leader>rl :call luaeval('RGB_to_hex_in_line()')<CR>
  nnoremap <leader>ra :call luaeval('RGBA_to_hex_in_line()')<CR>
  nnoremap <leader>rc :call luaeval('Console_log_word()')<CR>
]]

require("neo-tree").setup {
  filesystem = {
    filtered_items = {
      visible = true, -- This is what you want: If you set this to `true`, all "hide" just mean "dimmed out"
      hide_dotfiles = false,
      hide_gitignored = true,
    },
  },
}
