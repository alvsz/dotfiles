// import GLib from "gi://GLib";
import Gdk from "gi://Gdk";
import GtkSessionLock from "gi://GtkSessionLock";
import App from "resource:///com/github/Aylur/ags/app.js";
// import Utils from "resource:///com/github/Aylur/ags/utils.js";

import lockscreen from "./js/windows/lockscreen.js";
// import { cssPath } from "./js/utils.js";

if (!GtkSessionLock.is_supported()) {
  print("Error: ext-session-lock-v1 is not supported");
  App.quit();
}

const sessionLock = GtkSessionLock.prepare_lock();
const display = Gdk.Display.get_default();

display.connect("monitor-added", (_, monitor) => {
  const window = lockscreen(monitor, display, sessionLock);
  sessionLock.new_surface(window, monitor);
  window.show_all();
});

sessionLock.connect("locked", () => {
  print("sessão bloqueada");
});

sessionLock.connect("finished", () => {
  print("sessão desbloqueada");
  App.quit();
});

sessionLock.lock_lock();

for (let i = 0; i < display.get_n_monitors(); i++) {
  const monitor = display.get_monitor(i);
  const window = lockscreen(monitor, display, sessionLock);
  sessionLock.new_surface(window, monitor);
  window.show_all();
}

// App.config({
//   style: cssPath,
// });
