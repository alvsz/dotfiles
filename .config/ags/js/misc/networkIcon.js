import Network from "resource:///com/github/Aylur/ags/service/network.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";

import wiredIcon from "./wiredIcon.js";
import wifiIcon from "./wifiIcon.js";

const networkIndicator = () =>
  Widget.Stack({
    className: "wifiIcon",
    transition: "slide_down",
    vpack: "center",

    children: {
      offline: Widget.Icon("network-offline"),
      wifi: wifiIcon(),
      wired: wiredIcon(),
    },
  }).hook(Network, (self) => {
    self.shown = Network.primary || "offline";
  });

export default networkIndicator;
