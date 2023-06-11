#!/bin/env lua

local cjson = require('cjson')
local inspect = require('pl.import_into')().pretty.write
local lgi = require('lgi')
local Gio = lgi.require("Gio")
local Gtk = lgi.require("Gtk", "3.0")

local function get_icon(icon_name)
    local icon_theme = Gtk.IconTheme.get_default()
    local info = icon_theme:lookup_icon(icon_name, 64, 0)
    if info then
        return (Gtk.IconInfo.get_filename(info))
    else
        return (nil)
    end
end

local query = function(search)
    local app_list = Gio.AppInfo.get_all()

    local apps = {}

    for i in pairs(app_list) do
        local app_info = app_list[i]

        local should_show = app_info:should_show()
        -- if not should_show then break end

        local name = app_info:get_name() or ""
        local desktop_file = app_info:get_id() or ""
        local description = app_info:get_description() or ""
        local executable = app_info:get_executable() or ""
        local match, matchtype

        local icon_path = {}
        local icon = app_info:get_icon()
        local isthemedicon, icons = pcall(Gio.ThemedIcon.get_names, icon)
        local isfileicon, seila = pcall(Gio.FileIcon.get_file, icon)

        if isthemedicon then
            icon_path = {
                (get_icon(icons[1]) or get_icon(name) or
                    get_icon(string.lower(name))), "themedicon"
            }
        elseif isfileicon then
            icon_path = {seila:get_path(), "fileicon"}
        end

        if string.find(string.lower(name), search) then
            match = true
            matchtype = "name"
        elseif string.find(string.lower(desktop_file), search) then
            match = true
            matchtype = "desktop_file"
        elseif string.find(string.lower(description), search) then
            match = true
            matchtype = "description"
        elseif string.find(string.lower(executable), search) then
            match = true
            matchtype = "executable"
        end

        if match then
            table.insert(apps, {
                name = name,
                icon_path = icon_path[1] or get_icon("computer"),
                icon_type = icon_path[2],
                desktop_file = desktop_file,
                description = description,
                executable = executable,
                should_show = should_show,
                matchtype = matchtype
            })
        end
    end

    if #apps > 0 then
        return cjson.encode(apps)
    else
        return "[]"
    end
end

local exec = function(desktop_file)
    local app_list = Gio.AppInfo.get_all()

    for i in pairs(app_list) do
        local app = app_list[i]
        if app:get_id() == desktop_file then
            app:launch()
            return
        end
    end
    return nil
end

if arg[1] == "search" then
    print(query(string.lower(arg[2] or "")))
elseif arg[1] == 'exec' then
    exec(arg[2])
end

-- print(cjson.encode(apps))
