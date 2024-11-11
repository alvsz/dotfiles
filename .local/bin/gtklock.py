#!/bin/env python3

import gi
gi.require_version('Gtk', '3.0')
gi.require_version('GtkSessionLock', '0.1')
gi.require_version('AstalAuth', '0.1')
from gi.repository import Gtk, Gdk, GtkSessionLock
from gi.repository import AstalAuth as Auth

def callback(_, task) -> None:
    try:
        Auth.Pam.authenticate_finish(task)
        print("success")
        lock.unlock_and_destroy()
        display.sync()
        quit()
    except Exception as e:
        print(e)

if(not GtkSessionLock.is_supported()):
    quit()

lock = GtkSessionLock.prepare_lock()
display = Gdk.Display.get_default()

def unlock(widget):
    password = widget.get_text()
    Auth.Pam.authenticate(password, callback)

def create_lock_window():
    window = Gtk.Window()
    entry = Gtk.Entry(visibility=False,
                      valign=Gtk.Align.CENTER,
                      halign=Gtk.Align.CENTER)
    entry.connect("activate", unlock)
    window.add(entry)
    return window

def on_locked(lock):
    print("Your session is now locked.")

def on_finished(lock):
    print("Finished event received. Session could not be locked.")
    quit()

def on_monitor_added(_,monitor):
    window = create_lock_window()
    lock.new_surface(window,monitor)
    window.show_all()

lock.connect("locked", on_locked)
lock.connect("finished", on_finished)
display.connect("monitor-added", on_monitor_added)

lock.lock_lock()

for i in range(display.get_n_monitors()):
    window = create_lock_window()
    monitor = display.get_monitor(i)
    lock.new_surface(window, monitor)
    window.show_all()

Gtk.main()
