import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Audio from "resource:///com/github/Aylur/ags/service/audio.js";
// import GLib from "gi://GLib";

import { iconFile, realName } from "../misc/User.js";
import audioIcon from "../misc/audioIcon.js";
import { getDefaultSink, getDefaultSource } from "../utils.js";

print(realName);
print(iconFile);

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
          getDefaultSink().volume = value;
        } else {
          getDefaultSource().volume = value;
        }
      },

      drawValue: false,
      min: 0,
      max: 1,
    }).hook(Audio, (self) => {
      if (sink) {
        self.value = getDefaultSink().volume;
      } else {
        self.value = getDefaultSource().volume;
      }
    }),
    overlays: [
      audioIcon(!sink).on("realize", (self) => (self.hpack = "start")),
    ],
  });

const volumeInfo = () => {
  const sinkList = Widget.Box({
    vertical: true,
    homogeneous: false,
    spacing: 0,
    children: [
      Widget.Button({
        child: Widget.Label("desligar"),
      }),
      Widget.Button({
        child: Widget.Label("reiniciar"),
      }),
      Widget.Button({
        child: Widget.Label("sair"),
      }),
      Widget.Button({
        child: Widget.Label("bloquear"),
      }),
    ],
  });

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
        }),
        sinkList,
        Widget.Separator({
          vertical: false,
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
      // volumeList.child.children[0].toggleClassName("first", true);
    },
  });

  const volumeBar = Widget.Box({
    vertical: false,
    homogeneous: false,
    spacing: 0,
    children: [
      audioBar(true),
      // Widget.Overlay({
      //   child: audioBar(true),
      //
      //   overlays: [audioIcon().on("realize", (self) => (self.hpack = "start"))],
      // }),
      volumeListButton,
    ],
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
        }),
        Widget.Button({
          child: Widget.Label("reiniciar"),
        }),
        Widget.Button({
          child: Widget.Label("sair"),
        }),
        Widget.Button({
          child: Widget.Label("bloquear"),
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

  return Widget.Box({
    vertical: true,
    spacing: 0,
    homogeneous: false,
    className: "userCenter",
    vpack: "start",
    hpack: "fill",
    children: [info, powerMenu, volumeInfo()],
  });
};

const controlCenter = () =>
  Widget.Window({
    name: "dashboard",
    layer: "overlay",
    anchor: ["top", "right"],
    visible: true,
    child: userCenter(),
  });

export default controlCenter;
