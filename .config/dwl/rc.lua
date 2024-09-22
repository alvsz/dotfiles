somar = function(a, b)
	print("o que acontece se printar aqui")
	return a + b
end

printstatus = function()
	-- print("novo status do dwl")

	local clients = get_clients()

	for index, client in pairs(clients) do
		print(index, client)
		print(client.app_id)
		print(client.title)
		print(client.isfloating)
	end
	-- print(clients)
	local monitors = get_monitors()

	for index, monitor in pairs(monitors) do
		print(index, monitor)
		print(monitor.layout)
		print(monitor.tagset1)
		print(monitor.tagset2)
		print(monitor.name)
	end

	-- print(clients, monitors)
end

-- print("teste")
--
-- local p = pessoa.new("joão", 30)
-- print(p)
-- print(p.teste)
-- print(p:get_nome())
--
-- local a = pessoa.new("pedro", 10)
-- print(a)
-- print(a.nome)
-- print(a.teste)
-- print(a:get_nome())
--
-- local biles = pessoa.cascadebiles()
-- print(biles)
--
-- -- print(inspect({ p, a, biles }))
--
-- local i = 0
--
-- while i < 999999 do
-- 	print(inspect(criar_array(3)))
-- 	i = i + 1
-- end
--
print("acabou-se o que era douce")
-- print(printstatus())
