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
    "client_box",
    "client_icon",
    "client_title",
    "tags",
    "layout_button",
  ],
})
export default class dwlBox extends Gtk.Box {
  declare _client_icon: Gtk.Image;
  declare _client_title: Gtk.Label;
  declare _client_box: Gtk.Box;
  declare _tags: Gtk.Box;
  declare _layout_button: Gtk.Button;
  declare dwl: libTrem.Dwl;
  declare mon: libTrem.DwlMonitor;
  declare tags: Array<Gtk.Button>;
  @property(Gdk.Monitor) declare monitor: Gdk.Monitor;

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

  private update() {
    const mon = this.dwl
      .get_monitors()
      .find((m) => m.name == this.monitor.get_connector());

    if (!mon) return;
    this.mon = mon;
    const focused_client = this.dwl.get_clients().find((c) => c.get_focused());

    const focused = focused_client?.get_monitor() == mon?.address;

    if (focused) {
      if (!focused_client) return;
      this._client_box.visible = true;
      this._client_icon.icon_name = focused_client.app_id;
      this._client_title.label = focused_client.title;

      this._client_box.tooltip_text = `${focused_client.title} - ${focused_client.app_id}`;
    } else {
      this._client_box.visible = false;
    }

    this._layout_button.label = mon?.get_layout();

    for (let i = 0; i < ntags; i++) {
      const tags = mon.get_seltags();
      const mask = 1 << i;
      const sel = (mask & tags) != 0;

      const b = this.tags.at(i);

      if (!b) return;

      b.set_icon_name(
        sel ? "weather-clear-symbolic" : "weather-overcast-symbolic",
      );

      if (sel) b.add_css_class("focus");
      else b.remove_css_class("focus");
    }
  }
}
