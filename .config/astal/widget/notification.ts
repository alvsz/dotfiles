import { Gtk, Astal, Gdk } from "astal/gtk4";
import { GLib, property, register } from "astal/gobject";
import Notifd from "gi://AstalNotifd";

import template from "./notification.blp";

const fileExists = (path: string) => GLib.file_test(path, GLib.FileTest.EXISTS);

const urgency = {
  [Notifd.Urgency.LOW]: "low",
  [Notifd.Urgency.NORMAL]: "normal",
  [Notifd.Urgency.CRITICAL]: "critical",
};

@register({
  GTypeName: "Notification",
  Template: template,
  InternalChildren: ["actions"],
})
export default class Notification extends Gtk.Revealer {
  declare popup: boolean;
  declare _actions: Gtk.Box;
  declare _notification: Notifd.Notification;
  private _not_hidden: boolean;

  @property(Notifd.Notification) get notification() {
    return this._notification;
  }
  @property(Boolean) get not_hidden() {
    return this._not_hidden;
  }

  set notification(notif: Notifd.Notification) {
    this._notification = notif;
    this.notify("notification");
  }

  constructor(notif: Notifd.Notification, p: boolean, h: boolean) {
    super();
    this.notification = notif;
    this.popup = p;
    this._not_hidden = !h;
    this.notify("not-hidden");

    for (let a of this.notification.actions) {
      const b = new Gtk.Button({
        child: new Gtk.Label({
          label: a.label,
          wrap: true,
          justify: Gtk.Justification.CENTER,
        }),
      });

      b.connect("clicked", () => {
        this.notification.invoke(a.id);
      });

      this._actions.append(b);
      this._actions.show();
    }
    this.add_css_class(urgency[this.notification.urgency]);
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

  protected get_icon() {
    if (
      this.notification.image?.length > 0 &&
      !fileExists(this.notification.image)
    )
      return this.notification.image;
    else return "";
  }

  protected get_ficon() {
    if (
      this.notification.image?.length > 0 &&
      fileExists(this.notification.image)
    )
      return this.notification.image;
    else return "";
  }

  protected icon_visible() {
    return (
      this.notification.image?.length > 0 &&
      !fileExists(this.notification.image)
    );
  }

  protected ficon_visible() {
    return (
      this.notification.image?.length > 0 && fileExists(this.notification.image)
    );
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
