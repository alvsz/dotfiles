import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import Audio from "resource:///com/github/Aylur/ags/service/audio.js";
import Bluetooth from "resource:///com/github/Aylur/ags/service/bluetooth.js";
import Battery from "resource:///com/github/Aylur/ags/service/battery.js";
import SystemTray from "resource:///com/github/Aylur/ags/service/systemtray.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Network from "resource:///com/github/Aylur/ags/service/network.js";

import GLib from "gi://GLib";

import { revealOnClick, revealOnHover } from "./misc/Revealer.js";

import * as user from "./misc/User.js";

globalThis.user = user;
globalThis.audio = Audio;
globalThis.battery = Battery;
globalThis.notification = Notifications;
globalThis.bluetooth = Bluetooth;
globalThis.network = Network;
// globalThis.glib = GLib;

import { exec, execAsync } from "resource:///com/github/Aylur/ags/utils.js";

import * as vars from "./vars.js";
import { dwlIpc } from "./vars.js";

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
    vpack: "center",
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
    spacing: 8,
    homogeneous: true,
    className: "dwlTags",
    connections: [
      [
        dwlIpc,
        (self) => {
          self.children = genTags(monitorId);
        },
      ],
    ],
  });

const clientTitle = (monitorId) =>
  Widget.Label({
    className: "clientTitle",
    connections: [
      [
        dwlIpc,
        (self) => {
          const mon = dwlIpc.value[monitorId];
          const limitWidth = 45;
          const title =
            mon.title != "" ? mon.title : mon.appid != "" ? mon.appid : "";

          if (mon.title.length > limitWidth) {
            self.label = title.substring(0, limitWidth - 3) + "...";
          } else {
            self.label = title;
          }
        },
      ],
    ],
  });

const clientIcon = (monitorId) =>
  Widget.Icon({
    className: "clientIcon",
    vpack: "center",
    connections: [
      [
        dwlIpc,
        (self) => {
          const mon = dwlIpc.value[monitorId];

          self.icon = mon.appid;
        },
      ],
    ],
  });

const client = (monitorId) =>
  Widget.Box({
    spacing: 5,
    homogeneous: false,
    children: [clientIcon(monitorId), clientTitle(monitorId)],
    connections: [
      [
        dwlIpc,
        (self) => {
          const mon = dwlIpc.value[monitorId];

          self.visible = mon.appid != "" || mon.title != "";
        },
      ],
    ],
  });

const layoutIcon = (monitorId) =>
  Widget.Button({
    hpack: "start",
    vpack: "center",
    className: "layoutIcon",
    child: Widget.Label({
      connections: [
        [
          dwlIpc,
          (self) => {
            const mon = dwlIpc.value[monitorId];

            self.label = mon.layout.new.symbol;
          },
        ],
      ],
    }),
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

const Media = () =>
  Widget.Button({
    className: "media",
    onPrimaryClick: () => Mpris.getPlayer("")?.playPause(),
    onScrollUp: () => Mpris.getPlayer("")?.next(),
    onScrollDown: () => Mpris.getPlayer("")?.previous(),
    child: Widget.Label({
      connections: [
        [
          Mpris,
          (self) => {
            const mpris = Mpris.getPlayer("");
            // mpris player can be undefined
            if (mpris) {
              self.label = `${mpris.trackArtists.join(", ")} - ${mpris.trackTitle
                }`;
            } else {
              self.label = "Nothing is playing";
            }
          },
        ],
      ],
    }),
  });

// we don't need dunst or any other notification daemon
// because the Notifications module is a notification daemon itself
const Notification = () =>
  Widget.Box({
    className: "notification",
    children: [
      Widget.Icon({
        icon: "preferences-system-notifications-symbolic",
        connections: [
          [
            Notifications,
            (self) => (self.visible = Notifications.popups.length > 0),
          ],
        ],
      }),
      Widget.Label({
        connections: [
          [
            Notifications,
            (self) => {
              self.label = Notifications.popups[0]?.summary || "";
            },
          ],
        ],
      }),
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

const SysTray = () =>
  Widget.Box({
    className: "sysTray",
    vpack: "center",
    spacing: 5,
    connections: [
      [
        SystemTray,
        (self) => {
          self.children = SystemTray.items.map((item) =>
            Widget.Button({
              child: Widget.Icon({ binds: [["icon", item, "icon"]] }),
              vpack: "center",
              className: "trayItem",
              onPrimaryClick: (_, event) => item.activate(event),
              onSecondaryClick: (_, event) => item.openMenu(event),
              binds: [["tooltipText", item, "tooltip-markup"]],
            }),
          );
        },
      ],
    ],
  });

const wifiIcon = () =>
  Widget.Icon({
    connections: [
      [
        Network,
        (self) => {
          self.icon = Network.wifi?.iconName || "";
        },
      ],
    ],
  });

const wiredIcon = () =>
  Widget.Icon({
    connections: [
      [
        Network,
        (self) => {
          self.icon = Network.wired?.iconName || "";
        },
      ],
    ],
  });

const networkIndicator = () =>
  Widget.Stack({
    className: "wifiIcon",
    items: [
      ["offline", Widget.Icon("network-offline")],
      ["wifi", wifiIcon()],
      ["wired", wiredIcon()],
    ],
    connections: [
      [
        Network,
        (self) => {
          self.shown = Network.primary || "offline";
        },
      ],
    ],
  });

const audioIcon = () =>
  Widget.Icon({
    className: "audioIcon",
    connections: [
      [
        Audio,
        (self) => {
          if (!Audio.speaker) return;

          const vol = Audio.speaker.volume * 100;
          let icon;

          if (Audio.control.get_default_sink().get_is_muted()) {
            self.icon = "audio-volume-muted-symbolic";
          } else {
            icon = [
              [101, "overamplified"],
              [67, "high"],
              [34, "medium"],
              [1, "low"],
              [0, "muted"],
            ].find(([threshold]) => threshold <= vol)[1];

            self.icon = `audio-volume-${icon}`;
          }
          self.tooltipText = `Volume ${Math.floor(vol)}%`;
        },
        "speaker-changed",
      ],
    ],
  });

const bluetoothIcon = () =>
  Widget.Icon({
    className: "bluetoothIcon",
    visible: false,
    connections: [
      [
        Bluetooth,
        (self) => {
          let icon;

          if (Bluetooth.enabled) {
            icon = "active";
          } else {
            icon = "disabled";
          }

          self.icon = `bluetooth-${icon}-symbolic`;

          // for (const dev of Bluetooth.connectedDevices) {
          //   if (dev.connected) {
          //     self.visible = true;
          //     break;
          //   }
          // }

          let active = false;
          for (const dev of Bluetooth.connectedDevices) {
            if (dev.connected) {
              active = true;
              break;
            }
          }
          // let active = true;

          active
            ? (self.className = "bluetoothIcon connected")
            : (self.className = "bluetoothIcon");
        },
      ],
    ],
  });

const batteryIcon = () =>
  Widget.Icon({
    className: "batteryIcon",
    connections: [[Battery, (self) => (self.icon = Battery.iconName)]],
  });

const batteryLabel = () =>
  Widget.Label({
    connections: [
      [
        Battery,
        (self) => {
          self.label = `${Battery.percent}%`;
        },
      ],
    ],
  });

const batteryBox = () =>
  Battery.available
    ? Widget.Box({
      spacing: 7,
      children: [batteryIcon(), batteryLabel()],
    })
    : null;

const Clock = () =>
  Widget.Label({
    className: "clock",
    connections: [
      [
        5000,
        (self) => {
          let time = GLib.DateTime.new_from_unix_local(Date.now() / 1000);
          self.label = time.format("%a %d, %R");
        },
      ],
    ],
  });

const Right = (monitorId) =>
  Widget.Box({
    hpack: "end",
    hexpand: "false",
    spacing: 7,
    className: "rightBar",
    children: [
      revealOnClick({
        // shown: Widget.Label("teste"),
        shown: Widget.Icon("go-first"),
        hidden: SysTray(),
        connections: [
          [
            dwlIpc,
            (self) => {
              self.visible = dwlIpc.value[monitorId].active;
            },
          ],
        ],
      }),
      networkIndicator(),
      // wifiBox(),
      audioIcon(),
      bluetoothIcon(),
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
