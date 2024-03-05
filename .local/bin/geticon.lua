#!/bin/lua

-- local inspect = require('pl.import_into')().pretty.write
local lgi = require("lgi")
local Gtk = lgi.require("Gtk", "3.0")

local icon_theme = Gtk.IconTheme.get_default()

local function geticon(name)
    local icon = icon_theme:lookup_icon_for_scale(name, 64, 1, lgi.Gtk
                                                      .IconLookupFlags.FORCE_SVG)
    return icon
end
local icon = geticon(arg[1])

if icon == nil then
    icon = geticon(arg[1]:lower())
elseif icon == nil then
    icon = geticon("exec")
end

print(Gtk.IconInfo.get_filename(icon))
