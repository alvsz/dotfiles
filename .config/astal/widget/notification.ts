import { Gtk } from "astal/gtk4";
import { GLib, property, register } from "astal/gobject";
import Notifd from "gi://AstalNotifd";

import template from "./notification.blp";

@register({
  GTypeName: "Notification",
  Template: template,
  InternalChildren: [],
})
export default class Notification extends Gtk.Box {
  declare popup: boolean;
  declare _notification: Notifd.Notification;

  @property(Notifd.Notification) get notification() {
    return this._notification;
  }

  set notification(notif: Notifd.Notification) {
    this._notification = notif;
    this.notify("notification");
  }

  constructor(notif: Notifd.Notification, p: boolean) {
    super();
    this.notification = notif;
    this.popup = p;
  }

  protected on_invoked(self: Notifd.Notification, action_id: string) {
    print(self, action_id);
  }

  protected on_resolved(
    self: Notifd.Notification,
    reason: Notifd.ClosedReason,
  ) {
    print(self, reason);
  }

  protected format_time() {
    return GLib.DateTime.new_from_unix_local(this.notification.time).format(
      "%H:%M",
    );
  }

  protected on_clicked() {
    // print("clicked!");
    // if (this.popup)
    this.notification.dismiss();
  }
}
