import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Network from "resource:///com/github/Aylur/ags/service/network.js";
import Bluetooth from "resource:///com/github/Aylur/ags/service/bluetooth.js";
import powerProfiles from "resource:///com/github/Aylur/ags/service/powerprofiles.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import Battery from "resource:///com/github/Aylur/ags/service/battery.js";
import Audio from "resource:///com/github/Aylur/ags/service/audio.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";

import GLib from "gi://GLib";
import Gtk from "gi://Gtk";

import icons from "../icons.js";
import { iconFile, realName } from "../misc/User.js";
import networkIndicator from "../widgets/networkIcon.js";
import bluetoothIcon from "../widgets/bluetoothIcon.js";
import mediaPlayer from "../widgets/mediaPlayer.js";
import networkInfo from "../widgets/networkInfo.js";
import bluetoothInfo from "../widgets/bluetoothInfo.js";
import audioBar from "../widgets/audioBar.js";
import deviceList from "../widgets/UPowerDevices.js";

globalThis.powerprofiles = powerProfiles;

const RadioButton = Widget.subclass(Gtk.RadioButton);

const networkPopup = networkInfo();
const bluetoothPopup = bluetoothInfo();

const make_audio_list = (a, sink) => {
  const make_button = (stream, group) => {
    const b = RadioButton({
      active: Audio.bind(sink ? "speaker" : "microphone").as(
        (s) => s.id === stream.id,
      ),
      child: Widget.Label({
        hexpand: true,
        truncate: "end",
        hpack: "start",
        label: stream.bind("description"),
      }),
    }).on("toggled", (s) => {
      if (s.active === true) {
        if (sink) Audio.control.set_default_sink(stream.stream);
        else Audio.control.set_default_source(stream.stream);
      }
    });

    if (group.length > 0) b.join_group(group[0]);
    return b;
  };

  let c = new Array();

  for (const s of a) {
    c.push(make_button(s, c));
  }
  return c;
};

const make_audio_info = (sink) => {
  const revealer = Widget.Revealer({
    transition: "slide_down",
    child: Widget.Box({
      vertical: true,
      homogeneous: false,
      children: [
        Widget.Label({
          label: sink ? "Dispositivos de saída" : "Dispositivos de entrada",
        }),
        Widget.Separator({
          hexpand: true,
          vertical: false,
        }),
        Widget.Box({
          vertical: true,
          homogeneous: false,
          children: Audio.bind(sink ? "speakers" : "microphones").as((a) =>
            make_audio_list(a, sink),
          ),
        }),
      ],
    }),
  });

  const button = Widget.ToggleButton({
    child: Widget.Icon(icons.ui.arrow.down),
    vpack: "center",
    hpack: "end",
    onToggled: ({ active }) => (revealer.revealChild = active),
  });

  return Widget.Box({
    vertical: true,
    homogeneous: false,
    className: sink ? "speakers" : "microphones",
    visible: Audio.bind(sink ? "speakers" : "microphones").as((a) =>
      a.length > 0 ? true : false,
    ),
    children: [
      Widget.Box({
        vertical: false,
        children: [audioBar(sink), button],
      }),
      revealer,
    ],
  });
};

const sliders = Widget.Box({
  vertical: true,
  homogeneous: false,
  hpack: "fill",
  vpack: "fill",
  className: "audioInfo",
  children: [make_audio_info(true), make_audio_info(false)],
});

const networkButton = Widget.Button({
  className: "networkButton",

  onClicked: () => {
    stack.shown = "networkPopup";
    if (Network.wifi.enabled) Network.wifi.scan();
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
    stack.shown = "bluetoothPopup";
    // if (Bluetooth.enabled) Bluetooth._client.default_adapter_setup_mode = true;
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

const mpris = () =>
  Widget.Box({
    vertical: true,
    homogeneous: false,
    className: "mpris",
    setup: (self) => {
      const update = () => {
        self.children = Mpris.players.map((p) => mediaPlayer(p));
      };

      Mpris.connect("player-closed", () => {
        update();
      });

      Mpris.connect("player-added", () => {
        update();
      });
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

  const powerButton = Widget.ToggleButton({
    child: Widget.Icon(icons.powermenu.shutdown),
    vpack: "center",
    hpack: "end",
    onToggled: ({ active }) => {
      powerMenu.set_reveal_child(active);
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
    // visible: Battery.bind("available"),
  }).hook(Battery, (self) => {
    let tooltip;

    if (Battery.charged) tooltip = "Carregado";
    else {
      let time = Math.floor(Battery.time_remaining / 60);

      if (Battery.charging) tooltip = `${time} minuto(s) até a carga completa`;
      else tooltip = `${time} minuto(s) restante`;
    }

    self.tooltip_text = tooltip;
    self.visible = Battery.available;
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
      mpris(),
      deviceList(),
      // volumeInfo(),
      flowBox,
    ],
  });
};

const stack = Widget.Stack({
  transition: "slide_up_down",
  vpack: "start",
  homogeneous: false,

  children: {
    networkPopup: networkPopup,
    bluetoothPopup: bluetoothPopup,
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
