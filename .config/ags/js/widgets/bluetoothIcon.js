import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Bluetooth from "resource:///com/github/Aylur/ags/service/bluetooth.js";

globalThis.bluetooth = Bluetooth;

import icons from "../icons.js";

const bluetoothIcon = () =>
  Widget.Icon({
    className: "bluetoothIcon",
    visible: false,
  }).hook(Bluetooth, (self) => {
    if (Bluetooth.enabled) {
      self.icon = icons.bluetooth.enabled;
    } else {
      self.icon = icons.bluetooth.disabled;
    }

    let active = false;
    for (const dev of Bluetooth.connectedDevices) {
      if (dev.connected) {
        active = true;
        break;
      }
    }

    active
      ? (self.className = "bluetoothIcon connected")
      : (self.className = "bluetoothIcon");
  });

export default bluetoothIcon;
