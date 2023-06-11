#!/bin/lua

-- local inspect = require('pl.import_into')().pretty.write
local regex = require('regex')
local GLib = require("lgi").GLib

local secret = arg[1]
local domain = arg[2]

local function hex2bytearray(hex)
    local re = regex.new(".{2}", "g")
    local arr, err = re:matches(hex)
    if err then error(err) end

    local bytes = {}

    for i, j in pairs(arr) do
        table.insert(bytes, (tonumber(j, 16) or 0))
        if #bytes == 20 then break end
    end

    while #bytes < 20 do table.insert(bytes, 0) end

    return bytes
end

local function sha1bytes(text)
    local c = GLib.Checksum.new(GLib.ChecksumType.SHA1)
    c:update(text)
    return hex2bytearray(c:get_string())
end

local text = (secret or " ") .. (domain or " ")
local sha1 = sha1bytes(text)
local base64 = GLib.base64_encode(sha1);
io.write(string.sub(base64, 1, 16))
