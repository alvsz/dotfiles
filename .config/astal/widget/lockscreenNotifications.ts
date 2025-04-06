import { register } from "astal/gobject";

import NotificationCenter from "../widget/notificationCenter";
import Template from "./lockscreenNotifications.blp";
import AstalNotifd from "gi://AstalNotifd?version=0.1";

@register({
  GTypeName: "LockscreenNotifications",
  Template: Template,
})
export default class LockscreenNotifications extends NotificationCenter {
  protected on_notified(
    self: AstalNotifd.Notifd,
    id: number,
    replaced: boolean,
  ): void {
    super.on_notified(self, id, replaced);

    print("lock notif");
    this.show();
  }
  protected on_resolved(
    self: AstalNotifd.Notifd,
    id: number,
    reason: AstalNotifd.ClosedReason,
  ): void {
    super.on_resolved(self, id, reason);
    if (!this._notifs.get_first_child()) this.hide();
  }
}
