import Widget from "resource:///com/github/Aylur/ags/widget.js";

import scrollable from "../misc/bouncingText.js";

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

            self.label = `${String(mins).padStart(2, "0")}:${String(
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

            self.label = `${String(mins).padStart(2, "0")}:${String(
              secs,
            ).padStart(2, "0")
              }`;
          }),
        }),
      }),
    ],
  });
};

export default mediaPlayer;
