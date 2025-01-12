import { GLib } from "astal";
import { App, Astal, Gtk } from "astal/gtk4";
import { property, register } from "astal/gobject";

import Weather from "../service/weather";
import { CalendarService } from "../service/calendar";
import template from "./calendar.blp";
import icons from "../icons";

@register({
  GTypeName: "Calendar",
  Template: template,
  InternalChildren: ["calendar", "month_name", "weather"],
})
export default class Calendar extends Astal.Window {
  declare _calendar: Gtk.Calendar;
  declare _month_name: Gtk.Label;
  declare _weather: Gtk.Box;
  declare caldav_service: CalendarService;
  @property(Weather) declare weather: Weather;

  constructor() {
    super({
      application: App,
      visible: true,
    });

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
  }

  protected async on_day_selected() {
    const time = this._calendar.get_date();
    this._month_name.label = time.format("%B %Y") || "";

    this.caldav_service.calendars.forEach(async (list) => {
      if (!list) return;
      try {
        const [y, m, d] = time.get_ymd();

        const start = new Date(y, m - 1, d, 0, 0, 0);
        const end = new Date(y, m - 1, d, 23, 59, 59);

        (await list.getEventsInRange(start, end)).map((event: any) => {
          print(event.summary, event.location, event.description);
        });
      } catch (e) {
        logError(e);
      }
    });
    print("\n");
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
}
