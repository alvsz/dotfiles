import { App, Astal } from "astal/gtk4";
import { register } from "astal/gobject";
import libTrem from "gi://libTrem?version=0.1";
const TIMEOUT = 5000;

@register({
  GTypeName: "NotificationPopups",
})
export default class NotificationPopups extends Astal.Window {
  constructor() {
    super({
      application: App,
      layer: Astal.Layer.OVERLAY,
      anchor: Astal.WindowAnchor.TOP,
      exclusivity: Astal.Exclusivity.NORMAL,
      child: new libTrem.NotificationCenter({
        hidden: false,
        popup: true,
        timeout: TIMEOUT,
      }),
      visible: true,
      cssClasses: ["notification-popups"],
    });
  }
}
