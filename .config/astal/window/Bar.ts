import { GLib } from "astal";
import { App, Astal, Gdk, Gtk } from "astal/gtk4";
import { property, register } from "astal/gobject";

import Battery from "gi://AstalBattery";
import Wp from "gi://AstalWp";
import Bluetooth from "gi://AstalBluetooth";

import Template from "./Bar.blp";
import icons from "../icons";

@register({
  GTypeName: "Bar",
  Template: Template,
  InternalChildren: ["clock", "tray_toggle"],
})
export default class Bar extends Astal.Window {
  declare _clock: Gtk.Label;
  declare _tray_toggle: Gtk.ToggleButton;
  @property(Bluetooth.Bluetooth) declare bluetooth: Bluetooth.Bluetooth;
  @property(Wp.Wp) declare wp: Wp.Wp | null;

  private update_clock() {
    const now = GLib.DateTime.new_now_local();
    this._clock.label = now.format("%a %d, %R") || "";
  }

  constructor(monitor: Gdk.Monitor) {
    super({
      application: App,
      anchor:
        Astal.WindowAnchor.TOP |
        Astal.WindowAnchor.LEFT |
        Astal.WindowAnchor.RIGHT,
      visible: true,
      name: `Bar-${monitor.get_connector() || ""}`,
    });

    this.bluetooth = Bluetooth.get_default();
    this.wp = Wp.get_default();

    setInterval(() => {
      this.update_clock();
    }, 15000);

    this.update_clock();

    this._tray_toggle.icon_name = icons.ui.arrow.left;
  }

  protected bluetooth_icon() {
    if (this.bluetooth.is_powered) return icons.bluetooth.enabled;
    else return icons.bluetooth.disabled;
  }
}
