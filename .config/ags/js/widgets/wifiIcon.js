import Network from "resource:///com/github/Aylur/ags/service/network.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";

const wifiIcon = () =>
  Widget.Icon(Network.wifi?.iconName).hook(Network, (self) => {
    self.icon = Network.wifi?.iconName || "";
  });

export default wifiIcon;
