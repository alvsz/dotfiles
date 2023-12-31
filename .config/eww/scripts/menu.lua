#!/bin/env lua

-- local cjson = require('cjson')
local lgi = require('lgi')
local Gio = lgi.require("Gio")
local GLib = lgi.require("GLib")

local Bus = {conn = nil, name = "", path = ""}

function Bus:new(conn, name, path)
    local o = {conn = conn, name = name, path = path}
    setmetatable(o, self)
    self.__index = self
    return o
end

function Bus:call_sync(interface, method, params, params_type, return_type)
    return self.conn:call_sync(self.name, self.path, interface, method,
                               GLib.Variant(params_type, params),
                               GLib.VariantType(return_type),
                               Gio.DBusCallFlags.NONE, -1, nil)
end

function Bus:get_menu_layout(...)
    return self:call_sync('com.canonical.dbusmenu', 'GetLayout', {...},
                          '(iias)', '(u(ia{sv}av))')
end

function Bus:menu_event(...)
    self:call_sync('com.canonical.dbusmenu', 'Event', {...}, '(isvu)', '()')
end

local function makemenu(item, menu, tag)
    local entry = ""

    if #item == 0 then
        entry = "^sep()\n"
    else
        for _, k in ipairs(item) do
            if k[2]["children-display"] ~= "submenu" then
                --
                if k[2].type == "separator" then
                    --
                    entry = entry .. "^sep()\n"
                    --
                elseif k[2].enabled ~= nil and not k[2].enabled and
                    string.len(k[2].label) > 0 then
                    --
                    entry = entry .. "^sep(" .. k[2].label .. ")\n"
                    --
                elseif string.len(k[2].label) > 0 then
                    --
                    entry = entry .. k[2].label .. "," .. tostring(k[1]) .. "\n"
                    --
                end
            else
                local temp = k[2].label

                while menu[temp] ~= nil do temp = temp .. "x" end

                entry = entry .. k[2].label .. ",^checkout(" .. temp .. ")\n"
                menu = makemenu(k[3], menu, temp)
            end
        end
    end

    menu[tag] = entry
    return menu
end

local format = function(menu)
    local csv = menu[""]

    for i, j in pairs(menu) do
        if i ~= "" then csv = csv .. "\n^tag(" .. i .. ")\n" .. j end
    end
    return csv
end

local jgmenu = function(csv)
    local cmd = ("printf '%s' '" .. csv ..
                    "' | jgmenu --simple --no-spawn --config-file='./scripts/jgmenurc'")

    local f = assert(io.popen(cmd, 'r'))
    local id = assert(f:read('*a'))

    f:close()

    id = id:gsub('^%s+', ''):gsub('%s+$', ''):gsub('[\n\r]+', ' ')

    return id
end

local show_menu = function(conn, name, path)
    local bus = Bus:new(conn, name, path)
    print(bus)
    local item = bus:get_menu_layout(0, -1, {})

    local menu = {}

    for i = 1, #item do
        if type(item[i]) == "table" and item[i][2]["children-display"] ==
            "submenu" then menu = makemenu(item[i][3], menu, "") end
    end

    local csv = format(menu)
    print(csv)

    local id = jgmenu(csv)

    if string.len(id) > 0 then
        print("id: " .. id)
        bus:menu_event(id, 'clicked', GLib.Variant('s', ''), os.time())
    end
end

local conn = Gio.bus_get_sync(Gio.BusType.SESSION)
show_menu(conn, arg[1], arg[2])
