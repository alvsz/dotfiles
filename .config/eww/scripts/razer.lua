#!/bin/lua

local dbus = require("dbus_proxy")
local proxy = dbus.Proxy
local session = dbus.Bus.SESSION
local cjson = require("cjson")
local inspect = require('pl.import_into')().pretty.write
-- local regex = require('regex')
-- local xpath = require("luaxpath")
-- local lom = require("lxp.lom")

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

local dbusnames = proxy:new({
    bus = session,
    name = "org.freedesktop.DBus",
    interface = "org.freedesktop.DBus",
    path = "/org/freedesktop/DBus"
}):ListNames()

local razerdevice = function(serial)
    device = proxy:new({
        bus = session,
        name = 'org.razer',
        interface = 'org.razer',
        path = '/org/razer/device/' .. serial
    })
    -- print(inspect(device))

    for i, j in pairs(device) do
        -- print(i, j)
        if type(j) == "function" then
            if string.match(i, "^get.*") or string.match(i, "^is.*") then
                -- print(i, j)
                print(i, load('return(device:' .. i .. '())')())
            end
        end
    end

    return device
end

local active = false

for _, j in pairs(dbusnames) do if j == "org.razer" then active = true end end

if active then
    local devicearray = {}
    local openrazer = proxy:new({
        bus = session,
        name = "org.razer",
        interface = "razer.devices",
        path = "/org/razer"
    })
    local alldevices = openrazer:getDevices()

    for _, serial in pairs(alldevices) do
        local device = {}
        local props = razerdevice(serial)
        -- print(inspect(props))
        -- device.serial = serial
        --
        -- device.power = {}
        -- device.power.charging = props:isCharging()
        -- device.power.battery = props:getBattery()
        --
        -- device.dpi = {}
        -- local DPI = props:getDPI()
        -- device.dpi.x = DPI[1]
        -- device.dpi.y = DPI[2]
        -- device.dpi.max = props:maxDPI()
        --
        -- device.lightning = {}
        -- device.lightning.logo = {}
        -- device.lightning.logo.brightness = props:getLogoBrightness()
        -- device.lightning.logo.effect = props:getLogoEffect()
        -- device.lightning.logo.effectcolors = props:getLogoEffectColors()
        -- device.lightning.logo.effectspeed = props:getLogoEffectSpeed()
        -- device.lightning.logo.wavedir = props:getLogoWaveDir()
        --
        -- device.misc = {}
        -- device.misc.name = props:getDeviceName()
        -- device.misc.type = props:getDeviceType()
        -- device.misc.firmware = props:getFirmware()
        --
        -- device.misc.matrix = {}
        -- local matrixdimensions = props:getMatrixDimensions()
        -- device.misc.matrix.x = matrixdimensions[1]
        -- device.misc.matrix.y = matrixdimensions[2]
        --
        -- device.misc.pollrate = props:getPollRate()
        -- device.misc.hasDedicatedMacroKeys = props:hasDedicatedMacroKeys()
        -- device.misc.hasMatrix = props:hasMatrix()
        -- device.misc.mode = props:getDeviceMode()
        -- device.misc.driverversion = props:getDriverVersion()
        -- device.misc.image = props:getDeviceImage()
        --
        -- local vidpid = props:getVidPid()
        -- device.misc.vid = vidpid[1]
        -- device.misc.pid = vidpid[2]
        -- device.misc.razerurls = props:getRazerUrls()
        --
        -- table.insert(devicearray, device)
    end

    if #devicearray > 0 then
        print(cjson.encode(devicearray))
    else
        print("[]")
    end
else
    print("[]")
end
