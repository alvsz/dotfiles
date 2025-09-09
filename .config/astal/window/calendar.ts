import { App, Astal, Gtk } from "astal/gtk4";
import { GLib, property, register } from "astal/gobject";
import libTrem from "gi://libTrem";

import template from "./calendar.blp";
import EventWidget from "../widget/event";
import mprisPlayerList from "../widget/mprisPlayerList";
import { remove_children } from "../util";
import { Gio } from "astal";

Gio._promisify(
  libTrem.EventList.prototype,
  "get_events_in_range",
  "get_events_in_range_finish",
);

Gio._promisify(
  libTrem.TodoList.prototype,
  "get_tasks_until",
  "get_tasks_until_finish",
);

@register({
  GTypeName: "Calendar",
  Template: template,
  Requires: [
    libTrem.NotificationCenter,
    mprisPlayerList,
    libTrem.WeatherWidget,
  ],
  InternalChildren: ["calendar", "month_name", "events", "scrolled_window"],
})
export default class Calendar extends Astal.Window {
  declare _calendar: Gtk.Calendar;
  declare _month_name: Gtk.Label;
  declare _events: Gtk.Box;
  declare _weather: Gtk.Box;
  declare _scrolled_window: Gtk.ScrolledWindow;
  declare caldav_service: libTrem.CalendarService;
  declare task_service: libTrem.TodoService;
  @property(String) declare contact_info: string;
  @property(Boolean) declare auto_update_weather: boolean;

  constructor() {
    super({
      application: App,
    });

    this.contact_info = "joao.aac@disroot.org";
    this.auto_update_weather = true;

    this.caldav_service = libTrem.CalendarService.new();
    this.task_service = libTrem.TodoService.new();

    this.caldav_service.connect("changed", (s) => {
      try {
        this.on_day_selected();
      } catch (e) {
        logError(e);
      }
    });

    this.task_service.connect("changed", (s) => {
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
    const start_border = GLib.DateTime.new_local(y, m, d - 1, 0, 0, 0);
    const end = GLib.DateTime.new_local(y, m, d, 23, 59, 59);
    const end_border = GLib.DateTime.new_local(y, m, d + 1, 23, 59, 59);

    const events = this.caldav_service
      .get_calendars()
      .map((list) => list.get_events_in_range(start_border, end_border));

    Promise.all(events)
      .then((results) => {
        const evs = results.flat();
        remove_children(this._events);

        evs
          .filter((ev) => {
            if (
              ev.dtstart.to_unix() < end.to_unix() &&
              ev.dtend.to_unix() > start.to_unix()
            )
              return true;
            return false;
          })
          .sort((a, b) => a.dtstart.to_unix_usec() - b.dtstart.to_unix_usec())
          .forEach((event) => {
            if (!event) return;

            this._events.visible = true;
            this._events.append(new EventWidget(event));
          });
      })
      .catch(logError);
  }
}
