import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";

import scrollable from "../misc/bouncingText.js";

const FALLBACK_ICON = "audio-x-generic-symbolic";
const PLAY_ICON = "media-playback-start-symbolic";
const PAUSE_ICON = "media-playback-pause-symbolic";
const PREV_ICON = "media-skip-backward-symbolic";
const NEXT_ICON = "media-skip-forward-symbolic";

const lengthStr = (length) => {
  const min = Math.floor(length / 60);
  const sec = Math.floor(length % 60);
  const sec0 = sec < 10 ? "0" : "";
  return `${min}:${sec0}${sec}`;
};

const mediaPlayer = (player) => {
  const slider = Widget.Slider({
    vertical: false,
    className: "position",
    vpack: "center",
    hexpand: true,

    drawValue: false,
    min: 0,
    max: 1,

    on_change: ({ value }) => (player.position = value * player.length),
    visible: player.bind("length").as((l) => l > 0),

    setup: (self) => {
      const update = () => {
        const value = player.position / player.length;
        self.value = value > 0 ? value : 0;
      };

      self.hook(player, update);
      self.hook(player, update, "position");
      self.poll(500, update);
    },
  });

  const positionTimer = Widget.Label({
    hpack: "start",
    vpack: "end",
    className: "positionTimer",
    visible: player.bind("length").as((l) => l > 0),

    setup: (self) => {
      const update = (_, time) => {
        self.label = lengthStr(time || player.position);
        self.visible = player.length > 0;
      };

      self.hook(player, update);
      self.hook(player, update, "position");
      self.poll(500, update);
    },
  });

  // const playbackStatus = Widget.Label({
  //   label: player.bind("play-back-status"),
  // });

  const lengthTimer = Widget.Label({
    hpack: "end",
    vpack: "end",
    className: "lengthTimer",
    visible: player.bind("length").transform((l) => l > 0),
    label: player.bind("length").transform(lengthStr),
  });

  const playPause = Widget.Button({
    class_name: "play-pause",
    on_clicked: () => player.playPause(),
    visible: player.bind("can_play"),
    child: Widget.Icon({
      icon: player.bind("play_back_status").transform((s) => {
        switch (s) {
          case "Playing":
            return PAUSE_ICON;
          case "Paused":
          case "Stopped":
            return PLAY_ICON;
        }
      }),
    }),
  });

  const prev = Widget.Button({
    on_clicked: () => player.previous(),
    visible: player.bind("can_go_prev"),
    child: Widget.Icon(PREV_ICON),
  });

  const next = Widget.Button({
    on_clicked: () => player.next(),
    visible: player.bind("can_go_next"),
    child: Widget.Icon(NEXT_ICON),
  });

  const albumCover = Widget.Icon({
    className: "albumCover",
  }).hook(player, (self) => {
    self.visible = player.coverPath != null;
    self.icon = player.coverPath;
  });

  const trackTitle = Widget.Box({
    vertical: false,
    homogeneous: false,
    children: [
      scrollable({
        child: Widget.Label({
          label: player.bind("trackTitle"),
          className: "trackTitle",
          hexpand: true,
          hpack: "start",
        }),
      }),

      Widget.Icon({
        className: "playerIcon",
        hpack: "end",
      }).hook(player, (self) => {
        self.tooltipText = player.identity;
        let icon;

        if (Utils.lookUpIcon(player.name)) {
          icon = player.name;
        } else {
          const palavras = player.identity.split(" ");

          palavras.forEach((element) => {
            if (Utils.lookUpIcon(element.toLowerCase())) {
              icon = element;
            }
          });
        }

        if (icon) self.icon = icon;
        else self.icon = FALLBACK_ICON;
      }),
    ],
  });

  const artists = scrollable({
    child: Widget.Label({
      label: player.bind("track_artists").transform((a) => a.join(", ")),
      className: "artists",
      hexpand: true,
      hpack: "start",
    }),
  });

  return Widget.Box({
    vertical: false,
    homogeneous: false,
    className: "mediaPlayer",
    children: [
      albumCover,

      Widget.Box({
        vertical: true,
        homogeneous: false,
        hpack: "fill",
        vpack: "fill",

        children: [
          trackTitle,
          artists,
          slider,
          Widget.Box({
            vertical: false,
            homogeneous: false,
            hpack: "fill",
            vpack: "end",
            children: [
              positionTimer,

              Widget.Box({
                homogeneous: true,
                vertical: false,
                hexpand: true,
                hpack: "center",
                vpack: "center",
                children: [prev, playPause, next],
              }),

              lengthTimer,
            ],
          }),
        ],
      }),
    ],
  });
};

export default mediaPlayer;
