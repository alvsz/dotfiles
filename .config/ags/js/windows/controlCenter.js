import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Audio from "resource:///com/github/Aylur/ags/service/audio.js";
// import GLib from "gi://GLib";

import { iconFile, realName } from "../misc/User.js";
import audioIcon from "../misc/audioIcon.js";

print(realName);
print(iconFile);

const getDefaultSink = () => {
  const defaultStream = Audio.control.get_default_sink();

  if (defaultStream) return Audio.getStream(defaultStream.id);
  else return Audio.speakers[0];
};

const volumeInfo = () => {
  const volumeBar = Widget.Box({
    vertical: false,
    homogeneous: false,
    spacing: 0,
    children: [
      audioIcon(),

      Widget.ProgressBar({
        vertical: false,
        className: "volumeBar",
        vpack: "center",
      }).hook(Audio, (self) => {
        self.value = getDefaultSink().volume;
      }),

      Widget.Button({
        child: Widget.Icon("go-down"),
      }),
    ],
  });

  return Widget.Box({
    vertical: true,
    homogeneous: false,
    spacing: 0,
    className: "volumeInfo",
    children: [volumeBar],
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
