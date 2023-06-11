#!/bin/lua

local inspect = require('pl.import_into')().pretty.write
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

local numtags = 7
local widget = {monitors = {}}

local tag = function()
    return {occupied = false, selected = false, urgent = false}
end

local function tags()
    local array = {}

    for i = 1, numtags do array[tostring(i)] = tag() end

    return array
end

while true do
    local new_state = cjson.decode(io.read())

    widget.focused_title = new_state.title
    -- widget.layout = { icon = capture("riverctl ") }

    for i, j in pairs(new_state.tags) do
        widget.monitors[i] = tags()

        for _, l in pairs(j) do
            if widget.monitors[i][tostring(l)] == nil then
                widget.monitors[i][tostring(l)] = tag()
            end

            widget.monitors[i][tostring(l)].selected = true
        end
    end

    for i, j in pairs(new_state.viewstag) do
        for _, l in pairs(j) do
            if l ~= 0 then
                local l_tostr = tostring(math.floor(l))

                if widget.monitors[i][l_tostr] == nil then
                    widget.monitors[i][l_tostr] = tag()
                end

                widget.monitors[i][l_tostr].occupied = true
            end
        end
    end

    for i, j in pairs(new_state.urgency) do
        for _, l in pairs(j) do
            if l ~= 0 then
                local l_tostr = tostring(math.floor(l))

                if widget.monitors[i][l_tostr] == nil then
                    widget.monitors[i][l_tostr] = tag()
                end

                widget.monitors[i][l_tostr].occupied = true
            end
        end
    end

    print(cjson.encode(widget))
    -- print(inspect(widget))
end
