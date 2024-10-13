-- local cjson = require("cjson")

-- local map = function(arr, func)
-- 	local new_arr = {}
-- 	for i, v in ipairs(arr) do
-- 		new_arr[i] = func(v, i)
-- 	end
-- 	setmetatable(new_arr, cjson.empty_array_mt)
-- 	return new_arr
-- end
dwl_cfg = {
	autostart = function()
		io.popen("systemctl --user import-environment WAYLAND_DISPLAY XDG_CURRENT_DESKTOP")
		io.popen("dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP=wlroots")
		io.popen("~/.config/dwl/autostart.sh")

		print("autostart")
	end,

	printstatus = function()
		print("status")

		-- local monitors = get_monitors()
		--
		-- local status = map(monitors, function(m, i)
		-- 	return {
		-- 		name = m.name,
		-- 		layout = m.layout,
		-- 		seltags = m.seltags,
		-- 		mfact = m.mfact,
		-- 		nmaster = m.nmaster,
		-- 		scale = m.scale,
		-- 		gaps = m.gaps,
		-- 		x = m.x,
		-- 		y = m.y,
		-- 		id = i,
		-- 		clients = map(m.clients, function(c, j)
		-- 			return {
		-- 				app_id = c.app_id,
		-- 				title = c.title,
		-- 				tags = c.tags,
		-- 				type = c.type,
		-- 				monitor = i,
		-- 				geometry = c.geometry,
		-- 				isfloating = c.isfloating,
		-- 				isurgent = c.isurgent,
		-- 				isfullscreen = c.isfullscreen,
		-- 				nokill = c.nokill,
		-- 				pos = j,
		-- 			}
		-- 		end),
		-- 	}
		-- end)
		-- print(cjson.encode(status))
	end,

	reload = function()
		print("reload")
	end,

	env = {
		["XDG_CURRENT_DESKTOP"] = "wlroots",
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
