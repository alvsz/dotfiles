import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import GLib from "gi://GLib";

import Spacer from "../misc/Spacer.js";

const clock = () =>
  Widget.Label({
    className: "time",
    // hpack: "center",
    connections: [
      [
        30000,
        (self) => {
          const time = GLib.DateTime.new_from_unix_local(Date.now() / 1000);
          self.label = time.format("%R");
        },
      ],
    ],
  });

const date = () =>
  Widget.Label({
    className: "date",
    // hpack: "center",
    connections: [
      [
        30000,
        (self) => {
          const time = GLib.DateTime.new_from_unix_local(Date.now() / 1000);
          self.label = time.format("%A, %d de %B");
        },
      ],
    ],
  });

const albumArt = () =>
  Widget.Box({
    className: "albumArt",
    hpack: "center",
  })
    .hook(Mpris, (self) => {
      const temp = Mpris.getPlayer("");

      if (temp && temp.coverPath) {
        self.css = `background-image: url("${temp.coverPath}")`;
        self.visible = true;
      } else {
        self.visible = false;
      }
    })
    .on("draw", (album, _) => {
      const height = album.get_allocated_height();
      album.set_size_request(height, height);
    });

const Backdrop = ({ monitor } = {}) =>
  Widget.Window({
    name: `backdrop-${monitor}`,
    monitor: monitor,
    layer: "background",
    exclusivity: "ignore",
    anchor: ["top", "left", "right", "bottom"],
    child: Widget.Box({
      className: "backdrop",
      vertical: true,
      homogeneous: false,
      children: [
        // clock(),
        date(),
        clock(),
        Spacer("spacer1"),
        albumArt(),
      ],
    }),
  });

export default Backdrop;
