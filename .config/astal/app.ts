import { App, Astal } from "astal/gtk4";
import style from "./style.scss";
import Bar from "./window/Bar";

App.start({
  instanceName: "js",
  requestHandler(request, res) {
    print(request);
    res("ok");
  },
  css: style,
  main() {
    new Bar();
  },
});
