import { GLib, exec, subprocess } from "astal";
import { App, Astal, Gdk, Gtk } from "astal/gtk4";
import { property, register } from "astal/gobject";
import template from "./dwlBox.blp";
import libTrem from "gi://libTrem?version=0.1";
import { remove_children } from "../util";

const ntags = 7;
// const proc = subprocess("dwlcmd follow");

@register({
  GTypeName: "DwlBox",
  Template: template,
  InternalChildren: [
    // iebrv
    "tags",
  ],
})
export default class dwlBox extends Gtk.Box {
  declare _tags: Gtk.Box;
  declare dwl: libTrem.Dwl;
  declare mon: libTrem.DwlMonitor;
  declare tags: Array<Gtk.Button>;
  @property(Gdk.Monitor) declare monitor: Gdk.Monitor;
  @property(String) declare title: string;
  @property(Boolean) declare focused: boolean;
  @property(String) declare app_id: string;
  @property(String) declare layout: string;

  constructor() {
    super();

    this.dwl = libTrem.Dwl.get_default() || new libTrem.Dwl();
    this.tags = new Array<Gtk.Button>();

    for (let i = 0; i < ntags; i++) {
      const b = new Gtk.Button({
        icon_name: "weather-clear-symbolic",
      });
      this.tags.push(b);
      this._tags.append(b);
    }

    this.dwl.connect("frame", this.update.bind(this));
    this.update();
  }

  protected get_client_tooltip() {
    return `${this.title} - ${this.app_id}`;
  }

  private update() {
    const mon = this.dwl
      .get_monitors()
      .find((m) => m.name == this.monitor.get_connector());

    if (!mon) return;
    this.mon = mon;
    const clients = this.dwl
      .get_clients()
      .filter((c) => c.monitor == mon.address);
    const focused_client = clients.find((c) => c.focused);

    if (focused_client) {
      this.focused = true;
      this.app_id = focused_client.app_id;
      this.title = focused_client.title;
    } else {
      this.focused = false;
    }

    this.layout = mon.get_layout();

    for (let i = 0; i < ntags; i++) {
      const tags = mon.get_seltags();
      const mask = 1 << i;
      const sel = (mask & tags) != 0;

      const b = this.tags.at(i);

      if (!b) return;

      const occupied = clients.some((c) => (c.tags & mask) !== 0);
      const urgent = clients.some((c) => c.urgent && (c.tags & mask) !== 0);

      let icon = "weather-overcast-symbolic";
      if (urgent) {
        icon = "weather-severe-alert-symbolic";
      } else if (sel) {
        icon = "weather-clear-symbolic";
      } else if (occupied) {
        icon = "weather-fog-symbolic";
      }
      b.set_icon_name(icon);

      if (occupied) b.add_css_class("occupied");
      else b.remove_css_class("occupied");

      if (sel) b.add_css_class("focus");
      else b.remove_css_class("focus");

      if (urgent) b.add_css_class("urgent");
      else b.remove_css_class("urgent");
    }
  }
}
