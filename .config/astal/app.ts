import { App, Gdk } from "astal/gtk4";
import { Gio, monitorFile } from "astal/file";
import { exec } from "astal/process";

import style from "./style/style.scss";

import Bar from "./window/Bar";
import Calendar from "./window/calendar";
import NotificationPopups from "./window/NotificationPopups";
import {
  AuthenticationAgent,
  AuthenticationDialog,
} from "./service/polkitAgent";
import PolkitDialog from "./window/Polkit";
import Lock from "./window/Lockscreen";
import AppMenu from "./window/AppMenu";

const main = () => {
  App.get_monitors().map((m) => new Bar(m));
  new Calendar();
  new NotificationPopups();
  new AppMenu();

  const agent = new AuthenticationAgent();
  agent.enable();
  agent.connect(
    "initiate",
    (self: AuthenticationAgent, a: AuthenticationDialog) => {
      new PolkitDialog(a, self);
    },
  );

  monitorFile("./style/", (file) => {
    print("scss updated", file);
    exec(`sass ./style/style.scss ./style.css`);
    App.apply_css("./style.css", true);
  });

  const display = Gdk.Display.get_default();
  if (display) {
    const monitors = display.get_monitors();
    monitors.connect(
      "notify::items-changed",
      (
        self: Gio.ListModel<Gdk.Monitor>,
        position: number,
        removed: number,
        added: number,
      ) => {
        print("items changed", self, position, removed, added);
        if (added > 1 || removed > 1) print("bugou total");
        else {
          print("removed ", removed);
          print("added", added);

          if (added) {
            const mon = monitors.get_item(position) as Gdk.Monitor | null;
            if (mon) new Bar(mon);
          }
        }
      },
    );
  }
};

const lock = new Lock();

App.start({
  instanceName: "astal",
  requestHandler(request, res) {
    if (request == "lock") {
      lock.lock_now();
    } else print(request);
    res("ok");
  },
  css: style,
  main: main,
});
