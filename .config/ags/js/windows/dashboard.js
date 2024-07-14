import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Network from "resource:///com/github/Aylur/ags/service/network.js";
import Bluetooth from "resource:///com/github/Aylur/ags/service/bluetooth.js";
import powerProfiles from "resource:///com/github/Aylur/ags/service/powerprofiles.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import Battery from "resource:///com/github/Aylur/ags/service/battery.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";

import GLib from "gi://GLib";
import Gtk from "gi://Gtk";

import { iconFile, realName } from "../misc/User.js";
import networkIndicator from "../misc/networkIcon.js";
import bluetoothIcon from "../misc/bluetoothIcon.js";
import mediaPlayer from "../misc/mediaPlayer.js";
import networkInfo from "../misc/networkInfo.js";

globalThis.powerprofiles = powerProfiles;

const RadioButton = Widget.subclass(Gtk.RadioButton);

const networkPopup = networkInfo();

// import audioBar from "../misc/audioBar.js";

const sliders = Widget.Box({
  vertical: true,
  homogeneous: false,
  hpack: "fill",
  vpack: "fill",
  className: "sliders",

  children: [
    RadioButton({
      child: Widget.Label("teste"),
    }),
    RadioButton({
      child: Widget.Label("teste"),
    }),
    RadioButton({
      child: Widget.Label("teste"),
    }),
    RadioButton({
      child: Widget.Label("teste"),
    }),
    RadioButton({
      child: Widget.Label("teste"),
    }),
    RadioButton({
      child: Widget.Label("teste"),
    }),
  ],
});

const networkButton = Widget.Button({
  className: "networkButton",

  onClicked: () => {
    stack.shown = "networkPopup";
    Network?._device?.request_scan_async();
  },

  child: Widget.Box({
    vertical: false,
    homogeneous: false,
    spacing: 0,
    children: [
      networkIndicator(),
      Widget.Label({
        className: "networkType",
        justification: "left",
        hpack: "start",
        wrap: false,
        truncate: "end",
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
        self.parent.parent.toggleClassName("active", active);
      }),
    ],
  }),
});

const bluetoothButton = Widget.Button({
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
      Widget.Label({
        className: "bluetoothStatus",
        justification: "left",
        hpack: "start",
        label: "Bluetooth",
      }),
    ],
  }),
}).hook(Bluetooth, (self) => {
  self.toggleClassName("active", Bluetooth.enabled);
});

const flowBox = Widget.FlowBox({
  maxChildrenPerLine: 2,
  minChildrenPerLine: 2,
  selectionMode: 0,
  homogeneous: true,

  className: "controlCenter",
  setup: (self) => {
    self.add(networkButton);
    self.add(bluetoothButton);
  },
});

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
      sliders,
      // volumeInfo(),
      flowBox,
    ],

    setup: (self) => {
      const update = () => {
        const array1 = [
          info,
          powerMenu,
          sliders,
          Mpris.players.map((p) => mediaPlayer(p)),
          flowBox,
          // networkPopup,
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

const stack = Widget.Stack({
  transition: "slide_up_down",
  vpack: "start",
  homogeneous: false,

  children: {
    networkPopup: networkPopup,
    userCenter: userCenter(),
  },
  shown: "userCenter",
});

const dashboard = () =>
  Widget.Window({
    name: "dashboard",
    layer: "overlay",
    anchor: ["top", "right"],
    visible: false,

    child: Widget.Box({
      className: "dashboard",
      children: [stack],
    }),
  });

export default dashboard;
