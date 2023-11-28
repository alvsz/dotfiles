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
    anchor: ["top"],
    layer: "overlay",
    popup: true,
    focusable: true,
    visible: false,
    child: Widget.Box({
      vertical: true,
      children: [Header(), NotificationList()],
      hexpand: true,
      className: "notificationCenter",
    }),
  });

export const NotificationsPopupWindow = () =>
  Widget.Window({
    name: "popup-window",
    popup: true,
    focusable: false,
    visible: true,
    // visible: false,
    anchor: ["top"],
    child: PopupList(),
  });
