import { App } from "astal/gtk4";
import { monitorFile } from "astal/file";
import { GLib } from "astal/gobject";
import { exec } from "astal/process";

import style from "./style/style.scss";

import Bar from "./window/Bar";
import Calendar from "./window/calendar";

import mprisButton from "./widget/barMprisButton";
mprisButton;
import networkIcon from "./widget/networkIcon";
networkIcon;
import sysTray from "./widget/sysTray";
sysTray;

// const scss_path = `${GLib.getenv("XDG_CONFIG_DIR")}/astal/style/scss`;

App.start({
  instanceName: "astal",
  requestHandler(request, res) {
    print(request);
    res("ok");
  },
  css: style,
  main: () => {
    App.get_monitors().map((m) => new Bar(m));
    new Calendar();

    monitorFile("./style/", (file: string) => {
      print("scss updated", file);
      exec(`sass ./style/style.scss ./style.css`);
      App.apply_css("./style.css", true);
    });
  },
});
