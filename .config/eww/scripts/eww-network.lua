#!/bin/lua

local proxy = require("dbus_proxy")
local cjson = require("cjson")
local Gio = require("lgi").Gio
local GLib = require("lgi").GLib
-- local inspect = require('pl.import_into')().pretty.write
-- local regex = require('regex')
-- local xpath = require("luaxpath")
-- local lom = require("lxp.lom")

-- local dbusNetworkManager = function(path, interface)
--   return proxy.Proxy:new({
--     bus = proxy.Bus.SYSTEM,
--     name = "org.freedesktop.NetworkManager",
--     interface = interface,
--     path = path
--   })
-- end

-- local dbusNetworkManager = proxy.Proxy:new({
--         bus = proxy.Bus.SYSTEM,
--         path = '/org/freedesktop/DBus',
--         interface = 'org.freedesktop.DBus',
--         name = 'org.freedesktop.DBus'
--     }):GetNameOwner("org.freedesktop.NetworkManager")

local getallproperties = function(address, path, interface)
    return proxy.Proxy:new({
        bus = proxy.Bus.SYSTEM,
        name = address,
        interface = "org.freedesktop.DBus.Properties",
        path = path
    }):GetAll(interface)
end

local geticon = function(name)
    local lgi = require("lgi")
    local Gtk = lgi.require("Gtk", "3.0")
    local icon = Gtk.IconTheme.get_default():lookup_icon(string.lower(name), 64,
        Gtk.IconLookupFlags
        .FORCE_SVG)

    if type(icon) ~= "nil" then
        return icon:get_filename()
    else
        return nil
    end
end

local NetworkManager = getallproperties('org.freedesktop.NetworkManager',
    '/org/freedesktop/NetworkManager',
    'org.freedesktop.NetworkManager')

-- local PrimaryConnection = NetworkManager.PrimaryConnection
-- print(inspect(NetworkManager))

-- local PrimaryConnection = (dbusNetworkManager("/org/freedesktop/NetworkManager",
--       "org.freedesktop.DBus.Properties"):Get(
--       "org.freedesktop.NetworkManager",
--       "PrimaryConnection"))

-- print(PrimaryConnection)

-- print(NetworkManager.PrimaryConnection)

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

        if props.Power == true and props.ActiveConnection ~= "/" then
            props.ActiveConnection = getallproperties(
                "org.freedesktop.NetworkManager",
                props.ActiveConnection,
                "org.freedesktop.NetworkManager.Connection.Active")

            props.ActiveConnection.AccessPoint = getallproperties(
                "org.freedesktop.NetworkManager",
                props.ActiveConnection
                .SpecificObject,
                "org.freedesktop.NetworkManager.AccessPoint")

            for k, l in ipairs(props.ActiveConnection.AccessPoint.Ssid) do
                props.ActiveConnection.AccessPoint.Ssid[k] = string.char(l)
            end
            props.ActiveConnection.AccessPoint.Ssid = table.concat(
                props.ActiveConnection
                .AccessPoint.Ssid)

            if not props.Online then
                props.icon = geticon("network-offline")
            elseif props.ActiveConnection.AccessPoint.Strength >= 80 then
                props.icon = geticon("network-wireless-signal-excellent")
            elseif props.ActiveConnection.AccessPoint.Strength < 80 and

                props.ActiveConnection.AccessPoint.Strength >= 60 then
                props.icon = geticon("network-wireless-signal-good")
            elseif props.ActiveConnection.AccessPoint.Strength < 60 and

                props.ActiveConnection.AccessPoint.Strength >= 40 then
                props.icon = geticon("network-wireless-signal-ok")
            elseif props.ActiveConnection.AccessPoint.Strength < 40 and

                props.ActiveConnection.AccessPoint.Strength >= 20 then
                props.icon = geticon("network-wireless-signal-weak")
            else
                props.icon = geticon("network-wireless-signal-none")
            end
        else
            props.icon = geticon("network-error")
            props.ActiveConnection = {}
        end

        -- for _, j in ipairs(getallproperties('org.freedesktop.NetworkManager', i,
        --   'org.freedesktop.NetworkManager.Device.Wireless').AccessPoints) do
        --   print(j)
        -- end

        print(cjson.encode(props))
    end
end
