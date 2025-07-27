import { App, Gdk } from "astal/gtk4";
import { Gio, monitorFile } from "astal/file";
import { exec } from "astal/process";

import style from "./style/style.scss";

import Bar from "./window/Bar";
import Calendar from "./window/calendar";
import NotificationPopups from "./window/NotificationPopups";
import { AuthenticationAgent } from "./service/polkitAgent";
import PolkitDialog from "./window/Polkit";
import Lock from "./window/Lockscreen";
import AppMenu from "./window/AppMenu";
import libTrem from "gi://libTrem?version=0.1";
import NetworkDialog from "./window/NetworkDialog";

const main = () => {
  App.get_monitors().map((m) => new Bar(m));
  new Calendar();
  new NotificationPopups();
  new AppMenu();

  const auth_agent = new AuthenticationAgent();
  auth_agent.enable();
  auth_agent.connect("initiate", (self, a) => new PolkitDialog(a, self));

  // const network_agent = libTrem.NetworkSecretHandler.new(App.application_id);
  // network_agent.enable();
  // network_agent.connect(
  //   "initiate",
  //   (source, dialog) => new NetworkDialog(dialog),
  // );

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
