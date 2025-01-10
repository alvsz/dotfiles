import { App } from "astal/gtk4";
import style from "./style.scss";
import Bar from "./window/Bar";

App.start({
  instanceName: "js",
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
