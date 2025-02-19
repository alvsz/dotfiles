import { GLib } from "astal";
import { App, Gdk, Gtk } from "astal/gtk4";
import GObject, { property, register } from "astal/gobject";
import AccountsService from "gi://AccountsService";

import Gtk4SessionLock from "gi://Gtk4SessionLock";

import Template from "./Lockscreen.blp";
import Auth from "gi://AstalAuth";

@register({
  GTypeName: "Lock",
})
export default class Lock extends GObject.Object {
  @property(Gtk4SessionLock.Instance) declare lock: Gtk4SessionLock.Instance;
  @property(Auth.Pam) declare pam: Auth.Pam;

  @property(String) get prompt() {
    return this._prompt;
  }
  @property(String) get error() {
    return this._error;
  }
  @property(String) get info() {
    return this._info;
  }
  @property(Boolean) get can_authenticate() {
    return this._can_authenticate;
  }

  private _prompt = "";
  private _error = "";
  private _info = "";
  private _can_authenticate = false;
  private windows: Map<Gdk.Monitor, Gtk.Window>;
  private user: AccountsService.User;

  private set_can_authenticate(val: boolean) {
    this._can_authenticate = val;
    this.notify("can_authenticate");
  }

  private set_prompt(val: string) {
    this._prompt = val;
    this.notify("prompt");
  }

  private set_error(val: string) {
    this._error = val;
    this.notify("error");
  }

  private set_info(val: string) {
    this._info = val;
    this.notify("info");
  }

  private on_locked() {
    print("locked");

    setTimeout(() => {
      this.lock.unlock();
    }, 10000);
  }

  private on_unlocked() {
    this.windows.forEach((w, m) => {
      w.hide();
      w.destroy();
      this.windows.delete(m);
    });
    this.set_can_authenticate(true);
    if (App.instance_name == "lockscreen") App.quit();
  }

  private on_failed() {
    print("failed");
  }

  constructor() {
    super();

    this.set_prompt("");
    this.set_error("");
    this.set_info("");

    this.windows = new Map<Gdk.Monitor, Gtk.Window>();
    this.lock = Gtk4SessionLock.Instance.new();
    this.pam = new Auth.Pam();

    const username = GLib.get_user_name();
    this.user = AccountsService.UserManager.get_default().get_user(username);

    if (!Gtk4SessionLock.is_supported()) return;

    this.lock.connect("locked", this.on_locked.bind(this));
    this.lock.connect("unlocked", this.on_unlocked.bind(this));
    this.lock.connect("failed", this.on_failed.bind(this));

    this.pam.start_authenticate();

    this.pam.connect("auth-error", (_, msg) => {
      print("error", msg);
      this.set_error(msg);
    });

    this.pam.connect("auth-info", (_, msg) => {
      print("info", msg);
      this.set_info(msg);
    });

    this.pam.connect("auth-prompt-hidden", (_, msg) => {
      print("hidden", msg);
      this.set_prompt(msg);
      this.set_can_authenticate(true);
    });

    this.pam.connect("auth-prompt-visible", (_, msg) => {
      print("visible", msg);
      this.set_prompt(msg);
      this.set_can_authenticate(true);
    });

    this.pam.connect("fail", (_, msg) => {
      print("fail", msg);
      this.set_error(msg);
      this.set_can_authenticate(true);
    });

    this.pam.connect("success", () => {
      this.lock.unlock();
    });
  }

  lock_now() {
    if (!this.lock.lock()) return;

    App.get_monitors().map((m) => {
      const lockscreen = new Lockscreen(m, this, this.user);
      this.windows.set(m, lockscreen);
      this.lock.assign_window_to_monitor(lockscreen, m);
      lockscreen.present();
    });
  }

  authenticate(pass: string) {
    if (!this._can_authenticate) return;

    this.set_can_authenticate(false);
    this.pam.supply_secret(pass);
  }
}

@register({
  GTypeName: "Lockscreen",
  Template: Template,
  InternalChildren: ["error", "password", "auth"],
})
class Lockscreen extends Gtk.Window {
  @property(AccountsService.User) declare user: AccountsService.User;
  @property(String) declare username: string;
  @property(Lock) declare lock: Lock;
  declare _password: Gtk.Entry;
  declare _auth: Gtk.Button;

  constructor(monitor: Gdk.Monitor, lock: Lock, user: AccountsService.User) {
    super({
      application: App,
      name: `Lock-${monitor.get_connector() || ""}`,
    });

    this.lock = lock;
    this.user = user;

    this.lock.connect("notify::can-authenticate", () => {
      if (this.lock.can_authenticate) {
        this._password.set_text("");
        this._password.grab_focus();
      }
    });
    this._password.grab_focus();
  }

  protected on_authenticate() {
    const text = this._password.get_text();

    if (text.length == 0) return;

    this._password.sensitive = false;
    this._auth.sensitive = false;
    this.lock.authenticate(text);
  }

  protected on_change(self: Gtk.Entry) {
    const text = self.get_text();
    this._auth.sensitive = text.length > 0;
  }

  protected is_info_visible() {
    return this.lock.info.length > 0;
  }

  protected is_error_visible() {
    return this.lock.error.length > 0;
  }
}
