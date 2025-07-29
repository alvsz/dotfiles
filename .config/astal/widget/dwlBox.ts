import { GLib, exec, subprocess } from "astal";
import { App, Astal, Gdk, Gtk } from "astal/gtk4";
import { property, register } from "astal/gobject";
import template from "./dwlBox.blp";
import libTrem from "gi://libTrem?version=0.1";

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
  declare dwlIpc: libTrem.DwlIpc;
  @property(Gdk.Monitor) declare monitor: Gdk.Monitor;

  constructor() {
    super();

    this.dwlIpc = new libTrem.DwlIpc();

    this.dwlIpc.connect("frame", () => {
      const status = exec("dwlcmd run 'return get_status()'");
      const s = JSON.parse(status);

      const mon = s.find((m: any) => (m.name = this.monitor.get_connector()));
      const focused = mon.clients.find((c: any) => c.focused);

      if (focused) {
        this._client_box.visible = true;
        this._client_icon.icon_name = focused.app_id;
        this._client_title.label = focused.title;

        this._client_box.tooltip_text = `${focused.title} - ${focused.app_id}`;
      } else {
        this._client_box.visible = false;
      }

      this._layout_button.label = mon.layout;
    });
  }
}
