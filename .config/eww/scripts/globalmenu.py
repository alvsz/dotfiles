#!/bin/env python3

import dbus
import dbus.service
from dbus.mainloop.glib import DBusGMainLoop
from gi.repository import GLib


class AppMenuRegistrar(dbus.service.Object):
    def __init__(self, bus_name, object_path):
        dbus.service.Object.__init__(self, bus_name, object_path)

    @dbus.service.method(dbus_interface='com.canonical.AppMenu.Registrar',
                         in_signature='s', out_signature='b')
    def RegisterWindow(self, window_id):
        print("RegisterWindow called for window_id:", window_id)
        # Aqui você pode adicionar a lógica para registrar o menu da janela
        # e retornar True se for bem-sucedido, ou False caso contrário.
        return True

    @dbus.service.method(dbus_interface='com.canonical.AppMenu.Registrar',
                         in_signature='s', out_signature='')
    def UnregisterWindow(self, window_id):
        print("UnregisterWindow called for window_id:", window_id)
        # Aqui você pode adicionar a lógica para remover o registro do menu da janela.

    @dbus.service.method(dbus_interface='com.canonical.AppMenu.Registrar',
                         in_signature='', out_signature='')
    def Status(self):
        print("Status called")
        # Aqui você pode adicionar a lógica para retornar o status do serviço.


if __name__ == '__main__':
    DBusGMainLoop(set_as_default=True)
    session_bus = dbus.SessionBus()
    bus_name = dbus.service.BusName('com.canonical.AppMenu', bus=session_bus)
    app_menu_registrar = AppMenuRegistrar(bus_name, '/com/canonical/AppMenu/Registrar')

    mainloop = GLib.MainLoop()
    mainloop.run()

