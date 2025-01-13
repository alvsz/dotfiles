import { GLib } from "astal";
import { Gtk } from "astal/gtk4";
import { property, register } from "astal/gobject";
import { CollectionObject } from "../service/evolutionDataServer";
import eventTemplate from "./event.blp";
import EDataServer from "gi://EDataServer?version=1.2";

const setCss = (widget: Gtk.Widget, css: string) => {
  if (!css.includes("{") || !css.includes("}")) css = `* { ${css} }`;

  const cssProvider = new Gtk.CssProvider();
  cssProvider.load_from_data(css, css.length);
  widget
    .get_style_context()
    .add_provider(cssProvider, Gtk.STYLE_PROVIDER_PRIORITY_USER);
};

@register({
  GTypeName: "EventWidget",
  Template: eventTemplate,
})
export default class EventWidget extends Gtk.Box {
  @property(CollectionObject) declare event: CollectionObject;
  declare color: String;

  constructor(ev: CollectionObject) {
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
    const start_y = this.event.dtstart?.getFullYear();
    const start_m = this.event.dtstart?.getMonth();
    const start_d = this.event.dtstart?.getDate();
    const start_h = this.event.dtstart?.getHours();
    const start_min = this.event.dtstart?.getMinutes();
    const start_sec = this.event.dtstart?.getSeconds();

    const end_y = this.event.dtend?.getFullYear();
    const end_m = this.event.dtend?.getMonth();
    const end_d = this.event.dtend?.getDate();
    const end_h = this.event.dtend?.getHours();
    const end_min = this.event.dtend?.getMinutes();
    const end_sec = this.event.dtend?.getSeconds();

    const start = this.event.dtstart?.getTime() || 0;
    const end = this.event.dtend?.getTime() || 0;

    const whole_day =
      start_h === 0 &&
      end_h === 0 &&
      start_min === 0 &&
      end_min === 0 &&
      start_sec === 0 &&
      end_sec === 0;

    const single_day = whole_day
      ? end - start === 86400000
      : start_y === end_y && start_m === end_m && start_d === end_d;

    const start_date = GLib.DateTime.new_from_unix_local(start / 1000);

    if (whole_day) {
      if (single_day) return "O dia inteiro";
      else {
        const end_date = GLib.DateTime.new_from_unix_local((end - 1) / 1000);
        return `${start_date.format("%a %d")} - ${end_date.format("%a %d")}`;
      }
    } else {
      const end_date = GLib.DateTime.new_from_unix_local(end / 1000);
      if (single_day)
        return `${start_date.format("%R")} - ${end_date.format("%R")}`;
      else
        return `${start_date.format("%a %d, %R")} - ${end_date.format("%a %d, %R")}`;
    }
  }

  protected summary_visible() {
    return this.event.summary ? this.event.summary.length > 0 : false;
  }

  protected description_visible() {
    return this.event.description ? this.event.description.length > 0 : false;
  }

  protected location_visible() {
    return this.event.location ? this.event.location.length > 0 : false;
  }
}
