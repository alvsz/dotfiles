#!/bin/lua

local proxy = require("dbus_proxy")
local cjson = require("cjson")
local inspect = require('pl.import_into')().pretty.write
local regex = require('regex')
local GLib = require("lgi").GLib
local main_loop = GLib.MainLoop()

local player = proxy.Proxy:new({
  bus = proxy.Bus.SESSION,
  name = "org.mpris.MediaPlayer2." .. arg[1],
  interface = "org.freedesktop.DBus.Properties",
  path = "/org/mpris/MediaPlayer2",
})

local metadata_json = cjson.encode(player:GetAll('org.mpris.MediaPlayer2.Player'))
metadata_json = string.gsub(metadata_json, 'mpris:', '')
metadata_json = string.gsub(metadata_json, 'xesam:', '')

local metadata = cjson.decode(metadata_json)
-- print(inspect(metadata))

if type(metadata["Metadata"]["artist"]) == "nil" then
  metadata["Metadata"]["artist"] = { "null" }
end

-- print(inspect(metadata))
print(cjson.encode(metadata))
