import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import GLib from "gi://GLib";

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
  }).on("draw", (album, cr) => {
    print("largura:");
    print(album.get_allocated_width());
    print("altura:");
    print(album.get_allocated_height());
    print("\n\n\n");
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

// const albumArt = () =>
//   Widget.Icon({
//     className: "albumArt",
//   }).hook(Mpris, (self) => {
//     const temp = Mpris.getPlayer("");
//
//     if (temp) {
//       self.icon = temp.coverPath;
//       self.visible = true;
//     } else {
//       self.visible = false;
//     }
//   });
//
const albumArt = () =>
  Widget.Box({
    className: "albumArt",
    hpack: "center",
  })
    .hook(Mpris, (self) => {
      const temp = Mpris.getPlayer("");

      if (temp) {
        self.css = `background-image: url("${temp.coverPath}")`;
        self.visible = true;
      } else {
        self.visible = false;
      }
    })
    .on("draw", (album, cr) => {
      print("largura:");
      print(album.get_allocated_width());
      print("altura:");
      print(album.get_allocated_height());
      print("\n\n\n");
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
      // hpack: "center",
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
