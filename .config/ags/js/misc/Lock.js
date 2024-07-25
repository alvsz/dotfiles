// import GLib from "gi://GLib";
import Gdk from "gi://Gdk";

import GtkSessionLock from "gi://GtkSessionLock";

import lockscreen from "../windows/lockscreen.js";

globalThis.gtksessionlock = GtkSessionLock;

const lock = () => {
  if (!GtkSessionLock.is_supported()) return;

  const sessionLock = GtkSessionLock.prepare_lock();
  const display = Gdk.Display.get_default();

  sessionLock.connect("locked", () => {
    print("sessão bloqueada");

    for (let i = 0; i < display.get_n_monitors(); i++) {
      const monitor = display.get_monitor(i);
      const window = lockscreen(monitor, display, sessionLock);
      sessionLock.new_surface(window, monitor);
      // window.show_all();
    }
  });

  sessionLock.connect("finished", () => {
    print("sessão desbloqueada");
  });

  sessionLock.lock_lock();
};

export default lock;
