import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { Notification, Placeholder } from "../notification.js";
import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";

const Calendar = () =>
  Widget.Calendar({
    showDetails: false,
    showHeading: false,
    vpack: "start",
    hpack: "fill",
  });

const notificationList = () => {
  const list = Widget.Box({
    vertical: true,
    // homogeneous: true,
    hpack: "fill",
    vpack: "start",
    vexpand: true,
    visible: true,
  });

  list.hook(Notifications, (self) => {
    self.children = Notifications.notifications.reverse().map(Notification);

    if (self.children.length > 0) {
      self.children[0].toggleClassName("first", true);
    } else self.children = [Placeholder()];
  });

  // return list;

  return Widget.Scrollable({
    className: "scroll",
    hexpand: true,
    hscroll: "never",
    vscroll: "automatic",
    child: list,
  });
};

const controlCenter = () =>
  Widget.Window({
    name: "controlCenter",
    layer: "overlay",
    anchor: ["top"],
    // visible: false,
    // exclusivity: "ignore",
    child: Widget.Box({
      className: "controlCenter",
      homogeneous: true,
      spacing: 5,
      // vertical: true,
      // vexpand: true,
      // hexpand: true,
      vpack: "center",
      hpack: "center",
      children: [Calendar(), notificationList()],
    }),
  });

export default controlCenter;
