import {
  ClearButton,
  DNDSwitch,
  NotificationList,
  PopupList,
} from "./notifWidgets.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import App from "resource:///com/github/Aylur/ags/app.js";
import { execAsync, timeout } from "resource:///com/github/Aylur/ags/utils.js";

const Header = () =>
  Widget.Box({
    className: "header",
    hexpand: true,
    children: [
      Widget.Label("Do Not Disturb"),
      DNDSwitch(),
      Widget.Box({ hexpand: true }),
      ClearButton(),
    ],
  });

export const NotificationCenter = () =>
  Widget.Window({
    name: "notification-center",
    // className: "notificationCenter",
    anchor: ["right", "top", "bottom"],
    popup: true,
    focusable: true,
    visible: false,
    child: Widget.Box({
      children: [
        Widget.EventBox({
          // hexpand: true,
          connections: [
            [
              "button-press-event",
              () => App.closeWindow("notification-center"),
            ],
          ],
        }),
        Widget.Box({
          vertical: true,
          children: [Header(), NotificationList()],
        }),
      ],
      hexpand: true,
      className: "notificationCenter",
    }),
  });

export const NotificationsPopupWindow = () =>
  Widget.Window({
    name: "popup-window",
    visible: true,
    anchor: ["top"],
    child: PopupList(),
  });
