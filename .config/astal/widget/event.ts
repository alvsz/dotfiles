import { Gtk } from "astal/gtk4";
import { property, register } from "astal/gobject";
import eventTemplate from "./event.blp";
import EDataServer from "gi://EDataServer?version=1.2";
import { setCss } from "../util";
import libTrem from "gi://libTrem";

@register({
  GTypeName: "EventWidget",
  Template: eventTemplate,
})
export default class EventWidget extends Gtk.Box {
  @property(libTrem.Event) declare event: libTrem.Event;
  declare color: String;

  constructor(ev: libTrem.CollectionObject) {
    super();
    this.event = ev;

    const color = this.event.source
      .get_icalcomponent()
      ?.get_first_property(118)
      ?.get_value_as_string();

    const calendar = this.event.client
      .get_source()
      ?.get_extension(
        EDataServer.SOURCE_EXTENSION_CALENDAR,
      ) as EDataServer.SourceCalendar;

    const source_color = calendar.color;

    this.color = color ? color : source_color;

    if (this.color) setCss(this, `color: ${this.color};`);
  }

  protected format_time() {
    const start_y = this.event.dtstart?.get_year();
    const start_m = this.event.dtstart?.get_month();
    const start_d = this.event.dtstart?.get_day_of_month();
    const start_h = this.event.dtstart?.get_hour();
    const start_min = this.event.dtstart?.get_minute();
    const start_sec = this.event.dtstart?.get_seconds();

    const end_y = this.event.dtend?.get_year();
    const end_m = this.event.dtend?.get_month();
    const end_d = this.event.dtend?.get_day_of_month();
    const end_h = this.event.dtend?.get_hour();
    const end_min = this.event.dtend?.get_minute();
    const end_sec = this.event.dtend?.get_seconds();

    const start = this.event.dtstart?.to_unix() || 0;
    const end = this.event.dtend?.to_unix() || 0;

    const whole_day =
      start_h === 0 &&
      end_h === 0 &&
      start_min === 0 &&
      end_min === 0 &&
      start_sec === 0 &&
      end_sec === 0;

    const single_day = whole_day
      ? end - start === 86400
      : start_y === end_y && start_m === end_m && start_d === end_d;

    if (whole_day)
      if (single_day) return "O dia inteiro";
      else
        return `${this.event.dtstart.format("%a %d")} - ${this.event.dtend.format("%a %d")}`;
    else if (single_day)
      return `${this.event.dtstart.format("%R")} - ${this.event.dtend.format("%R")}`;
    else
      return `${this.event.dtstart.format("%a %d, %R")} - ${this.event.dtend.format("%a %d, %R")}`;
  }

  protected summary_visible() {
    return this.event.summary ? this.event.summary.length > 0 : false;
  }

  protected description_visible() {
    return this.event.description ? this.event.description.length > 0 : false;
  }

  protected location_visible() {
    return this.event.location.length > 0;
  }
}
