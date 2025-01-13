import { App } from "astal/gtk4";
import { monitorFile } from "astal/file";

// import Notifd from "gi://AstalNotifd";

import style from "./style/style.scss";

import Bar from "./window/Bar";
import Calendar from "./window/calendar";

import mprisButton from "./widget/barMprisButton";
mprisButton;
import networkIcon from "./widget/networkIcon";
networkIcon;
import sysTray from "./widget/sysTray";
sysTray;

App.start({
  instanceName: "astal",
  requestHandler(request, res) {
    print(request);
    res("ok");
  },
  css: style,
  main: () => {
    // print(Notifd.get_default());
    // print(Notifd.get_default());
    // print(Notifd.get_default());

    App.get_monitors().map((m) => new Bar(m));
    new Calendar();

    monitorFile("./style/", (file: string) => {
      print("scss updated", file);
      // App.apply_css("./style/style.scss", true);
    });
  },
});
