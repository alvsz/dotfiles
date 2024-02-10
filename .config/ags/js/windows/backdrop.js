import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import GLib from "gi://GLib";

const clock = () =>
  Widget.Label({
    className: "time",
    hpack: "center",
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
    hpack: "center",
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
    hpack: "center",
    children: [
      Widget.Icon({
        className: "albumArt",
      }).hook(Mpris, (self) => {
        const temp = Mpris.getPlayer("");
        if (temp) {
          self.icon = temp.coverPath;
          self.visible = true;
        } else {
          icon.visible = false;
        }
      }),
    ],
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
      hpack: "center",
      homogeneous: false,
      children: [
        // clock(),
        date(),
        clock(),
        albumArt(),
      ],
    }),
  });

export default Backdrop;
