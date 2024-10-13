local cjson = require("cjson")
local socket = require("socket")

local map = function(arr, func)
	local new_arr = {}
	for i, v in ipairs(arr) do
		new_arr[i] = func(v, i)
	end
	setmetatable(new_arr, cjson.empty_array_mt)
	return new_arr
end

local function emit_event(c, event)
	-- print("Emitindo evento: "..event)
	c:send(event .. "\n")
end

local function is_mon_active(m)
	for _, c in ipairs(m.clients) do
		if c.focused then
			return true
		end
	end
	return false
end

dwl_cfg = {
	autostart = function()
		io.popen("systemctl --user import-environment WAYLAND_DISPLAY XDG_CURRENT_DESKTOP")
		io.popen("dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP=wlroots")
		io.popen("~/.config/dwl/autostart.sh")

		server = socket.bind("localhost", 12345)
		server:settimeout(0)
		print("Servidor esperando por conexões...")
		clients = {}

		print("autostart")
	end,

	printstatus = function()
		print("status")

		local monitors = get_monitors()

		local status = map(monitors, function(m, i)
			return {
				name = m.name,
				layout = m.layout,
				seltags = m.seltags,
				mfact = m.mfact,
				nmaster = m.nmaster,
				scale = m.scale,
				gaps = m.gaps,
				x = m.x,
				y = m.y,
				id = i - 1,
				active = is_mon_active(m),
				clients = map(m.clients, function(c, j)
					return {
						app_id = c.app_id,
						title = c.title,
						tags = c.tags,
						type = c.type,
						monitor = i,
						geometry = c.geometry,
						isfloating = c.isfloating,
						isurgent = c.isurgent,
						isfullscreen = c.isfullscreen,
						nokill = c.nokill,
						focused = c.focused,
						pos = j - 1,
					}
				end),
			}
		end)

		if server then
			local c = server:accept()

			if c then
				print("Novo cliente conectado!")
				c:settimeout(0)
				table.insert(clients, c)
			end

			local readable = socket.select(clients, nil, 0)

			for _, client in ipairs(readable) do
				local data, err = client:receive()
				if data then
					print("Dados recebidos do cliente: " .. data)
				elseif err == "closed" then
					print("Cliente desconectado.")
					client:close()

					for i, cl in ipairs(clients) do
						if cl == client then
							table.remove(clients, i)
							break
						end
					end
				end
			end

			if #clients > 0 then
				for _, client in ipairs(clients) do
					emit_event(client, cjson.encode(status))
				end
			end
		else
			print("não tem server")
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
