import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";
import notification from "../widgets/notification.js";
import { Placeholder } from "../notification.js";
import calendarServer from "../services/ecal.js";

import GLib from "gi://GLib";

const WINDOW_NAME = "calendar";

const Calendar = () => {
  const cal = Widget.Calendar({
    showHeading: false,
    show_day_names: false,
    detail_height_rows: 0,

    vpack: "start",
    hpack: "fill",
  }).on("day-selected", (self) => {
    const [y, m, d] = self.get_date();
    calendarServer.setDate(y, m + 1, d);
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

  const weekDays = Widget.Box({
    hpack: "fill",
    vpack: "center",
    hexpand: true,
    vertical: false,
    homogeneous: true,
    className: "weekDays",
    children: [
      Widget.Label("dom"),
      Widget.Label("seg"),
      Widget.Label("ter"),
      Widget.Label("qua"),
      Widget.Label("qui"),
      Widget.Label("sex"),
      Widget.Label("sáb"),
    ],
  });

  const calendarBox = Widget.Box({
    vertical: true,
    homogeneous: false,
    className: "calendarBox",
    vpack: "start",
    hpack: "fill",
    children: [monthName, weekDays, cal],
  });

  const events = Widget.Box({
    vertical: true,
    homogeneous: false,
    className: "events",
    vpack: "fill",
    hpack: "fill",
    children: calendarServer.bind("events").as((e) =>
      e
        .sort((a, b) => a.start - b.start)
        .map((event) => {
          // print(event.color);

          const time = Widget.Label({
            className: "time",
            hpack: "start",
            justification: "left",
            wrap: true,
          });

          const start = GLib.DateTime.new_from_unix_utc(event.start);

          if (event.whole_day) {
            if (event.single_day) time.label = "O dia inteiro";
            else {
              const end = GLib.DateTime.new_from_unix_utc(event.end - 1);
              time.label = `${start.format("%a %d")} - ${end.format("%a %d")}`;
            }
          } else {
            const end = GLib.DateTime.new_from_unix_utc(event.end);
            if (event.single_day)
              time.label = `${start.format("%R")} - ${end.format("%R")}`;
            else
              time.label = `${start.format("%a %d, %R")} - ${end.format("%a %d, %R")}`;
          }

          return Widget.Box({
            vertical: true,
            homogeneous: false,
            hpack: "fill",
            vpack: "fill",
            className: "event",
            css: event.color ? `color: ${event.color};` : null,
            children: [
              Widget.Label({
                className: "summary",
                label: event.summary ? event.summary : "",
                hpack: "start",
                justification: "left",
                wrap: true,
                visible: event.summary ? event.summary.length > 0 : false,
              }),
              time,
              event.location?.length > 0
                ? Widget.Label({
                  className: "location",
                  label: event.location,
                  hpack: "start",
                  justification: "left",
                  wrap: true,
                })
                : null,
            ],
          });
        }),
    ),
    visible: calendarServer.bind("events").as((e) => e.length > 0),
  });

  return Widget.Box({
    vertical: true,
    homogeneous: false,
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
    name: WINDOW_NAME,
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
