import Network from "resource:///com/github/Aylur/ags/service/network.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";

const wiredIcon = () =>
  Widget.Icon(Network.wired?.iconName).hook(Network, (self) => {
    self.icon = Network.wired?.iconName || "";
  });

export default wiredIcon;
