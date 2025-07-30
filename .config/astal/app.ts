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
  auth_agent.connect("initiate", (self, a) => print(new PolkitDialog(a, self)));

  const network_agent = libTrem.NetworkSecretHandler.new(App.application_id);
  network_agent.enable(null);
  network_agent.connect("initiate", (_, d) => print(new NetworkDialog(d)));

  monitorFile("./style/", (file) => {
    print("scss updated", file);
    exec(`sass ./style/style.scss ./style.css`);
    App.apply_css("./style.css", true);
  });

  libTrem.DwlIpc.get_default()?.connect("monitor-added", (source, address) => {
    // new Bar();
  });
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
