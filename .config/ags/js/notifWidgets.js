import { Notification, Placeholder } from "./notification.js";
import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";

const List = () =>
  Widget.Box({
    vertical: true,
    vexpand: true,
    vpack: "fill",
    children: Notifications.bind("notifications").transform((l) =>
      l.reverse().map(Notification)
    ),
    visible: true,
    // connections: [
    //   [
    //     Notifications,
    //     (self) => {
    //       // self.children = Notifications.notifications
    //       //     .reverse()
    //       //     .map(Notification);
    //
    //       self.visible = Notifications.notifications.length > 0;
    //
    //       self.children.length > 0 &&
    //         self.children[0].toggleClassName("first", true);
    //     },
    //   ],
    // ],
  });

export const NotificationList = () =>
  Widget.Scrollable({
    className: "scroll",
    hexpand: true,
    hscroll: "never",
    vscroll: "automatic",
    child: Widget.Box({
      className: "list",
      // spacing: 5,
      vertical: true,
      children: [List(), Placeholder()],
    }),
  });

export const ClearButton = () =>
  Widget.Button({
    onClicked: () => Notifications.clear(),
    binds: [["sensitive", Notifications, "notifications", (n) => n.length > 0]],
    child: Widget.Box({
      children: [
        Widget.Label("Clear"),
        Widget.Icon({
          binds: [
            [
              "icon",
              Notifications,
              "notifications",
              (n) => `user-trash-${n.length > 0 ? "full-" : ""}symbolic`,
            ],
          ],
        }),
      ],
    }),
  });

export const DNDSwitch = () =>
  Widget.Switch({
    // type: Gtk.Switch,
    vpack: "center",
    connections: [
      [
        "notify::active",
        ({ active }) => {
          Notifications.dnd = active;
        },
      ],
    ],
  });

export const PopupList = () =>
  Widget.Box({
    className: "popupList",
    // style: "padding: 1px;", // so it shows up
    spacing: 5,
    vertical: true,
    connections: [
      [
        Notifications,
        (self) => {
          self.children = Notifications.popups.reverse().map(Notification);

          // self.visible = Notifications.notifications.length > 0;

          self.children.length > 0 &&
            self.children[0].toggleClassName("first", true);
        },
      ],
    ],
    // binds: [
    //     [
    //         "children",
    //         Notifications,
    //         "popups",
    //         (popups) => popups.map(Notification),
    //     ],
    // ],
  });
