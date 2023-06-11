#!/bin/lua

local proxy = require("dbus_proxy")
local cjson = require("cjson")
-- local inspect = require('pl.import_into')().pretty.write
-- local regex = require('regex')
local xpath = require("luaxpath")
local lom = require("lxp.lom")

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

function table.contains(table, element)
    for _, value in pairs(table) do if value == element then return true end end
    return false
end

local dbusnames = proxy.Proxy:new({
    bus = proxy.Bus.SESSION,
    name = "org.freedesktop.DBus",
    interface = "org.freedesktop.DBus",
    path = "/org/freedesktop/DBus"
}):ListNames()

local active = false

for _, j in pairs(dbusnames) do
    if j == "org.kde.kdeconnect.daemon" then active = true end
end

if active then
    local kdeconnect = proxy.Proxy:new({
        bus = proxy.Bus.SESSION,
        name = "org.kde.kdeconnect.daemon",
        interface = "org.freedesktop.DBus.Introspectable",
        path = "/modules/kdeconnect/devices"
    })

    local alldevices = xpath.selectNodes(lom.parse(kdeconnect:Introspect()),
        '/node/node/@name')

    -- print(inspect(alldevices))

    local devicearray = {}

    for _, value in pairs(alldevices) do
        local device = proxy.Proxy:new({
            bus = proxy.Bus.SESSION,
            name = "org.kde.kdeconnect.daemon",
            interface = "org.freedesktop.DBus.Properties",
            path = "/modules/kdeconnect/devices/" .. value
        })
        if device:Get('org.kde.kdeconnect.device', 'isReachable') then
            local info = device:GetAll('org.kde.kdeconnect.device')

            local batteryinfo, connectivityinfo, notifications
            local sftp = {}

            if table.contains(info.supportedPlugins, "kdeconnect_battery") then
                batteryinfo = proxy.Proxy:new({
                    bus = proxy.Bus.SESSION,
                    name = "org.kde.kdeconnect.daemon",
                    interface = "org.freedesktop.DBus.Properties",
                    path = "/modules/kdeconnect/devices/" .. value .. "/battery"
                }):GetAll('org.kde.kdeconnect.device.battery')

                local level, charge
                if batteryinfo.charge < 20 then
                    level = "-empty"
                elseif batteryinfo.charge >= 20 and batteryinfo.charge < 40 then
                    level = "-caution"
                elseif batteryinfo.charge >= 40 and batteryinfo.charge < 60 then
                    level = "-low"
                elseif batteryinfo.charge >= 60 and batteryinfo.charge < 80 then
                    level = "-good"
                elseif batteryinfo.charge >= 80 and batteryinfo.charge < 100 then
                    level = "-full"
                elseif batteryinfo.charge == 100 then
                    level = "-full-charged"
                else
                    level = "-missing"
                end

                if batteryinfo.isCharging then
                    charge = "-charging"
                else
                    charge = ""
                end

                batteryinfo.icon = ("battery" .. level .. charge)
            end

            if table.contains(info.supportedPlugins,
                    "kdeconnect_connectivity_report") then
                connectivityinfo = proxy.Proxy:new({
                    bus = proxy.Bus.SESSION,
                    name = "org.kde.kdeconnect.daemon",
                    interface = "org.freedesktop.DBus.Properties",
                    path = "/modules/kdeconnect/devices/" .. value ..
                        "/connectivity_report"
                }):GetAll('org.kde.kdeconnect.device.connectivity_report')

                local signal
                if connectivityinfo.cellularNetworkStrength == 4 then
                    signal = "network-cellular-signal-excellent"
                elseif connectivityinfo.cellularNetworkStrength == 3 then
                    signal = "network-cellular-signal-good"
                elseif connectivityinfo.cellularNetworkStrength == 2 then
                    signal = "network-cellular-signal-ok"
                elseif connectivityinfo.cellularNetworkStrength == 1 then
                    signal = "network-cellular-signal-weak"
                else
                    signal = "network-cellular-signal-none"
                end

                connectivityinfo.icon = signal
            end

            local mprisaray = {}
            if table.contains(info.supportedPlugins, "kdeconnect_mprisremote") then
                for _, value2 in pairs(proxy.Proxy:new({
                    bus = proxy.Bus.SESSION,
                    name = "org.freedesktop.DBus",
                    interface = "org.freedesktop.DBus",
                    path = "/org/freedesktop/DBus"
                }):ListNames()) do
                    if value2:match("mpris") and value2:match("kdeconnect") then
                        local props = proxy.Proxy:new({
                            bus = proxy.Bus.SESSION,
                            name = value2,
                            interface = "org.freedesktop.DBus.Properties",
                            path = "/org/mpris/MediaPlayer2"
                        }):GetAll("org.mpris.MediaPlayer2")

                        local props2 = proxy.Proxy:new({
                            bus = proxy.Bus.SESSION,
                            name = value2,
                            interface = "org.freedesktop.DBus.Properties",
                            path = "/org/mpris/MediaPlayer2"
                        }):GetAll("org.mpris.MediaPlayer2.Player")

                        local metadata =
                            cjson.encode(props2.Metadata):gsub("mpris:", "")
                            :gsub("xesam:", "")

                        props2.Metadata = cjson.decode(metadata)

                        props2.properties = props
                        props2.bus = value2

                        props2.artPath =
                            (props.Identity:gsub(" - .*", ""):lower())

                        table.insert(mprisaray, props2)
                    end
                end
            end

            local notifarray = {}
            if table.contains(info.supportedPlugins, "kdeconnect_notifications") then
                notifications = proxy.Proxy:new({
                    bus = proxy.Bus.SESSION,
                    name = "org.kde.kdeconnect.daemon",
                    interface = "org.freedesktop.DBus.Introspectable",
                    path = "/modules/kdeconnect/devices/" .. value ..
                        "/notifications"
                })

                local allnotifs = xpath.selectNodes(lom.parse(
                        notifications:Introspect()),
                    '/node/node/@name')
                -- print(inspect(allnotifs))

                for _, value2 in pairs(allnotifs) do
                    local notifinfo = proxy.Proxy:new({
                        bus = proxy.Bus.SESSION,
                        name = "org.kde.kdeconnect.daemon",
                        interface = "org.freedesktop.DBus.Properties",
                        path = "/modules/kdeconnect/devices/" .. value ..
                            "/notifications/" .. value2
                    }):GetAll(
                        'org.kde.kdeconnect.device.notifications.notification')

                    notifinfo["id"] = value2

                    local unique = true
                    for _, j in pairs(mprisaray) do
                        if j.properties.Identity:gsub(" - .*", "") ==
                            notifinfo.appName then
                            unique = false
                        end
                    end

                    if unique then
                        table.insert(notifarray, notifinfo)
                    end
                end
            end

            if table.contains(info.supportedPlugins, "kdeconnect_sftp") then
                sftp.isMounted = proxy.Proxy:new({
                    bus = proxy.Bus.SESSION,
                    name = "org.kde.kdeconnect.daemon",
                    interface = "org.kde.kdeconnect.device.sftp",
                    path = "/modules/kdeconnect/devices/" .. value .. "/sftp"
                }):isMounted()

                sftp.mountPoint = proxy.Proxy:new({
                    bus = proxy.Bus.SESSION,
                    name = "org.kde.kdeconnect.daemon",
                    interface = "org.kde.kdeconnect.device.sftp",
                    path = "/modules/kdeconnect/devices/" .. value .. "/sftp"
                }):mountPoint()

                sftp.getDirectories = {}

                local tempdirs = proxy.Proxy:new({
                    bus = proxy.Bus.SESSION,
                    name = "org.kde.kdeconnect.daemon",
                    interface = "org.kde.kdeconnect.device.sftp",
                    path = "/modules/kdeconnect/devices/" .. value .. "/sftp"
                }):getDirectories()
                -- print(cjson.encode(sftp.tempdirs))

                for i, j in pairs(tempdirs) do
                    table.insert(sftp.getDirectories, { name = j, path = i })
                    -- print(i, j)
                end
            end

            info["id"] = value
            info.i = #devicearray
            -- info["remotempris"] = mprisremoteinfo
            info["battery"] = batteryinfo or {}
            info["connectivity_report"] = connectivityinfo or {}
            info["notifications"] = notifarray or {}
            info["mpris"] = mprisaray or {}
            info["sftp"] = sftp or {}
            -- info["expanded"] = false
            info["supportedPlugins"] = nil
            info["expanded"] = capture("eww get kdeconnect | jq '.[" ..
                    tostring(#devicearray) ..
                    "].expanded' -c --unbuffered") ==
                "true"
            -- info["expanded"] = cjson.decode(capture(
            --                                     "eww get kdeconnect | jq -c --unbuffered"))[#devicearray]
            --                        .expanded

            table.insert(devicearray, info)
            -- print(cjson.encode(devicearray))
        end
    end

    if #devicearray > 0 then
        print(cjson.encode(devicearray))
        -- os.execute("eww update kdeconnect='" .. cjson.encode(devicearray) .. "'")
    else
        print("[]")
    end
else
    print("[]")
end
-- print(cjson.encode(devicearray))
-- print(device:Get('org.kde.kdeconnect.device.battery', 'isCharging'))
