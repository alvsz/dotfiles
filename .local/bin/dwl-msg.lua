#!/bin/env lua5.4

local socket = require("socket")

local client

-- Função para enviar mensagens ao servidor
-- local function send_message(message)
-- 	print("Enviando mensagem: " .. message)
-- 	client:send(message .. "\n") -- Envia a mensagem com uma nova linha
-- end

-- Conecta ao servidor
client = socket.connect("localhost", 12345)

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
