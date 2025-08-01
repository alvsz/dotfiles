import { App, Astal, Gtk } from "astal/gtk4";
import { GLib, property, register } from "astal/gobject";
import libTrem from "gi://libTrem";

import template from "./calendar.blp";
import EventWidget from "../widget/event";
import NotificationCenter from "../widget/notificationCenter";
NotificationCenter;
import mprisPlayerList from "../widget/mprisPlayerList";
import { remove_children } from "../util";
mprisPlayerList;

@register({
  GTypeName: "Calendar",
  Template: template,
  InternalChildren: ["calendar", "month_name", "events", "weather"],
})
export default class Calendar extends Astal.Window {
  declare _calendar: Gtk.Calendar;
  declare _month_name: Gtk.Label;
  declare _weather: Gtk.Box;
  declare _events: Gtk.Box;
  declare caldav_service: libTrem.CalendarService;
  @property(libTrem.Weather) declare weather: libTrem.Weather;

  constructor() {
    super({
      application: App,
    });

    this.weather = new libTrem.Weather({
      app_id: App.application_id,
      contact_info: "joao.aac@disroot.org",
      auto_update: true,
    });
    this.caldav_service = libTrem.CalendarService.new();

    this.weather.connect("notify::available", () => {
      this._weather.visible = this.weather.available;
    });

    this.caldav_service.connect("changed", () => {
      try {
        this.on_day_selected();
      } catch (e) {
        logError(e);
      }
    });
  }

  protected async on_day_selected() {
    const time = this._calendar.get_date();
    const [y, m, d] = time.get_ymd();

    this._month_name.label = time.format("%B %Y") || "";

    const start = GLib.DateTime.new_local(y, m, d, 0, 0, 0);
    const end = GLib.DateTime.new_local(y, m, d, 23, 59, 59);

    const events = this.caldav_service.get_calendars().map((list) => {
      if (!list) return;

      return new Promise((resolve, reject) => {
        list.get_events_in_range(start, end, (_, res) => {
          try {
            resolve(list.get_events_in_range_finish(res));
          } catch (e) {
            reject(e);
          }
        });
      });
    });

    Promise.all(events)
      .then((results) => {
        const evs = results.flat() as libTrem.Event[];

        remove_children(this._events);

        evs.forEach((event) => {
          if (!event) return;

          this._events.visible = true;
          this._events.prepend(new EventWidget(event));
        });
      })
      .catch(logError);
  }

  protected is_daytime() {
    return this.weather.is_daytime
      ? "daytime-sunset-symbolic"
      : "daytime-sunrise-symbolic";
  }
  protected is_not_daytime() {
    return this.weather.is_daytime
      ? "daytime-sunrise-symbolic"
      : "daytime-sunset-symbolic";
  }

  protected format_daytime() {
    const sunset = this.weather.get_sunset();
    const sunrise = this.weather.get_sunrise();

    return this.weather.is_daytime
      ? `${sunset} - ${sunrise}`
      : `${sunrise} - ${sunset}`;
  }
}
