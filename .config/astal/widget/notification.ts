import { Gtk } from "astal/gtk4";
import { GLib, property, register } from "astal/gobject";
import Notifd from "gi://AstalNotifd";

import template from "./notification.blp";

@register({
  GTypeName: "Notification",
  Template: template,
  InternalChildren: [],
})
export default class Notification extends Gtk.Revealer {
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

  protected get_app_icon() {
    if (this.notification.app_icon) return this.notification.app_icon;
    else if (this.notification.desktop_entry)
      return this.notification.desktop_entry;
    else return "";
  }

  protected app_icon_visible() {
    if (this.notification.app_icon || this.notification.desktop_entry)
      return true;
    else return false;
  }

  protected get_app_name() {
    if (this.notification.app_name?.length > 0)
      return this.notification.app_name;
    else return "Desconhecido";
  }

  protected icon_visible() {
    return this.notification.image?.length > 0;
  }

  protected format_time() {
    return GLib.DateTime.new_from_unix_local(this.notification.time).format(
      "%H:%M",
    );
  }

  protected on_clicked() {
    this.notification.dismiss();
  }
}
