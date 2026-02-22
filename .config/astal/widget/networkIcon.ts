import { Gtk, App } from "astal/gtk4";
import { property, register } from "astal/gobject";

import Network from "gi://AstalNetwork";

import template from "./networkIcon.blp";

@register({
  GTypeName: "networkIcon",
  Template: template,
})
export default class networkIcon extends Gtk.Stack {
  @property(Network.Network) declare network: Network.Network;

  constructor() {
    super();
  }

  protected shown_icon() {
    switch (this.network.primary) {
      case Network.Primary.WIFI:
        return "wifi";
      case Network.Primary.WIRED:
        return "wired";
      default:
        return "offline";
    }
  }
}
