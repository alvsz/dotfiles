// import Avatar from '../misc/Avatar.js';
import Spinner from "../misc/Spinner.js";
import Lockscreen from "../misc/Lockscreen.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
// import { Widget } from '../imports.js';
import Layer from "gi://GtkLayerShell";
import { iconFile, realName } from "../misc/User.js";

const Avatar = (props) =>
  Widget.Icon({
    ...props,
    className: "avatar",
    icon: iconFile,
  });

export default ({ monitor } = {}) => {
  const win = Widget.Window({
    name: `lockscreen-${monitor}`,
    className: "lockscreen",

    monitor: monitor,
    layer: "overlay",

    visible: false,
    // visible: true,

    // setup: (self) => {
    //   // Layer.init_for_window(self);
    //   Layer.set_keyboard_mode(self, Layer.KeyboardMode.EXCLUSIVE);
    // },

    connections: [[Lockscreen, (w, lock) => (w.visible = lock), "lock"]],

    child: Widget.Box({
      // css: "min-width: 3000px; min-height: 2000px;",
      className: "shader",

      child: Widget.Box({
        className: "content",
        vertical: true,
        hexpand: true,
        vexpand: true,
        halign: "center",
        valign: "center",

        children: [
          Avatar({
            halign: "center",
            valign: "center",
          }),

          Widget.Label(realName),

          Widget.Box({
            children: [
              Widget.Entry({
                connections: [
                  [Lockscreen, (entry) => (entry.text = ""), "lock"],
                ],
                visibility: false,
                placeholderText: "Password",
                onAccept: ({ text }) => Lockscreen.auth(text),
                halign: "center",
                hexpand: true,
              }),
              Spinner({
                valign: "center",
                connections: [
                  [
                    Lockscreen,
                    (w, auth) => (w.visible = auth),
                    "authenticating",
                  ],
                ],
              }),
            ],
          }),
        ],
      }),
    }),
  });

  Layer.set_keyboard_mode(win, Layer.KeyboardMode.EXCLUSIVE);
  return win;
};
