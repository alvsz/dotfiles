local cjson = require("cjson")
local dwl = require("dwl")

local map = function(arr, func)
	local new_arr = {}
	for i, v in ipairs(arr) do
		new_arr[i] = func(v, i)
	end
	setmetatable(new_arr, cjson.empty_array_mt)
	return new_arr
end

get_status = function()
	local monitors = dwl.get_monitors()

	local status = map(monitors, function(m, i)
		return {
			name = m.name,
			layout = m.layout,
			seltags = m.seltags,
			mfact = m.mfact,
			nmaster = m.nmaster,
			scale = m.scale,
			gaps = m.gaps,
			coords = {
				x = m.x,
				y = m.y,
			},
			id = i - 1,
			focused = m.focused,
			address = m.address,
			clients = map(m.clients, function(c, j)
				return {
					app_id = c.app_id,
					title = c.title,
					tags = c.tags,
					x11 = c.x11,
					monitor_index = i,
					monitor = c.monitor.address,
					geometry = c.geometry,
					floating = c.floating,
					urgent = c.urgent,
					fullscreen = c.fullscreen,
					nokill = c.nokill,
					focused = c.focused,
					address = c.address,
					scratchkey = c.scratchkey,
					pos = j - 1,
				}
			end),
		}
	end)

	return cjson.encode(status)
end

dwl.cfg = {
	autostart = function()
		io.popen("systemctl --user import-environment WAYLAND_DISPLAY XDG_CURRENT_DESKTOP")
		io.popen("dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP=wlroots")
		-- io.popen("alacritty")
		io.popen("~/.config/dwl/autostart.sh")

		-- print("autostart")
	end,

	printstatus = function()
		-- print("status")
	end,

	reload = function()
		-- print("reload")
	end,

	env = {
		["XDG_CURRENT_DESKTOP"] = "wlroots",
	},

	theme = {
		["root"] = "#222222ff",
		["normal"] = "#444444ff",
		["focus"] = "#005577ff",
		["urgent"] = "#ff0000ff",
		["float"] = "#ff0000ff",
		["border_width"] = 2,
	},

	input_config = {
		["LIBINPUT_DEFAULT_ACCELERATION_PROFILE"] = "ADAPTIVE",
		["LIBINPUT_DEFAULT_ACCELERATION"] = 0,
		["LIBINPUT_DEFAULT_CLICK_METHOD"] = "CLICKFINGER",
		["LIBINPUT_DEFAULT_DISABLE_WHILE_TYPING"] = 1,
		["LIBINPUT_DEFAULT_LEFT_HANDED"] = 0,
		["LIBINPUT_DEFAULT_MIDDLE_EMULATION"] = 1,
		["LIBINPUT_DEFAULT_NATURAL_SCROLL"] = 1,
		["LIBINPUT_DEFAULT_TAP"] = 1,
		["LIBINPUT_DEFAULT_DRAG"] = 1,
		["LIBINPUT_DEFAULT_SCROLL_METHOD"] = "EDGE",
	},
}
