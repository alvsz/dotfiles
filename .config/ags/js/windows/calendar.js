import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";
import notification from "../widgets/notification.js";
import { Placeholder } from "../notification.js";
import calendarServer from "../services/ecal.js";

import GLib from "gi://GLib";

const Calendar = () => {
  const cal = Widget.Calendar({
    showHeading: false,
    show_day_names: false,
    detail_height_rows: 0,

    vpack: "start",
    hpack: "fill",
  });

  const monthName = Widget.Label({
    className: "monthName",
    vpack: "start",
    label: "teste",
  }).hook(
    cal,
    (self) => {
      const [y, m, d] = cal.get_date();

      const time = GLib.DateTime.new_utc(y, m + 1, d, 0, 0, 0);

      self.label = time.format("%B %Y");
    },
    "day-selected",
  );

  const calendarBox = Widget.Box({
    vertical: true,
    homogeneous: false,
    className: "calendarBox",
    vpack: "start",
    hpack: "fill",
    children: [monthName, cal],
  });

  const events = Widget.Box({
    vertical: true,
    homogeneous: false,
    className: "events",
    vpack: "fill",
    hpack: "fill",
    // children:
  }).hook(
    cal,
    (self) => {
      const [y, m, d] = cal.get_date();
      const events = calendarServer.getEvents(y, m + 1, d);
      events.then((results) => {
        self.children = results.map((event) => {
          event.commit_sequence();

          // print(event.summary);
          // print(event.description);
          // print(event.get_as_string());
          // print(event.get_summary().get_value());
          //
          // const descriptions = event
          //   .get_descriptions()
          //   .map((d) => d.get_value());
          // const description = descriptions.join(" - ");
          // print(description);
          return Widget.Label({
            label: event.get_summary().get_value(),
          });
        });
      });
    },
    "day-selected",
  );

  return Widget.Box({
    vertical: true,
    homogeneous: false,
    className: "events",
    vpack: "fill",
    hpack: "fill",
    children: [calendarBox, events],
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
  }).hook(Notifications, (self) => {
    self.children = Notifications.notifications.reverse().map(notification);

    if (!self.children.length === 0) self.children = [Placeholder()];
  });

  // return list;

  return Widget.Scrollable({
    className: "scroll",
    hexpand: true,
    vexpand: true,
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
