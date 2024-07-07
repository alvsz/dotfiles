import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Audio from "resource:///com/github/Aylur/ags/service/audio.js";
import Network from "resource:///com/github/Aylur/ags/service/network.js";
import Bluetooth from "resource:///com/github/Aylur/ags/service/bluetooth.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import Battery from "resource:///com/github/Aylur/ags/service/battery.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";

import GLib from "gi://GLib";
import Gtk from "gi://Gtk";

const RadioButton = Widget.subclass(Gtk.RadioButton);

import { iconFile, realName } from "../misc/User.js";
import audioIcon from "../misc/audioIcon.js";
import networkIndicator from "../misc/networkIcon.js";
import bluetoothIcon from "../misc/bluetoothIcon.js";
import scrollable from "../misc/bouncingText.js";
import mediaPlayer from "../misc/mediaPlayer.js";

const networkButton = () =>
  Widget.Button({
    className: "networkButton",

    onPrimaryClick: () => {
      Network.toggleWifi();
    },

    child: Widget.Box({
      vertical: false,
      homogeneous: false,
      spacing: 0,
      children: [
        networkIndicator(),

        Widget.Box({
          vertical: true,
          homogeneous: false,
          hpack: "fill",
          vpack: "center",
          hexpand: true,
          children: [
            Widget.Label({
              className: "networkType",
              justification: "left",
              hpack: "start",
              wrap: true,
            }).hook(Network, (self) => {
              let active = true;

              switch (Network.primary) {
                case "wifi":
                  self.label = "Rede sem fio";
                  break;
                case "wired":
                  self.label = "Rede cabeada";
                  break;
                default:
                  active = false;
                  self.label = "Offline";
              }
              self.parent.parent.parent.toggleClassName("active", active);
            }),

            scrollable({
              child: Widget.Label({
                className: "networkName",
                justification: "left",
                hpack: "start",
              }).hook(Network, (self) => {
                self.label = Network.wifi.ssid;
                self.parent.visible =
                  Network.primary === "wifi" && Network.wifi.ssid.length > 0;
              }),
            }),
          ],
        }),
      ],
    }),
    // onClicked: (self) => {
    //   self.parent.visible = false;
    // },
  });

const bluetoothButton = () =>
  Widget.Button({
    className: "bluetoothButton",

    onPrimaryClick: () => {
      Bluetooth.toggle();
    },

    child: Widget.Box({
      vertical: false,
      homogeneous: false,
      spacing: 0,
      children: [
        bluetoothIcon(),

        Widget.Box({
          vertical: true,
          homogeneous: false,
          hpack: "fill",
          vpack: "center",
          hexpand: true,
          children: [
            Widget.Label({
              className: "bluetoothStatus",
              justification: "left",
              hpack: "start",
              label: "Bluetooth",
            }),

            scrollable({
              child: Widget.Label({
                className: "bluetoothDevice",
                justification: "left",
                hpack: "start",
              }).hook(Bluetooth, (self) => {
                let active = false;

                for (const dev of Bluetooth.connectedDevices) {
                  if (dev.connected) {
                    self.label = dev.alias;
                    active = true;
                    break;
                  }
                }

                self.parent.visible = active;
                self.parent.parent.parent.parent.parent.toggleClassName(
                  "active",
                  active,
                );
              }),
            }),
          ],
        }),
      ],
    }),
  });

const controlCenter = () => {
  const flowBox = Widget.FlowBox({
    maxChildrenPerLine: 2,
    minChildrenPerLine: 2,
    selectionMode: 0,
    homogeneous: true,

    className: "controlCenter",
  });

  flowBox.add(networkButton());
  flowBox.add(bluetoothButton());

  const stack = Widget.Stack({
    transition: "slide_down",
    children: {
      flowbox: flowBox,
    },
    shown: "flowbox",
  });

  return stack;
};

const userCenter = () => {
  const userImage = Widget.Icon({
    className: "userImage",
    icon: iconFile,
    hpack: "start",
  });

  const powerMenu = Widget.Revealer({
    transition: "slide_down",
    transitionDuration: 500,

    child: Widget.Box({
      vertical: true,
      homogeneous: true,
      className: "powerMenu",

      children: [
        Widget.Button({
          child: Widget.Label("desligar"),
          onClicked: () => {
            Utils.exec("systemctl poweroff");
          },
        }),

        Widget.Button({
          child: Widget.Label("reiniciar"),
          onClicked: () => {
            Utils.exec("systemctl reboot");
          },
        }),

        Widget.Button({
          child: Widget.Label("sair"),
          onClicked: () => {
            Utils.exec("loginctl terminate-session self");
          },
        }),

        Widget.Button({
          child: Widget.Label("bloquear"),
          onClicked: () => {
            Utils.exec("loginctl lock-session");
          },
        }),
      ],
    }),
  });

  const powerButton = Widget.Button({
    child: Widget.Icon("system-shutdown-symbolic"),
    vpack: "center",
    hpack: "end",
    onClicked: (_) => {
      powerMenu.set_reveal_child(!powerMenu.child_revealed);
    },
  });

  const batteryIcon = () =>
    Widget.Icon({
      vpack: "center",
      icon: Battery.bind("iconName"),
    });

  const batteryLabel = () =>
    Widget.Label({
      vpack: "center",
      label: Battery.bind("percent").as((l) => `${l}%`),
    });

  const batteryBox = Widget.Box({
    className: "batteryBox",
    vpack: "center",
    children: [batteryIcon(), batteryLabel()],
    visible: Battery.bind("available"),
  }).hook(Battery, (self) => {
    let tooltip;

    if (Battery.charged) tooltip = "Carregado";
    else {
      let time = Math.floor(Battery.time_remaining / 60);

      if (Battery.charging) tooltip = `${time} minuto(s) até a carga completa`;
      else tooltip = `${time} minuto(s) restante`;
    }

    self.tooltip_text = tooltip;
  });

  const info = Widget.Box({
    vertical: false,
    homogeneous: false,
    className: "info",
    vpack: "start",
    hpack: "fill",
    hexpand: true,
    children: [
      userImage,

      Widget.Box({
        vertical: true,
        homogeneous: false,
        vpack: "center",
        hpack: "start",
        hexpand: true,
        vexpand: true,

        children: [
          Widget.Label({
            label: realName,
            vpack: "start",
            hpack: "start",
            justification: "left",
            className: "realName",
          }),
          Widget.Label({
            label: `${GLib.get_user_name()}@${GLib.get_host_name()}`,
            vpack: "end",
            hpack: "start",
            justification: "left",
            className: "hostName",
          }),
        ],
      }),

      batteryBox,

      powerButton,
    ],

    setup: (self) => {
      self.children.length > 0 &&
        self.children[0].toggleClassName("firstH", true);
    },
  });

  return Widget.Box({
    vertical: true,
    spacing: 0,
    homogeneous: false,
    className: "userCenter",
    vpack: "start",
    hpack: "fill",
    children: [
      info,
      powerMenu,
      // volumeInfo(),
      controlCenter(),
    ],

    setup: (self) => {
      const update = () => {
        const array1 = [
          info,
          powerMenu,
          // volumeInfo(),
          Mpris.players.map((p) => mediaPlayer(p)),
          controlCenter(),
        ].flat(1);

        self.children = array1;
      };

      Mpris.connect("player-closed", () => {
        update();
      });

      Mpris.connect("player-added", () => {
        update();
      });

      self.children.length > 0 &&
        self.children[0].toggleClassName("first", true);
    },
  });
};

const dashboard = () =>
  Widget.Window({
    name: "dashboard",
    layer: "overlay",
    anchor: ["top", "right"],
    visible: false,
    child: userCenter(),
  });

export default dashboard;
