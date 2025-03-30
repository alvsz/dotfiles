import { GLib } from "astal";
import { App, Gdk, Gtk } from "astal/gtk4";
import GObject, { property, register } from "astal/gobject";

import Auth from "gi://AstalAuth";
import Mpris from "gi://AstalMpris";
import Cava from "gi://AstalCava";

import AccountsService from "gi://AccountsService";
import Gtk4SessionLock from "gi://Gtk4SessionLock";

import icons from "../icons";
import Template from "./Lockscreen.blp";

@register({
  GTypeName: "Lock",
})
export default class Lock extends GObject.Object {
  private _locked = false;
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
  @property(Boolean) get locked() {
    return this._locked;
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
    this._locked = true;
    this.notify("locked");

    this.pam.start_authenticate();

    // setTimeout(() => {
    //   this.lock.unlock();
    // }, 30000);
  }

  private on_unlocked() {
    this._locked = false;
    this.notify("locked");

    this.windows.forEach((w, m) => {
      w.hide();
      w.destroy();
      this.windows.delete(m);
    });
    this.set_can_authenticate(true);
    if (App.instance_name == "lockscreen") App.quit();
  }

  private on_failed() {}

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

    this.pam.connect("auth-error", (_, msg) => {
      this.set_error(msg);
      this.set_can_authenticate(true);
    });

    this.pam.connect("auth-info", (_, msg) => {
      this.set_info(msg);
      this.set_can_authenticate(true);
    });

    this.pam.connect("auth-prompt-hidden", (_, msg) => {
      this.set_prompt(msg);
      this.set_can_authenticate(true);
    });

    this.pam.connect("fail", (_, msg) => {
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
    this.set_info("");
    this.set_error("");
    this.pam.supply_secret(pass);
    this.pam.start_authenticate();
  }
}

@register({
  GTypeName: "Lockscreen",
  Template: Template,
  InternalChildren: [
    "error",
    "password",
    "auth",
    "clock",
    //
    "date",
    "cava",
  ],
})
class Lockscreen extends Gtk.Window {
  @property(AccountsService.User) declare user: AccountsService.User;
  @property(String) declare username: string;
  @property(Lock) declare lock: Lock;
  @property(Mpris.Player) declare player: Mpris.Player;
  @property(Cava.Cava) declare cava: Cava.Cava;
  private mpris: Mpris.Mpris;
  declare _cava: Gtk.DrawingArea;

  declare _password: Gtk.Entry;
  declare _auth: Gtk.Button;
  declare _clock: Gtk.Label;
  declare _date: Gtk.Label;

  private update_clock() {
    const now = GLib.DateTime.new_now_local();
    this._clock.label = now.format("%R") || "";
    this._date.label = now.format("%A, %d de %B") || "";
  }

  protected format_play_button() {
    if (this.player?.playback_status == Mpris.PlaybackStatus.PLAYING)
      return icons.mpris.pause;
    else return icons.mpris.play;
  }

  protected on_value_changed(self: Gtk.Adjustment) {
    if (Math.abs(self.value - this.player?.position) > 1) {
      this.player?.set_position(self.value);
    }
  }

  protected format_length() {
    return this.lengthStr(this.player?.length);
  }

  protected format_position() {
    return this.lengthStr(this.player?.position);
  }

  protected on_previous() {
    this.player?.previous();
  }

  protected on_playpause() {
    this.player?.play_pause();
  }

  protected on_next() {
    this.player?.next();
  }

  protected spacer_visible() {
    return this.player?.can_go_next === this.player?.can_go_previous;
  }

  private lengthStr(length: number) {
    if (length === -1) return "--:--";
    const min = Math.floor(length / 60);
    const sec = Math.floor(length % 60);
    const sec0 = sec < 10 ? "0" : "";
    return `${min}:${sec0}${sec}`;
  }

  constructor(monitor: Gdk.Monitor, lock: Lock, user: AccountsService.User) {
    super({
      application: App,
      name: `Lock-${monitor.get_connector() || ""}`,
    });

    setInterval(() => {
      this.update_clock();
    }, 15000);

    this.lock = lock;
    this.user = user;

    this.lock.connect("notify::can-authenticate", () => {
      if (this.lock.can_authenticate) {
        this._password.set_text("");
        this._password.grab_focus();
      }
    });

    this._password.grab_focus();

    this.update_clock();

    this.mpris = Mpris.get_default();
    this.mpris.connect(
      "player-added",
      (self: Mpris.Mpris, player: Mpris.Player) =>
        (this.player = self.get_players()[0]),
    );
    this.mpris.connect(
      "player-closed",
      (self: Mpris.Mpris, player: Mpris.Player) =>
        (this.player = self.get_players()[0]),
    );
    this.player = this.mpris.get_players()[0];

    this._cava.set_draw_func((self, cr, width, height) => {
      print("redraw", self, cr, width, height);
    });

    this.cava.connect("notify", (self) => {
      this._cava.queue_draw();
    });
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
