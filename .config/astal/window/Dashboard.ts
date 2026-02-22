import { App, Astal, Gtk } from "astal/gtk4";
import { GLib, property, register } from "astal/gobject";
import libTrem from "gi://libTrem";
import mprisPlayerList from "../widget/mprisPlayerList";

import template from "./Dashboard.blp";

@register({
  GTypeName: "Dashboard",
  Template: template,
  Requires: [
    libTrem.UserCenter,
    libTrem.NetworkInfo,
    libTrem.BluetoothInfo,
    libTrem.UPowerDevices,
    mprisPlayerList,
    //
  ],
  InternalChildren: ["stack", "base", "wifis", "bluetooths"],
})
export default class Dashboard extends Astal.Window {
  declare _stack: Gtk.Stack;
  declare _base: Gtk.Widget;
  declare _wifis: Gtk.Widget;
  declare _bluetooths: Gtk.Widget;
  constructor() {
    super({
      application: App,
      anchor: Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT,
    });
  }

  on_wifi_clicked() {
    this._stack.set_visible_child(this._wifis);
  }

  on_bluetooth_clicked() {
    this._stack.set_visible_child(this._bluetooths);
  }

  on_power_profiles_clicked() {
    print("coisou");
  }

  on_go_back() {
    this._stack.set_visible_child(this._base);
  }
}
