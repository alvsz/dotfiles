import { Gtk } from "astal/gtk4";
import template from "./notificationCenter.blp";
import { property, register } from "astal/gobject";
import Notifd from "gi://AstalNotifd";

import Notification from "./notification";

@register({
  GTypeName: "NotificationCenter",
  Template: template,
  InternalChildren: ["notifs"],
})
export default class NotificationCenter extends Gtk.Box {
  declare notifs: Map<number, Notification>;
  declare _notifs: Gtk.Box;
  @property(Notifd.Notifd) declare notifd: Notifd.Notifd;
  @property(Boolean) declare hidden: boolean;

  protected async get_old_notifications() {
    setTimeout(() => {
      this.notifd
        .get_notifications()
        .forEach((n) => this.on_notified(this.notifd, n.id, false));
    }, 1000);
  }

  constructor(hidden: boolean) {
    super();
    this.hidden = hidden;
    this.notifs = new Map<number, Notification>();

    this.get_old_notifications();
  }

  protected on_notified(self: Notifd.Notifd, id: number, replaced: boolean) {
    if (!this.notifs) this.notifs = new Map<number, Notification>();

    if (replaced && this.notifs.has(id)) {
      const notif = this.notifs.get(id);
      if (notif) {
        notif.notification = self.get_notification(id);
        notif.reveal_child = true;
        this.reorder_child_after(notif, null);
      }
    } else {
      const notif = new Notification(
        self.get_notification(id),
        false,
        this.hidden,
      );
      notif.reveal_child = true;
      this.notifs.set(id, notif);
      this._notifs.prepend(notif);
    }
  }

  protected on_resolved(
    self: Notifd.Notifd,
    id: number,
    reason: Notifd.ClosedReason,
  ) {
    if (!this.notifs) this.notifs = new Map<number, Notification>();
    const notif = this.notifs.get(id);

    if (notif) {
      notif.reveal_child = false;

      setTimeout(() => {
        notif.hide();
        this._notifs.remove(notif);
      }, notif.transition_duration);
    }
  }

  protected on_dnd(self: Notifd.Notifd) {}

  protected on_clear() {
    this.notifd.get_notifications().forEach((n) => n.dismiss());
  }

  protected on_dnd_active(self: Gtk.Switch) {
    const active = self.get_active();
    this.notifd.set_dont_disturb(active);
    this.notifd.dont_disturb = active;
  }
}
