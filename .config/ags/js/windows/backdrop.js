import Widget from "resource:///com/github/Aylur/ags/widget.js";
import GLib from "gi://GLib";

const clock = () =>
  Widget.Label({
    className: "time",
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
      children: [clock(), date()],
    }),
  });

export default Backdrop;
