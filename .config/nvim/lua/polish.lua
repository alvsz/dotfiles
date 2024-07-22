function Compile_and_run_c_file()
  vim.cmd "w"

  local file_path = vim.fn.expand "%:p"

  local output_file = file_path:gsub("%.c$", "")

  local compile_cmd = string.format("gcc '%s' -o '%s'", file_path, output_file)

  local run_cmd = string.format("'%s'", output_file)

  vim.cmd(string.format("terminal %s && %s", compile_cmd, run_cmd))
  vim.cmd "startinsert"
end

-- Função para converter cor RGB para Hexadecimal em uma linha inteira
function RGB_to_hex_in_line()
  local line = vim.api.nvim_get_current_line()
  local modified_line, _ = line:gsub("rgb%((%s*%d+)%s*,(%s*%d+)%s*,(%s*%d+)%s*%)", function(r, g, b)
    r, g, b = tonumber(r), tonumber(g), tonumber(b)
    return string.format("#%02X%02X%02X", r, g, b)
  end)
  -- print(modified_line)
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

-- Cria um autocmd para arquivos do tipo C
vim.api.nvim_create_autocmd("FileType", {
  pattern = "c",
  callback = function()
    vim.api.nvim_buf_set_keymap(0, "n", "<F8>", ":lua Compile_and_run_c_file() <CR>", { noremap = true, silent = true })
  end,
})

vim.cmd.set "guicursor=i:hor90"
vim.cmd [[
                augroup change_cursor
                au!
                au ExitPre * :set guicursor=a:hor90
                augroup END
                ]]

vim.cmd [[
  autocmd FileType c nnoremap <F10> :lua vim.fn.termopen(vim.fn.expand('%:p<')) <CR> :startinsert <CR>
  nnoremap <leader>rl :call luaeval('RGB_to_hex_in_line()')<CR>
  nnoremap <leader>ra :call luaeval('RGBA_to_hex_in_line()')<CR>

  let g:arduino_args = '--config-file /home/mamba/.config/arduino-cli/arduino-cli.yaml'
  let g:arduino_dir = $XDG_DATA_HOME . "/arduino-cli/packages/arduino"
  let g:arduino_home_dir = $XDG_DATA_HOME . "/arduino-cli"
]]

if vim.g.neovide then vim.o.guifont = "FiraCode Nerd Font,Symbols Nerd Font:h11" end

for i = 1, 9 do
  vim.api.nvim_set_keymap("n", "<A-" .. i .. ">", ":buffer " .. i .. "<CR>", { noremap = true, silent = true })
end

require("neo-tree").setup {
  filesystem = {
    filtered_items = {
      visible = true, -- This is what you want: If you set this to `true`, all "hide" just mean "dimmed out"
      hide_dotfiles = false,
      hide_gitignored = true,
    },
  },
}
