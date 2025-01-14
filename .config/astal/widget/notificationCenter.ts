import { App, Astal, Gtk } from "astal/gtk4";
import template from "./notificationCenter.blp";
import { property, register } from "astal/gobject";
import Notifd from "gi://AstalNotifd";

import Notification from "./notification";

@register({
  GTypeName: "NotificationCenter",
  Template: template,
})
export default class NotificationCenter extends Gtk.Box {
  declare notifs: Map<number, Notification>;
  @property(Notifd.Notifd) declare notifd: Notifd.Notifd;

  constructor() {
    super();
    this.notifs = new Map<number, Notification>();
  }

  protected on_notified(self: Notifd.Notifd, id: number, replaced: boolean) {
    if (replaced && this.notifs.has(id)) {
      const notif = this.notifs.get(id);
      if (notif) {
        notif.notification = self.get_notification(id);
        this.reorder_child_after(notif, null);
      }
    } else {
      const notif = new Notification(self.get_notification(id), false);
      this.notifs.set(id, notif);
      this.append(notif);
    }
  }

  protected on_resolved(
    self: Notifd.Notifd,
    id: number,
    reason: Notifd.ClosedReason,
  ) {
    if (!this.notifs.has(id)) return;

    const notif = this.notifs.get(id);
    if (notif) this.remove(notif);
  }
}
