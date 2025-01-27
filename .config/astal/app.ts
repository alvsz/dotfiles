import { App } from "astal/gtk4";
import { monitorFile } from "astal/file";
import { GLib } from "astal/gobject";
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

const main = () => {
  App.get_monitors().map((m) => new Bar(m));
  new Calendar();
  new NotificationPopups();

  const agent = new AuthenticationAgent();
  agent.enable();

  agent.connect(
    "initiate",
    (self: AuthenticationAgent, a: AuthenticationDialog) => {
      new PolkitDialog(a, self);
    },
  );

  monitorFile("./style/", (file: string) => {
    print("scss updated", file);
    exec(`sass ./style/style.scss ./style.css`);
    App.apply_css("./style.css", true);
  });
};

App.start({
  instanceName: "astal",
  requestHandler(request, res) {
    print(request);
    res("ok");
  },
  css: style,
  main: main,
});
