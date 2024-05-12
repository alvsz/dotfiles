import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Audio from "resource:///com/github/Aylur/ags/service/audio.js";
import Network from "resource:///com/github/Aylur/ags/service/network.js";
import Bluetooth from "resource:///com/github/Aylur/ags/service/bluetooth.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";

import { iconFile, realName } from "../misc/User.js";
import audioIcon from "../misc/audioIcon.js";
import { getDefaultSink, getDefaultSource } from "../utils.js";
import networkIndicator from "../misc/networkIcon.js";
import bluetoothIcon from "../misc/bluetoothIcon.js";
import scrollable from "../misc/bouncingText.js";

const audioBar = (sink) =>
  Widget.Overlay({
    child: Widget.Slider({
      vertical: false,
      className: sink ? "volumeBar" : "micBar",
      vpack: "center",
      hexpand: true,

      // vexpand: true,

      onChange: ({ value }) => {
        if (sink) {
          const sink = getDefaultSink();
          if (sink) sink.volume = value;
        } else {
          const source = getDefaultSource();
          if (source) source.volume = value;
        }
      },

      drawValue: false,
      min: 0,
      max: 1,
    }).hook(Audio, (self) => {
      if (sink) {
        const sink = getDefaultSink();
        self.value = sink ? getDefaultSink().volume : 0;
      } else {
        const source = getDefaultSource();
        self.value = source ? getDefaultSource().volume : 0;
      }
    }),
    overlays: [
      audioIcon(!sink).on("realize", (self) => (self.hpack = "start")),
    ],
  });

const audioList = (isSink) => {
  const formatter = (stream) =>
    Widget.ToggleButton({
      child: Widget.Label({
        label: stream.description,
        maxWidthChars: 25,
        truncate: "end",
      }),

      active: isSink
        ? getDefaultSink()?.id === stream.id
        : getDefaultSource()?.id === stream.id,

      onToggled: () => {
        // print(param);
        Audio.control.set_default_sink(stream.stream);
      },
    });

  return Widget.Box({
    vertical: true,
    homogeneous: false,
    spacing: 0,
  }).hook(
    Audio,
    (self) => {
      if (isSink) {
        if (Audio.speakers.length > 0) {
          self.children = Audio.speakers.map(formatter);
          self.visible = true;
        } else {
          self.children = [];
          self.visible = false;
        }
      } else {
        if (Audio.speakers.length > 0) {
          self.children = Audio.microphones.map(formatter);
          self.visible = true;
        } else {
          self.children = [];
          self.visible = false;
        }
      }
    },
    isSink ? "speaker-changed" : "microphone-changed",
  );
};

const volumeInfo = () => {
  const sinkList = audioList(true);
  const sourceList = audioList(false);

  const volumeList = Widget.Revealer({
    transition: "slide_down",
    transitionDuration: 500,
    className: "volumeList",
    child: Widget.Box({
      vertical: true,
      homogeneous: false,
      children: [
        audioBar(false),

        Widget.Separator({
          vertical: false,
          className: "first",
        }),

        sinkList,

        Widget.Separator({
          vertical: false,
        }).hook(
          Audio,
          (self) => {
            self.visible = Audio.microphones.length > 0;
          },
          "microphone-changed",
        ),

        sourceList,
        Widget.Separator({
          vertical: false,
          className: "last",
        }),
      ],
    }),
  });

  const volumeListButton = Widget.Button({
    className: "volumeButton",
    vpack: "center",
    child: Widget.Icon("go-down"),
    onClicked: (_) => {
      volumeList.set_reveal_child(!volumeList.child_revealed);
    },
  });

  const volumeBar = Widget.Box({
    vertical: false,
    homogeneous: false,
    spacing: 0,
    children: [audioBar(true), volumeListButton],
  });

  const backlightBar = Widget.Overlay({
    child: Widget.Slider({
      vertical: false,
      className: "backlightBar",
      vpack: "center",
      hexpand: true,
      // vexpand: true,

      drawValue: false,
      min: 0,
      max: 1,
    }),

    overlays: [
      Widget.Icon({
        vpack: "center",
        hpack: "start",
        className: "backlightIcon",
        icon: "brightness-high",
      }),
    ],
  });

  return Widget.Box({
    vertical: true,
    homogeneous: false,
    spacing: 0,
    className: "volumeInfo",
    children: [volumeBar, volumeList, backlightBar],
  });
};

const networkButton = () =>
  Widget.Button({
    className: "networkButton",
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
              switch (Network.primary) {
                case "wifi":
                  self.label = "Rede sem fio";
                  break;
                case "wired":
                  self.label = "Rede cabeada";
                  break;
                default:
                  self.label = "Offline";
              }
            }),

            scrollable(
              Widget.Label({
                className: "networkName",
                justification: "left",
                hpack: "start",
              }).hook(Network, (self) => {
                self.label = Network.wifi.ssid;
                self.parent.visible = Network.primary === "wifi" &&
                  Network.wifi.ssid.length > 0;
              }),
              50,
            ),
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

    child: Widget.Box({
      vertical: false,
      homogeneous: false,
      spacing: 0,
      children: [
        bluetoothIcon(),

        Widget.Box({
          vertical: true,
          homogeneous: false,
          hpack: "start",
          vpack: "center",
          hexpand: true,
          children: [
            Widget.Label({
              className: "bluetoothStatus",
              justification: "left",
              hpack: "start",
              label: "Bluetooth",
            }),

            scrollable(
              Widget.Label({
                className: "bluetoothDevice",
                justification: "left",
                hpack: "start",
              }).hook(Network, (self) => {
                let active = false;

                for (const dev of Bluetooth.connectedDevices) {
                  if (dev.connected) {
                    self.label = dev.alias;
                    active = true;
                    break;
                  }
                }

                self.parent.visible = active;
              }),
            ),
          ],
        }),
      ],
    }),
    // onClicked: (self) => {
    //   self.parent.visible = false;
    // },
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

const mediaPlayer = (player) => {
  return Widget.Box({
    vertical: false,
    homogeneous: false,
    className: "mediaPlayer",
    children: [
      Widget.Icon({
        className: "albumCover",
      }).hook(player, (self) => {
        self.visible = player.coverPath != null;
        self.icon = player.coverPath;
      }),

      Widget.CenterBox({
        vertical: true,
        hpack: "fill",
        vpack: "fill",
        className: "rightstuff",
        startWidget: Widget.Box({
          vertical: false,
          homogeneous: false,
          children: [
            scrollable(
              Widget.Label({
                label: player.bind("trackTitle"),
                className: "trackTitle",
                hexpand: true,
                hpack: "start",
              }),
            ),
            Widget.Icon({
              icon: player.bind("name"),
              className: "playerIcon",
              hpack: "end",
            }),
          ],
        }),

        centerWidget: Widget.Slider({
          vertical: false,
          className: "position",
          vpack: "center",
          hexpand: true,

          drawValue: false,
          min: 0,
          max: 1,
        }).hook(player, (self) => {
          if (player.length === -1 || player.position === -1) {
            return;
          }

          self.value = player.position / player.length;
        }),

        endWidget: Widget.CenterBox({
          vertical: false,
          startWidget: Widget.Label({
            hpack: "start",
          }).hook(player, (self) => {
            if (player.length == -1 || player.position == -1) {
              self.label = "";
              self.visible = false;
            }

            const mins = Math.floor(player.position / 60);
            const secs = Math.floor(player.position - 60 * mins);

            self.label = `${String(mins).padStart(2, "0")}:${
              String(
                secs,
              ).padStart(2, "0")
            }`;
          }),

          centerWidget: Widget.Label({
            label: player.bind("play-back-status"),
          }),

          endWidget: Widget.Label({
            hpack: "end",
          }).hook(player, (self) => {
            if (player.length == -1 || player.position == -1) {
              self.label = "";
              self.visible = false;
            }

            const mins = Math.floor(player.length / 60);
            const secs = Math.floor(player.length - 60 * mins);

            self.label = `${String(mins).padStart(2, "0")}:${
              String(
                secs,
              ).padStart(2, "0")
            }`;
          }),
        }),
      }),
    ],
  });
};

const userCenter = () => {
  const userImage = Widget.Icon({
    className: "userImage",
    icon: iconFile,
  });

  const powerMenu = Widget.Revealer({
    transition: "slide_down",
    transitionDuration: 500,
    className: "powerMenu",
    child: Widget.Box({
      vertical: true,
      homogeneous: true,
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
    onClicked: (_) => {
      powerMenu.set_reveal_child(!powerMenu.child_revealed);
    },
  });

  const spacer = Widget.Box({
    hexpand: true,
    hpack: "fill",
  });

  const info = Widget.Box({
    vertical: false,
    homogeneous: false,
    spacing: 0,
    className: "info",
    vpack: "start",
    hpack: "fill",
    hexpand: true,
    children: [userImage, spacer, powerButton],
  });

  const players = Widget.Box({
    vertical: true,
    homogeneous: false,
    className: "players",
    children: Mpris.bind("players").as((p) => p.map(mediaPlayer)),
  });

  return Widget.Box({
    vertical: true,
    spacing: 0,
    homogeneous: false,
    className: "userCenter",
    vpack: "start",
    hpack: "fill",
    children: [info, powerMenu, volumeInfo(), players, controlCenter()],
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
