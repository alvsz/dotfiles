import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";

import scrollable from "../misc/bouncingText.js";

const mediaPlayer = (player) => {
  const slider = Widget.Slider({
    vertical: false,
    className: "position",
    vpack: "center",
    hexpand: true,

    drawValue: false,
    min: 0,
    max: 1,
  });

  const positionTimer = Widget.Label({
    hpack: "start",
  });

  const playbackStatus = Widget.Label({
    label: player.bind("play-back-status"),
  });

  const lengthTimer = Widget.Label({
    hpack: "end",
  });

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

              if (Utils.lookUpIcon(player.name)) {
                self.icon = player.name;
              } else {
                const palavras = player.identity.split(" ");

                palavras.forEach((element) => {
                  if (Utils.lookUpIcon(element.toLowerCase())) {
                    self.icon = element;
                  }
                });
              }
            }),
          ],
        }),

        centerWidget: slider,

        endWidget: Widget.CenterBox({
          vertical: false,
          startWidget: positionTimer,
          centerWidget: playbackStatus,
          endWidget: lengthTimer,
        }),
      }).poll(500, () => {
        if (player.length == -1 || player.position == -1) {
          slider.value = 0;
          positionTimer.visible = false;
          lengthTimer.visible = false;
          return;
        }
        positionTimer.visible = true;
        lengthTimer.visible = true;

        slider.value = player.position / player.length;

        const pmins = Math.floor(player.position / 60);
        const psecs = Math.floor(player.position - 60 * pmins);

        positionTimer.label = `${String(pmins).padStart(2, "0")}:${String(
          psecs,
        ).padStart(2, "0")}`;

        const mins = Math.floor(player.length / 60);
        const secs = Math.floor(player.length - 60 * mins);

        lengthTimer.label = `${String(mins).padStart(2, "0")}:${String(
          secs,
        ).padStart(2, "0")}`;
      }),
    ],
  });
};

export default mediaPlayer;
