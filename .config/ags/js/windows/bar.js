import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import Bluetooth from "resource:///com/github/Aylur/ags/service/bluetooth.js";
import Battery from "resource:///com/github/Aylur/ags/service/battery.js";
import SystemTray from "resource:///com/github/Aylur/ags/service/systemtray.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Network from "resource:///com/github/Aylur/ags/service/network.js";
import Audio from "resource:///com/github/Aylur/ags/service/audio.js";

import GLib from "gi://GLib";

import { revealOnClick } from "../misc/Revealer.js";
import audioIcon from "../misc/audioIcon.js";
import icons from "../icons.js";

import * as user from "../misc/User.js";

globalThis.user = user;
globalThis.audio = Audio;
globalThis.battery = Battery;
globalThis.notification = Notifications;
globalThis.bluetooth = Bluetooth;
globalThis.network = Network;
globalThis.mpris = Mpris;

import { dwlIpc } from "../vars.js";

const Workspace = ({
  onPrimaryClick,
  onSecondaryClick,
  onMiddleClick,
  urgent,
  selected,
  occupied,
} = {}) =>
  Widget.Button({
    child: Widget.Label(urgent ? "" : selected ? "" : occupied ? "" : ""),
    onPrimaryClick: onPrimaryClick,
    onSecondaryClick: onSecondaryClick,
    onMiddleClick: onMiddleClick,
    vpack: "fill",
    className: urgent
      ? "urgent"
      : selected
        ? "selected"
        : occupied
          ? "occupied"
          : "normal",
  });

const genTags = (monitorId) => {
  let Tags = [];
  const mon = dwlIpc.value[monitorId];

  for (const tag of mon.tags) {
    let test = Workspace({
      urgent: tag.state == 2,
      selected: tag.state == 1,
      occupied: tag.clients > 0,
      onMiddleClick: () => { },
      onPrimaryClick: () => { },
      onSecondaryClick: () => { },
    });
    Tags.push(test);
  }
  return Tags;
};

const dwlTags = (monitorId) =>
  Widget.Box({
    vertical: false,
    spacing: 5,
    homogeneous: true,
    className: "dwlTags",
  }).hook(dwlIpc, (self) => {
    self.children = genTags(monitorId);
  });

const clientTitle = (monitorId) =>
  Widget.Label({
    className: "clientTitle",
  }).hook(dwlIpc, (self) => {
    const mon = dwlIpc.value[monitorId];
    const limitWidth = 45;
    const title =
      mon.title != "" ? mon.title : mon.appid != "" ? mon.appid : "";

    if (mon.title.length > limitWidth) {
      self.label = title.substring(0, limitWidth - 3) + "...";
    } else {
      self.label = title;
    }
  });

const clientIcon = (monitorId) =>
  Widget.Icon({
    className: "clientIcon",
    vpack: "fill",
  }).hook(dwlIpc, (self) => {
    const mon = dwlIpc.value[monitorId];

    self.icon = mon.appid;
  });

const client = (monitorId) =>
  Widget.Box({
    spacing: 5,
    homogeneous: false,
    children: [clientIcon(monitorId), clientTitle(monitorId)],
  }).hook(dwlIpc, (self) => {
    const mon = dwlIpc.value[monitorId];

    self.visible = mon.appid != "" || mon.title != "";
  });

const layoutIcon = (monitorId) =>
  Widget.Button({
    hpack: "start",
    vpack: "fill",
    className: "layoutIcon",
    child: Widget.Label({}),
  }).hook(dwlIpc, (self) => {
    const mon = dwlIpc.value[monitorId];

    self.label = mon.layout.new.symbol;
  });

const dwl = (monitorId) =>
  Widget.Box({
    spacing: 8,
    hpack: "start",
    vpack: "fill",
    vexpand: true,
    className: "module",
    children: [dwlTags(monitorId), layoutIcon(monitorId), client(monitorId)],
  });

const archDash = () =>
  Widget.Button({
    child: Widget.Label({
      label: "",
      className: "archDash",
    }),
    hpack: "start",
    vpack: "fill",
    onPrimaryClick: () => {
      utils.execAsync(["echo", "Hi Mom"]);
    },
    className: "module",
  });

const Media = () =>
  Widget.Button({
    className: "media",
    onPrimaryClick: () => Mpris.getPlayer("")?.playPause(),
    onScrollUp: () => Mpris.getPlayer("")?.next(),
    onScrollDown: () => Mpris.getPlayer("")?.previous(),
    child: Widget.Label({}),
  }).hook(Mpris, (self) => {
    const mpris = Mpris.getPlayer("");
    // mpris player can be undefined
    if (mpris) {
      self.label = `${mpris.trackArtists.join(", ")} - ${mpris.trackTitle}`;
    } else {
      self.label = "Nothing is playing";
    }
  });

// const password = () => {
//   let button = Widget.Button({
//     child: Widget.Icon("dialog-password-symbolic"),
//   });
//
//   let menu = Widget.Menu({
//     children: [
//       Widget.MenuItem({
//         child: Widget.Label("hello"),
//       }),
//       Widget.MenuItem({
//         // sensitive: false,
//         child: Widget.Entry({
//           primary_icon_name: "dialog-password-symbolic",
//           visible: false,
//         }),
//       }),
//     ],
//     className: "trayMenu",
//   });
//
//   button.onPrimaryClick = (_, event) => {
//     menu.popup_at_widget(button, 8, 2, event);
//   };
//
//   return button;
// };

const SysTray = () =>
  Widget.Box({
    className: "sysTray",
    vpack: "fill",
    spacing: 5,
  }).hook(SystemTray, (self) => {
    self.children = SystemTray.items.map((item) =>
      Widget.Button({
        child: Widget.Icon({ icon: item.bind("icon") }),
        vpack: "fill",
        className: "trayItem",
        onPrimaryClick: (_, event) => item.activate(event),
        onSecondaryClick: (_, event) => {
          item.menu.toggleClassName("trayMenu", true);
          item.openMenu(event);
        },
        tooltipText: item.bind("tooltip-markup"),
      }),
    );
  });
const wifiIcon = () =>
  Widget.Icon(Network.wifi?.iconName).hook(Network, (self) => {
    self.icon = Network.wifi?.iconName || "";
  });

const wiredIcon = () =>
  Widget.Icon(Network.wired?.iconName).hook(Network, (self) => {
    self.icon = Network.wired?.iconName || "";
  });

const networkIndicator = () =>
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

const batteryIcon = () =>
  Widget.Icon({
    className: "batteryIcon",
  }).hook(Battery, (self) => (self.icon = Battery.iconName));

const batteryLabel = () =>
  Widget.Label(`${Battery.percent}%`).hook(Battery, (self) => {
    self.label = `${Battery.percent}%`;
  });

const batteryBox = () => {
  return Widget.Box({
    spacing: 7,
    // visible: Battery.bind("available"),
    children: [batteryIcon(), batteryLabel()],
  }).hook(Battery, (self) => (self.visible = Battery.available));
};

const Clock = () =>
  Widget.Label({
    className: "clock",
  }).poll(30000, (self) => {
    const time = GLib.DateTime.new_from_unix_local(Date.now() / 1000);
    self.label = time.format("%a %d, %R");
  });

const Left = (monitorId) =>
  Widget.Box({
    spacing: 10,
    hpack: "start",
    vpack: "fill",
    hexpand: true,
    vexpand: true,
    homogeneous: false,
    className: "leftBar",
    children: [
      archDash(),
      dwl(monitorId),
      // Widget.Label(realName.recursiveUnpack().toString()),
    ],
  });

const Center = () =>
  Widget.Box({
    children: [
      Media(),
      // Notification(),
    ],
    className: "centerBar",
  });

const Right = (monitorId) =>
  Widget.Box({
    hpack: "end",
    hexpand: "false",
    spacing: 7,
    className: "rightBar",
    children: [
      revealOnClick({
        shown: Widget.Icon("go-first"),
        hidden: SysTray(),
      }).hook(dwlIpc, (self) => {
        self.visible = dwlIpc.value[monitorId].active;
      }),
      networkIndicator(),
      // wifiBox(),
      audioIcon(),
      bluetoothIcon(),
      // pwCalc(),
      batteryBox(),
      // batteryIcon(),
      // batteryLabel(),
      Clock(),
    ],
  });

const Bar = ({ monitor } = {}) =>
  Widget.Window({
    name: `bar-${monitor}`,
    monitor: monitor,
    layer: "bottom",
    anchor: ["top", "left", "right"],
    exclusivity: "exclusive",
    // exclusive: true,
    className: "barwindow",
    child: Widget.CenterBox({
      startWidget: Left(monitor),
      centerWidget: Center(monitor),
      endWidget: Right(monitor),
    }),
  });

export default Bar;
