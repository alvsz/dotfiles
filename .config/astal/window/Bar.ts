import { GLib, bind } from "astal";
import { App, Astal } from "astal/gtk4";
import Template from "./Bar.blp";
import { property, register } from "astal/gobject";
import GObject from "gi://GObject";
import Mpris from "gi://AstalMpris";
import Battery from "gi://AstalBattery";
import Wp from "gi://AstalWp";
import Network from "gi://AstalNetwork";
import Bluetooth from "gi://AstalBluetooth";
import icons from "../icons";

@register({
  GTypeName: "Bar",
  Template: Template,
  InternalChildren: ["clock", "bluetooth"],
})
export default class Bar extends Astal.Window {
  @property(Mpris.Mpris) declare mpris: Mpris.Mpris;
  @property(Bluetooth.Bluetooth) declare bluetooth: Bluetooth.Bluetooth;
  @property(Boolean) declare powered: boolean;

  private update_clock() {
    const now = GLib.DateTime.new_now_local();
    this._clock.label = now.format("%a %d, %R");
  }

  protected powered_icon() {
    if (this.powered) return icons.bluetooth.enabled;
    else return icons.bluetooth.disabled;
  }

  constructor() {
    super({
      application: App,
      anchor:
        Astal.WindowAnchor.TOP |
        Astal.WindowAnchor.LEFT |
        Astal.WindowAnchor.RIGHT,
      visible: true,
    });

    this.mpris = Mpris.get_default();
    this.bluetooth = Bluetooth.get_default();

    this.bluetooth.bind_property(
      "is-powered",
      this,
      "powered",
      GObject.BindingFlags.SYNC_CREATE,
    );

    setInterval(() => {
      this.update_clock();
    }, 15000);

    this.update_clock();
  }
}
