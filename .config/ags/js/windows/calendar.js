import GLib from "gi://GLib";

import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";

import DateTime from "../services/datetime.js";
import calendarServer from "../services/ecal.js";
import Weather from "../services/weather.js";

import notification from "../widgets/notification.js";
import icons from "../icons.js";
import { Placeholder } from "../notification.js";
import { dwlIpc, nTags } from "../vars.js";

globalThis.weather = Weather;

const WINDOW_NAME = "calendar";

const Calendar = () => {
  const cal = Widget.Calendar({
    showHeading: false,
    show_day_names: false,

    vpack: "start",
    hpack: "fill",
  })
    .on("day-selected", (self) => {
      const [y, m, d] = self.get_date();
      calendarServer.setDate(y, m + 1, d);
    })
    .hook(
      DateTime,
      (self) => {
        self.select_day(DateTime._day);
      },
      "day",
    )
    .hook(
      DateTime,
      (self) => {
        self.select_month(DateTime._month - 1, DateTime._year);
      },
      "month",
    );

  const monthName = Widget.Label({
    className: "monthName",
    vpack: "start",
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
                hpack: "start",
                justification: "left",
                wrap: true,
                className: "summary",
                visible: event.summary ? event.summary.length > 0 : false,
                label: event.summary ? event.summary : "",
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

  const weather = Widget.Box({
    className: "weather",
    vertical: true,
    homogeneous: false,
    vpack: "fill",
    hpack: "fill",
    visible: Weather.bind("available"),
    children: [
      Widget.Box({
        vertical: false,
        homogeneous: false,
        vpack: "fill",
        hpack: "fill",
        children: [
          Widget.Icon({
            className: "mainIcon",
            icon: Weather.bind("icon-name"),
          }),
          Widget.Label({
            className: "temp",
            vpack: "center",
            hpack: "start",
            justification: "left",
            hexpand: true,
            label: Weather.bind("temp"),
          }),
          Widget.Box({
            vertical: true,
            homogeneous: false,
            vpack: "center",
            hpack: "end",
            children: [
              Widget.Label({
                className: "city-name",
                hpack: "end",
                justification: "right",
                label: Weather.bind("city-name"),
              }),
              Widget.Label({
                className: "sky",
                hpack: "end",
                justification: "right",
                label: Weather.bind("sky"),
              }),
            ],
          }),
        ],
      }),

      Widget.Box({
        vertical: false,
        homogeneous: false,
        vpack: "center",
        hpack: "center",
        className: "humidity",
        children: [
          Widget.Icon("raindrop-symbolic"),
          Widget.Label({
            vpack: "center",
            label: Weather.bind("humidity"),
          }),
        ],
      }),

      Widget.Box({
        vertical: false,
        homogeneous: false,
        vpack: "center",
        hpack: "center",
        className: "daytime",
        children: [
          Widget.Icon({
            icon: Weather.bind("is-daytime").as((d) =>
              d ? "daytime-sunset-symbolic" : "daytime-sunrise-symbolic",
            ),
          }),

          Widget.Label({
            vpack: "center",
          }).hook(
            Weather,
            (self) => {
              const sunset = Weather._info.get_sunset();
              const sunrise = Weather._info.get_sunrise();

              self.label = Weather.is_daytime
                ? `${sunset} - ${sunrise}`
                : `${sunrise} - ${sunset}`;
            },
            "notify::is-daytime",
          ),

          Widget.Icon({
            icon: Weather.bind("is-daytime").as((d) =>
              d ? "daytime-sunrise-symbolic" : "daytime-sunset-symbolic",
            ),
          }),
        ],
      }),

      Widget.Box({
        vertical: false,
        homogeneous: false,
        vpack: "center",
        hpack: "center",
        className: "pressure",
        children: [
          Widget.Icon("speedometer-symbolic"),
          Widget.Label({
            vpack: "center",
            label: Weather.bind("pressure"),
          }),
        ],
      }),

      Widget.Box({
        vertical: false,
        homogeneous: false,
        vpack: "center",
        hpack: "center",
        className: "wind",
        children: [
          Widget.Icon("weather-windy-symbolic"),
          Widget.Label({
            vpack: "center",
            label: Weather.bind("wind"),
          }),
        ],
      }),
    ],
    setup: (_) => {
      DateTime.connect("hour", (_) => {
        Weather._info.update();
      });
    },
  });

  const windows = Widget.Box({
    className: "monitors",
    vertical: true,
    homogeneous: false,
    children: dwlIpc.bind().as((mons) =>
      mons.map((mon) => {
        let tags = new Array();

        for (let i = 0; i < nTags.value; i++) {
          const tagMask = 1 << i;
          const tag = Widget.Box({
            className: "tag",
            vertical: true,
            homogeneous: false,
            children: mon.clients
              .filter((c) => (c.tags & tagMask) != 0)
              .map((c) =>
                Widget.Box({
                  vertical: true,
                  className: "client",
                  hpack: "fill",
                  vpack: "start",
                  children: [
                    Widget.Icon(
                      Utils.lookUpIcon(c.app_id)
                        ? c.app_id
                        : icons.apps.fallback,
                    ),
                    // Widget.Label(c.app_id),
                    Widget.Label({
                      label: c.app_id.trim().substring(0, 5),
                      wrap: true,
                    }),
                  ],
                }),
              ),
          });

          tags.push(tag);
        }

        return Widget.Box({
          vertical: false,
          homogeneous: true,
          className: "monitor",
          children: tags,
        });
        // return tags;
      }),
    ),
  });

  return Widget.Box({
    vertical: true,
    homogeneous: false,
    vpack: "fill",
    hpack: "fill",
    children: [calendarBox, events, weather, windows],
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
    // visible: true,
  }).hook(Notifications, (self) => {
    self.children = Notifications.notifications.reverse().map(notification);

    if (!self.children.length === 0) self.children = [Placeholder()];
  });

  return Widget.Scrollable({
    className: "scroll",
    hexpand: true,
    vexpand: true,
    hscroll: "never",
    vscroll: "automatic",
    child: list,
    // visible: Notifications.bind("notifications").as((n) => n.length > 0),
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
