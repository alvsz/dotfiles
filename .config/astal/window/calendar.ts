import { App, Astal, Gtk } from "astal/gtk4";
import { property, register } from "astal/gobject";

import Weather from "../service/weather";
import { CalendarService } from "../service/calendar";
import template from "./calendar.blp";
import { CollectionObject } from "../service/evolutionDataServer";
import EventWidget from "../widget/event";
import Notification from "../widget/notification";
import Notifd from "gi://AstalNotifd";

@register({
  GTypeName: "Calendar",
  Template: template,
  InternalChildren: [
    "calendar",
    "month_name",
    "events",
    "weather",
    "notifications",
  ],
})
export default class Calendar extends Astal.Window {
  declare _calendar: Gtk.Calendar;
  declare _month_name: Gtk.Label;
  declare _weather: Gtk.Box;
  declare _events: Gtk.Box;
  declare _notifications: Gtk.Box;
  declare caldav_service: CalendarService;
  @property(Notifd.Notifd) declare notifd: Notifd.Notifd;
  @property(Weather) declare weather: Weather;

  constructor() {
    super({
      application: App,
    });

    this.notifd = Notifd.get_default();
    this.weather = new Weather();
    this.caldav_service = new CalendarService();

    this.weather.connect("notify::available", () => {
      this._weather.visible = this.weather.available;
    });

    this.on_day_selected();

    this.weather._info.update();

    setInterval(() => {
      this.weather._info.update();
    }, 3600000);

    this.on_day_selected();
  }

  protected remove_children() {
    this._events.visible = false;
    let w = this._events.get_first_child();
    let n = w?.get_next_sibling();

    while (w) {
      this._events.remove(w);
      w = n || null;
      n = w?.get_next_sibling();
    }
  }

  protected async on_day_selected() {
    const time = this._calendar.get_date();
    const [y, m, d] = time.get_ymd();

    this._month_name.label = time.format("%B %Y") || "";

    this.remove_children();

    this.caldav_service.calendars.forEach(async (list) => {
      if (!list) return;

      try {
        const start = new Date(y, m - 1, d, 0, 0, 0);
        const end = new Date(y, m - 1, d, 23, 59, 59);

        (await list.getEventsInRange(start, end)).map(
          (event: CollectionObject) => {
            this._events.visible = true;
            this._events.append(new EventWidget(event));
          },
        );
      } catch (e) {
        logError(e);
      }
    });
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
    const sunset = this.weather._info.get_sunset();
    const sunrise = this.weather._info.get_sunrise();

    return this.weather.is_daytime
      ? `${sunset} - ${sunrise}`
      : `${sunrise} - ${sunset}`;
  }

  protected on_notified(self: Notifd.Notifd, id: number, replaced: boolean) {
    this._notifications.append(
      new Notification(self.get_notification(id), false),
    );
    print(self, id, replaced);
  }

  protected on_resolved(
    self: Notifd.Notifd,
    id: number,
    reason: Notifd.ClosedReason,
  ) {
    print(self, id, reason);
  }
}
