#!/bin/lua

local proxy = require("dbus_proxy")
local dbus = proxy.Proxy
local cjson = require("cjson")

local capture = function(cmd, raw)
    local f = assert(io.popen(cmd, 'r'))
    local s = assert(f:read('*a'))
    f:close()
    if raw then return s end
    s = string.gsub(s, '^%s+', '')
    s = string.gsub(s, '%s+$', '')
    s = string.gsub(s, '[\n\r]+', ' ')
    return s
end

local getallproperties = function(address, path, interface)
    return dbus:new({
        bus = proxy.Bus.SYSTEM,
        name = address,
        interface = "org.freedesktop.DBus.Properties",
        path = path
    }):GetAll(interface)
end

-- local ObjectManager = dbus:new({
--     bus = proxy.Bus.SYSTEM,
--     name = "org.freedesktop.NetworkManager",
--     interface = "org.freedesktop.DBus.ObjectManager",
--     path = "/org/freedesktop"
-- })

local NetworkManager = getallproperties('org.freedesktop.NetworkManager',
                                        '/org/freedesktop/NetworkManager',
                                        'org.freedesktop.NetworkManager')

for _, i in ipairs(NetworkManager.AllDevices) do
    -- print(i)
    local props = getallproperties('org.freedesktop.NetworkManager', i,
                                   'org.freedesktop.NetworkManager.Device')
    -- print(props.DeviceType)
    if props.ActiveConnection == NetworkManager.PrimaryConnection and
        props.DeviceType == 2 then
        props.Device = i
        --     not string.match(props.Udi, "virtual") then
        if props.State == 100 then
            props.Power = true
        else
            props.Power = false
        end

        if props.Ip4Connectivity == 4 or props.Ip6Connectivity == 4 then
            props.Online = true
        else
            props.Online = false
        end

        props.AccessPoints = {}

        local wireless = getallproperties('org.freedesktop.NetworkManager', i,
                                          'org.freedesktop.NetworkManager.Device.Wireless')

        if props.Power == false or wireless.ActiveAccessPoint == "/" then
            table.insert(props.AccessPoints, {
                icon = "network-error",
                Ssid = "offline",
                active = true,
                secure = false
            })
        end

        for _, j in pairs(wireless.AccessPoints) do
            -- print(j)
            local ap = getallproperties("org.freedesktop.NetworkManager", j,
                                        "org.freedesktop.NetworkManager.AccessPoint")

            ap.path = j

            if j == wireless.ActiveAccessPoint then
                ap.active = true
            else
                ap.active = false
            end

            if ap.Flags > 0 then
                ap.secure = true
            else
                ap.secure = false
            end

            for k, l in ipairs(ap.Ssid) do
                -- io.write(string.char(l))
                ap.Ssid[k] = string.char(l)
            end
            ap.Ssid = table.concat(ap.Ssid)

            if string.len(ap.Ssid) == 0 then ap.Ssid = ap.HwAddress end

            if ap.active and not props.Online then
                ap.icon = "network-offline"
            elseif ap.Strength >= 80 then
                ap.icon = "network-wireless-signal-excellent"
            elseif ap.Strength < 80 and ap.Strength >= 60 then
                ap.icon = "network-wireless-signal-good"
            elseif ap.Strength < 60 and ap.Strength >= 40 then
                ap.icon = "network-wireless-signal-ok"
            elseif ap.Strength < 40 and ap.Strength >= 20 then
                ap.icon = "network-wireless-signal-weak"
            else
                ap.icon = "network-wireless-signal-none"
            end

            table.insert(props.AccessPoints, ap)
        end

        props.expand = string.lower(capture("eww get wifi | jq '.expand'")) ==
                           "true"
        -- props.expand = false

        -- print(inspect(props))
        print(cjson.encode(props))
    end
end
