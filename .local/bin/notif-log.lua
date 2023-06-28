#!/bin/lua

local dbus = require("dbus_proxy")
-- local proxy = dbus.Proxy
local strip = dbus.variant.strip
local cjson = require("cjson")
-- local inspect = require('pl.import_into')().pretty.write
local lgi = require("lgi")
local Gio = lgi.require("Gio")
local GLib = lgi.require("GLib")
local Gtk = lgi.require("Gtk", "3.0")
local GdkPixbuf = lgi.require("GdkPixbuf")
local lfs = require("lfs")

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

math.randomseed(os.clock() * 100000000000)

local iconpath = (os.getenv("XDG_RUNTIME_DIR") or "/tmp") .. "/notifs/"

if type(lfs.attributes(iconpath)) == "nil" then lfs.mkdir(iconpath) end

local name = "org.freedesktop.DBus"
local interface = "org.freedesktop.DBus.Monitoring"
local path = "/org/freedesktop/DBus"
local params = GLib.Variant("(asu)", {
    {"path=/org/freedesktop/Notifications,member=Notify"}, 0
})
local method = "BecomeMonitor"
local flags = Gio.DBusSendMessageFlags.NONE

local bus = Gio.bus_get_sync(Gio.BusType.SESSION, nil)
bus:call_sync(name, path, interface, method, params, nil, flags, -1)

-- local message = Gio.DBusMessage.new_method_call(name, path, interface, method)
-- message:set_body(params)
-- ring(bus)
-- bus:send_message_with_reply_sync(message, flags, -1, nil)

bus:add_filter(function(a, msg)
    if a == bus then
        -- print(msg:get_body())
        local msgbody = strip(msg:get_body())
        if msgbody == nil then return end

        local notif = {
            ["app_name"] = msgbody[1],
            ["replaces_id"] = msgbody[2],
            ["app_icon"] = msgbody[3],
            ["summary"] = msgbody[4],
            ["body"] = msgbody[5],
            ["actions"] = msgbody[6],
            ["hints"] = msgbody[7],
            ["expire_timeout"] = msgbody[8],
            ["visible"] = true,
            ["time"] = os.date("%H:%M")
        }
        -- print(inspect(notif))
        -- print(cjson.encode(notif))

        if notif["hints"]["wired-note"] ~= "osd" then
            local notifs = cjson.decode(capture("eww get notifs", true))

            if type(notif["hints"]["image-data"]) == "table" or
                type(notif["hints"]["image_data"]) == "table" -- and string.len(notif["app_icon"]) == 0
            then
                local imagedata = notif["hints"]["image-data"] or
                                      notif["hints"]["image_data"]

                local gbytes = GLib.Bytes.new(imagedata[7],
                                              imagedata[1] * imagedata[2])

                local icon = GdkPixbuf.Pixbuf.new_from_bytes(gbytes,
                                                             GdkPixbuf.Colorspace
                                                                 .RGB,
                                                             imagedata[4],
                                                             imagedata[5],
                                                             imagedata[1],
                                                             imagedata[2],
                                                             imagedata[3])

                -- local iconpath = (os.getenv("XDG_RUNTIME_DIR") or "/tmp") ..
                --     "/notifs/"

                local iconname = "icon" ..
                                     string.gsub(notif["summary"], "/", "-") ..
                                     (math.random(1, 1000) or
                                         math.ceil(os.clock() * 100000000000)) ..
                                     ".png"

                icon:savev(iconpath .. iconname, "png")

                notif["app_icon"] = iconpath .. iconname

                notif["hints"]["image-data"] = nil
                notif["hints"]["image_data"] = nil
            elseif type(lfs.attributes(notif["app_icon"])) == "nil" and
                string.len(notif["app_icon"]) > 0 then
                local app_icon = Gtk.IconTheme.get_default():lookup_icon(
                                     string.lower(notif["app_icon"]), 64,
                                     Gtk.IconLookupFlags.FORCE_SVG)
                if type(app_icon) ~= "nil" then
                    notif["app_icon"] = app_icon:get_filename()
                end
            end
            table.insert(notifs, notif)

            for key, _ in pairs(notifs) do notifs[key]["id"] = key end
            -- print(cjson.encode(notifs))
            os.execute("eww update notifs='" .. cjson.encode(notifs) .. "'")

            print(cjson.encode(notif))
        end
    end
end)

GLib.MainLoop().new():run()
