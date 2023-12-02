#!/bin/env lua5.4

local wau = require("wau")
local inspect = require('pl.import_into')().pretty.write

wau:require("wau.protocol.ext-idle-notify-v1")

local display = wau.wl_display.connect(nil)
local registry = display:get_registry()

local idle_notifier, seat

registry:add_listener{
    ["global"] = function(self, name, interface, version)
        if interface == "ext_idle_notifier_v1" then
            idle_notifier = self:bind(name, wau.ext_idle_notifier_v1, version)
            -- print(self, name, interface, version)
        elseif seat == nil and interface == "wl_seat" then
            seat = self:bind(name, wau.wl_seat, version)
        end
    end,
    ["global_remove"] = function(self, name)
        -- This space deliberately left blank
    end
}

display:roundtrip()

assert(idle_notifier, "Failed to bind idle notifier")

local idle_notification = idle_notifier:get_idle_notification(0, seat)

assert(idle_notification, "Failed to bind idle notification")

idle_notification:add_listener({
    ["idled"] = function()
        print("idled")
        -- print(inspect({...}))
        -- print("\n")
    end,
    ["resumed"] = function()
        print("resumed")
        os.exit()
        -- print(inspect({...}))
        -- print("\n")
    end

})

while true do display:roundtrip() end

-- print(idle_notification)
