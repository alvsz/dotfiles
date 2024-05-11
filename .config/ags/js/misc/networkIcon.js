import Network from "resource:///com/github/Aylur/ags/service/network.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";

export const wifiIcon = () =>
  Widget.Icon(Network.wifi?.iconName).hook(Network, (self) => {
    self.icon = Network.wifi?.iconName || "";
  });

export const wiredIcon = () =>
  Widget.Icon(Network.wired?.iconName).hook(Network, (self) => {
    self.icon = Network.wired?.iconName || "";
  });

export const networkIndicator = () =>
  Widget.Stack({
    className: "wifiIcon",
    transition: "slide_down",

    children: {
      offline: Widget.Icon("network-offline"),
      wifi: wifiIcon(),
      wired: wiredIcon(),
    },
  }).hook(Network, (self) => {
    self.shown = Network.primary || "offline";
  });
