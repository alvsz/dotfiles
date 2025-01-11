import { App } from "astal/gtk4";
import style from "./style.scss";
import Bar from "./window/Bar";

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
    App.get_monitors().map((m) => new Bar(m));
    // new Bar();
  },
});
