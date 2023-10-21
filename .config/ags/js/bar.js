import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import Audio from "resource:///com/github/Aylur/ags/service/audio.js";
import Bluetooth from "resource:///com/github/Aylur/ags/service/bluetooth.js";
import Battery from "resource:///com/github/Aylur/ags/service/battery.js";
import SystemTray from "resource:///com/github/Aylur/ags/service/systemtray.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Network from "resource:///com/github/Aylur/ags/service/network.js";
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
    style: "font: 13pt siji",
    valign: "center",
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
          const title = mon.title != ""
            ? mon.title
            : mon.appid != ""
              ? mon.appid
              : "";

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
    valign: "center",
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
    halign: "start",
    valign: "center",
    className: "layoutIcon",
    // className: "tag",
    child: Widget.Label({
      style: "font: 13pt siji",
      connections: [
        [
          dwlIpc,
          (self) => {
            const mon = dwlIpc.value[monitorId];
            // self.label = mon.title;

            self.label = mon.layout.new.symbol;
          },
        ],
      ],
    }),
  });

const dwl = (monitorId) =>
  Widget.Box({
    spacing: 8,
    halign: "start",
    valign: "fill",
    vexpand: true,
    className: "module",
    children: [dwlTags(monitorId), layoutIcon(monitorId), client(monitorId)],
  });

const archDash = () =>
  Widget.Button({
    child: Widget.Label({
      label: "",
      style:
        "color: #1793d1; font: 12pt Symbols Nerd Font; margin: 0px 14px 0px 14px;",
    }),
    halign: "start",
    valign: "fill",
    onPrimaryClick: () => {
      Utils.execAsync(["echo", "Hi Mom"]);
    },
    className: "module",
  });

const Left = (monitorId) =>
  Widget.Box({
    spacing: 10,
    halign: "start",
    valign: "fill",
    hexpand: true,
    vexpand: true,
    homogeneous: false,
    style: "margin: 3px 0px 0px 10px; min-height: 30px",
    children: [archDash(), dwl(monitorId)],
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
              self.label = `${mpris.trackArtists.join(", ")
                } - ${mpris.trackTitle}`;
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
      // Media(),
      Notification(),
    ],
  });

const SysTray = (monitorId) =>
  Widget.Box({
    className: "sysTray",
    valign: "center",
    spacing: 5,
    connections: [
      [
        SystemTray,
        (self) => {
          self.children = SystemTray.items.map((item) =>
            Widget.Button({
              child: Widget.Icon({ binds: [["icon", item, "icon"]] }),
              valign: "center",
              className: "trayItem",
              onPrimaryClick: (_, event) => item.activate(event),
              onSecondaryClick: (_, event) => item.openMenu(event),
              binds: [["tooltipText", item, "tooltipMarkup"]],
            })
          );
        },
      ],
      [
        dwlIpc,
        (self) => {
          self.visible = dwlIpc.value[monitorId].active;
        },
      ],
    ],
  });

const wifiIcon = () =>
  Widget.Icon({
    className: "wifiIcon",
    connections: [
      [
        Network,
        (self) => {
          if (Network.connectivity == "unknown") {
            self.icon = "network-wireless-no-route-symbolic";
          } else if (Network.connectivity == "none") {
            self.icon = "network-wireless-offline-symbolic";
          } else if (
            Network.connectivity == "portal" ||
            Network.connectivity == "limited"
          ) {
            self.icon = "network-wireless-acquiring-symbolic";
          } else {
            self.icon = Network.wifi?.iconName || "";
          }
          // self.icon = Network.wifi?.iconName || "";
        },
      ],
    ],
  });

const wifiBox = () => {
  let revealer = Widget.Revealer({
    revealChild: false,
    transitionDuration: 500,
    transition: "slide_right",
    child: Widget.Label({
      connections: [
        [
          Network,
          (self) => {
            self.label = Network.wifi?.ssid;
          },
        ],
      ],
    }),
  });

  return Widget.EventBox({
    className: "wifiBox",
    child: Widget.Box({
      spacing: 50,
      children: [revealer, wifiIcon()],
    }),
    onHover: () => {
      revealer.revealChild = true;
    },
    onHoverLost: () => {
      revealer.revealChild = false;
    },
  });
};

const networkIndicator = () =>
  Widget.Stack({
    items: [
      // ["wifi", wifiBox()],
      ["wifi", wifiIcon()],
      [
        "wired",
        Widget.Icon({
          connections: [
            [
              Network,
              (self) => {
                if (Network.connectivity == "unknown") {
                  self.icon = "network-wired-no-route-symbolic";
                } else if (Network.connectivity == "none") {
                  self.icon = "network-wired-offline-symbolic";
                } else if (
                  Network.connectivity == "portal" ||
                  Network.connectivity == "limited"
                ) {
                  self.icon = "network-wired-acquiring-symbolic";
                } else {
                  self.icon = Network.wired?.iconName || "";
                }
                self.shown = Network.primary;
              },
            ],
          ],
        }),
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

          if (Audio.speaker.isMuted) {
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

          let active = false;
          for (const dev of Bluetooth.connectedDevices) {
            if (dev.connected) {
              active = true;
              break;
            }
          }

          !active
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

const Clock = () =>
  Widget.Label({
    className: "clock",
    connections: [
      [
        5000,
        (self) =>
          execAsync(["date", "+%a %d, %R"])
            .then((date) => (self.label = date))
            .catch(console.error),
      ],
    ],
  });

const Right = (monitorId) =>
  Widget.Box({
    halign: "end",
    className: "module",
    spacing: 7,
    style: "margin: 3px 10px 0px 0px; min-height: 30px",
    children: [
      SysTray(monitorId),
      networkIndicator(),
      // wifiBox(),
      audioIcon(),
      bluetoothIcon(),
      batteryIcon(),
      batteryLabel(),
      Clock(),
    ],
  });

const Bar = ({ monitor } = {}) =>
  Widget.Window({
    name: `bar-${monitor}`,
    className: "bar",
    monitor,
    layer: "bottom",
    anchor: ["top", "left", "right"],
    exclusive: true,
    className: "barwindow",
    child: Widget.CenterBox({
      startWidget: Left(monitor),
      centerWidget: Center(monitor),
      endWidget: Right(monitor),
    }),
  });

export default Bar;