import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Audio from "resource:///com/github/Aylur/ags/service/audio.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";

import { iconFile, realName } from "../misc/User.js";
import audioIcon from "../misc/audioIcon.js";
import { getDefaultSink, getDefaultSource } from "../utils.js";

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
        print(param);
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

const controlCenter = () => {
  const flowBox = Widget.FlowBox({
    maxChildrenPerLine: 2,
    minChildrenPerLine: 2,
    selectionMode: 0,
    homogeneous: false,

    className: "controlCenter",
  });

  const hideButton = () =>
    Widget.Button({
      child: Widget.Label("esconder esse botão"),
      halign: "start",
      hexpand: false,
      onClicked: (self) => {
        self.parent.visible = false;
      },
    });

  const showButton = Widget.Button({
    onClicked: () => {
      flowBox.add(hideButton());
      flowBox.show_all();
    },

    halign: "start",
    hexpand: false,
    child: Widget.Label("mostrar tudo"),
  });

  flowBox.add(showButton);
  flowBox.add(hideButton());
  flowBox.add(hideButton());
  flowBox.add(hideButton());
  flowBox.add(hideButton());
  flowBox.add(hideButton());
  flowBox.add(hideButton());
  flowBox.add(hideButton());
  flowBox.add(hideButton());
  flowBox.add(hideButton());
  flowBox.add(hideButton());

  return flowBox;
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
            Utils.exec("loginctl terminate-session");
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

  return Widget.Box({
    vertical: true,
    spacing: 0,
    homogeneous: false,
    className: "userCenter",
    vpack: "start",
    hpack: "fill",
    children: [info, powerMenu, volumeInfo(), controlCenter()],
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
