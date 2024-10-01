dwl_cfg = {
	autostart = function()
		-- { "systemctl", "--user", "import-environment", "WAYLAND_DISPLAY", "XDG_CURRENT_DESKTOP" }
		-- {"dbus-update-activation-environment","--systemd","WAYLAND_DISPLAY","XDG_CURRENT_DESKTOP=wlroots",}
		-- { "sh", "-c", "~/.config/dwl/autostart.sh" }

		io.popen("systemctl --user import-environment WAYLAND_DISPLAY XDG_CURRENT_DESKTOP")
		io.popen("dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP=wlroots")
		io.popen("~/.config/dwl/autostart.sh")

		print("autostart")
	end,

	printstatus = function()
		print("status")

		local clients = get_clients()
		local monitors = get_monitors()

		for i, c in pairs(clients) do
			for j, m in pairs(monitors) do
				local visible = c:visibleon(m)
				print(i, j, "cliente " .. c.app_id .. " visivel no monitor " .. m.name .. ": " .. visible)
			end
		end
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
