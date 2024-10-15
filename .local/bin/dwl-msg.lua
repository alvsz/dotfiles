#!/bin/env lua5.4

local socket = require("socket")

local client

local port = tonumber(os.getenv("DWL_IPC_PORT"))

if not port then
	print("porta não definida")
	os.exit(1)
end

client = socket.connect("localhost", port)

if not client then
	print("falha ao conectar ao servidor")
	os.exit(1)
end
-- print("Conectado ao servidor!")

if arg[1] == "follow" then
	while true do
		local event, err = client:receive()

		if not err then
			print(event)
		else
			print("Erro ao receber evento: " .. err)
			break
		end
	end
elseif arg[1] == "status" then
	while true do
		local event, err = client:receive()

		if not err then
			print(event)
		else
			print("Erro ao receber evento: " .. err)
			break
		end

		client:close()
		break
	end
end

client:close()
