import { App, Astal } from "astal/gtk4";
import { register } from "astal/gobject";
import Notifd from "gi://AstalNotifd";

import NotificationCenter from "../widget/notificationCenter";
import template from "./NotificationPopups.blp";

const TIMEOUT = 5000;

@register({
  GTypeName: "Popups",
  Template: template,
})
class Popups extends NotificationCenter {
  protected on_notified_popup(
    self: Notifd.Notifd,
    id: number,
    replaced: boolean,
  ): void {
    super.on_notified(self, id, replaced);

    const notif = this.notifs.get(id);
    if (!notif) return;

    if (!self.get_dont_disturb()) {
      this.show();
      this.get_root()?.show();
    }

    setTimeout(
      () => {
        super.on_resolved(self, id, Notifd.ClosedReason.UNDEFINED);

        setTimeout(() => {
          if (!this._notifs.get_first_child()) {
            this.get_root()?.hide();
            this.hide();
          }
        }, notif.transition_duration + 1);
      },
      notif.notification.expire_timeout > 0
        ? notif.notification.expire_timeout
        : TIMEOUT,
    );
  }
}

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
      child: new Popups(false),
      visible: true,
      cssClasses: ["notification-popups"],
    });
  }
}
