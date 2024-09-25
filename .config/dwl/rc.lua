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
		--
		for index, client in pairs(clients) do
			print(index, client.app_id)
			-- 	print(client.app_id)
			-- 	print(client.title)
			-- 	print(client.isfloating)
		end
		-- -- print(clients)
		local monitors = get_monitors()
		--
		for index, monitor in pairs(monitors) do
			print(index, monitor)
			-- 	print(monitor.layout)
			-- 	print(monitor.tagset1)
			-- 	print(monitor.tagset2)
			-- 	print(monitor.name)
		end

		-- print(clients, monitors)
	end,

	env = {
		["key"] = "value",
		["XDG_CURRENT_DESKTOP"] = "wlroots",
	},
}
