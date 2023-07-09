#!/bin/lua

local lgi = require("lgi")
local Gtk = lgi.require("Gtk", "3.0")
local cjson = require('cjson')

local icon_theme = Gtk.IconTheme.get_default()

local icons = icon_theme:list_icons()
local paths = {}

for _, j in pairs(icons) do
    local info = icon_theme:lookup_icon(string.lower(j), 64, 0)
    if info then
        paths[j] = Gtk.IconInfo.get_filename(info)
    else
        info = icon_theme:lookup_icon(string.lower(j), 64, 0)
        if info then paths[j] = Gtk.IconInfo.get_filename(info) end
    end

end

-- print(paths)
print(cjson.encode(paths))
