import Widget from "resource:///com/github/Aylur/ags/widget.js";
// import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
// import GLib from "gi://GLib";
import Gtk from "gi://Gtk";
// import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";
import App from "resource:///com/github/Aylur/ags/app.js";
// import App from "resource:///com/github/Aylur/ags/app.js";

// import NotificationIcon from "../widgets/notificationIcon.js";
// import mpris from "../widgets/mediaPlayerVertical.js";

// const clock = () =>
//   Widget.Label({
//     className: "time",
//   }).poll(30000, (self) => {
//     const time = GLib.DateTime.new_from_unix_local(Date.now() / 1000);
//     self.label = time.format("%R");
//   });

// const date = () =>
//   Widget.Label({
//     className: "date",
//     hpack: "center",
//   }).poll(600000, (self) => {
//     const time = GLib.DateTime.new_from_unix_local(Date.now() / 1000);
//     self.label = time.format("%A, %d de %B");
//   });

// const player = () => {
//   return Widget.Box({
//     hpack: "center",
//     vpack: "end",
//
//     setup: (self) => {
//       const update = () => {
//         if (Mpris.players.length > 0) {
//           self.visible = true;
//           self.children = [mpris(Mpris.players[0])];
//         } else {
//           self.visible = false;
//           self.children = [];
//         }
//       };
//
//       update();
//
//       self.hook(Mpris, update, "player-closed");
//       self.hook(Mpris, update, "player-added");
//     },
//   });
// };

// const notification = (n) => {
//   const summary = Widget.Label({
//     className: "title",
//     vpack: "fill",
//     hpack: "start",
//     hexpand: true,
//
//     justification: "left",
//     truncate: "end",
//     wrap: false,
//     useMarkup: true,
//     label: n.summary.replaceAll("&", "&amp;"),
//   });
//
//   const time = Widget.Label({
//     label: GLib.DateTime.new_from_unix_local(n.time).format("%H:%M"),
//     className: "time",
//     vpack: "center",
//     justification: "right",
//     hpack: "end",
//   });
//
//   return Widget.Box({
//     className: `notification ${n.urgency}`,
//     vertical: false,
//     homogeneous: false,
//     hexpand: true,
//     attribute: { id: n.id },
//
//     children: [NotificationIcon(n), summary, time],
//   });
// };

// const notificationList = () =>
//   Widget.Box({
//     vertical: true,
//     hpack: "center",
//     vpack: "end",
//     className: "notificationList",
//     visible: true,
//   }).hook(Notifications, (self) => {
//     self.children = Notifications.notifications.reverse().map(notification);
//
//     if (self.children.length > 0) {
//       self.visible = true;
//       self.children[0].toggleClassName("first", true);
//     } else self.visible = false;
//   });

const lockscreen = (monitor, display, lock) => {
  const geometry = monitor.get_geometry();
  // const WINDOW_NAME = `backdrop-${monitor}`;

  return new Gtk.Window({
    // name: WINDOW_NAME,
    // gdkmonitor: monitor,
    // monitor: monitor,
    // layer: "background",
    // exclusivity: "ignore",
    visible: true,
    default_width: geometry.width,
    default_height: geometry.height,
    // anchor: [],
    // anchor: ["top", "bottom", "left", "right"],
    child: Widget.Box({
      className: "backdrop",
      hpack: "center",
      vpack: "center",
      hexpand: true,
      vexpand: true,
      vertical: true,
      homogeneous: false,
      // css: `min-width: ${geometry.width}px; min-height: ${geometry.height}px`,

      children: [
        // date(),
        // clock(),
        // Widget.Scrollable({
        //   className: "scroll",
        //   hpack: "center",
        //   vexpand: true,
        //   hexpand: true,
        //   hscroll: "never",
        //   vscroll: "automatic",
        //
        //   vscrollbar_policy: 3,
        //
        //   child: Widget.Box({
        //     vertical: true,
        //     vexpand: true,
        //     vpack: "end",
        //     homogeneous: false,
        //     children: [player(), notificationList()],
        //   }),
        // }),

        Widget.Button({
          onClicked: () => {
            lock.unlock_and_destroy();
            display.sync();
            App.quit();
            // quit()

            // const window = App.getWindow(WINDOW_NAME);
            //
            // App.closeWindow(WINDOW_NAME);
            // App.removeWindow(window);
          },
          child: Widget.Label("destruir"),
        }),

        Widget.Label({
          label: "Desbloquear",
          vpack: "end",
        }),
      ],
    }),
  });
};

export default lockscreen;
