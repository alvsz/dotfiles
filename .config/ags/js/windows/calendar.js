import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { Notification, Placeholder } from "../notification.js";
import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";

import GLib from "gi://GLib";

const Calendar = () => {
  const cal = Widget.Calendar({
    // showDetails: false,
    showHeading: false,
    show_day_names: false,
    detail_height_rows: 0,
    // detail_width_chars: 10,

    vpack: "start",
    hpack: "fill",

    setup: (self) => {
      // const parent_window = self.get_parent_window();
      // if (parent_window) {
      //   parent_window.on("show", () => {
      //     self.select_day();
      //   });
      // }

      self.set_detail_func((self, year, month, day) => {
        // return "";
        if (day % 2 === 0) {
          return "par\nteste";
        } else return "ímpar";
      });
    },
  });

  const monthName = Widget.Label({
    className: "monthName",
    vpack: "start",
    label: "teste",
  }).hook(
    cal,
    (self) => {
      const [y, m, d] = cal.get_date();

      // if (!cal.get_day_is_marked(d)) cal.mark_day(d);
      // else cal.unmark_day(d);

      // const iso8601 = `${y}-${m + 1}-${d}`;
      // print(iso8601);

      // const time = GLib.DateTime.new_from_iso8601(iso8601, null);

      const time = GLib.DateTime.new_utc(y, m + 1, d, 0, 0, 0);

      // print(time);
      // print(time);
      self.label = time.format("%B %Y");
    },
    "day-selected",
  );

  return Widget.Box({
    vertical: true,
    homogeneous: false,
    className: "calendarBox",
    vpack: "fill",
    hpack: "fill",
    children: [monthName, cal],
  });

  // return cal;
};

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
    name: "calendar",
    layer: "overlay",
    anchor: ["top"],
    visible: false,
    // exclusivity: "ignore",
    child: Widget.Box({
      className: "calendar",
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
