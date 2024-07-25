// import GLib from "gi://GLib";
import Gdk from "gi://Gdk";

import GtkSessionLock from "gi://GtkSessionLock";

import lockscreen from "../windows/lockscreen.js";

globalThis.gtksessionlock = GtkSessionLock;

const lock = () => {
  if (!GtkSessionLock.is_supported()) return;

  const sessionLock = GtkSessionLock.prepare_lock();
  const display = Gdk.Display.get_default();

  const unlock = () => {
    sessionLock.unlock_and_destroy();
    display.sync();
  };

  const create_lock_window = () => {
    const window = new Gtk.Window();
    const entry = new Gtk.Entry({
      visibility: false,
      valign: Gtk.Align.CENTER,
      halign: Gtk.Align.CENTER,
    });
    entry.connect("activate", unlock);
    window.add(entry);
    return window;
  };

  sessionLock.connect("locked", () => {
    print("sessão bloqueada");
  });

  sessionLock.connect("finished", () => {
    print("sessão desbloqueada");
  });

  sessionLock.lock_lock();

  for (let i = 0; i < display.get_n_monitors(); i++) {
    const monitor = display.get_monitor(i);
    const window = create_lock_window();
    // const window = lockscreen(monitor, display, sessionLock);
    sessionLock.new_surface(window, monitor);
    // window.show_all();
  }
};

export default lock;
