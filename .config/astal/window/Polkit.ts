import { App, Astal, Gdk, Gtk } from "astal/gtk4";
import { property, register } from "astal/gobject";
import {
  AuthenticationAgent,
  AuthenticationDialog,
} from "../service/polkitAgent";

import Template from "./Polkit.blp";

@register({
  GTypeName: "PolkitDialog",
  Template: Template,
  InternalChildren: ["message", "password", "info", "error", "auth"],
})
export default class PolkitDialog extends Astal.Window {
  @property(AuthenticationDialog) declare dialog: AuthenticationDialog;
  @property(Boolean) declare loading: boolean;
  declare _message: Gtk.Label;
  declare _password: Gtk.Entry;
  declare _info: Gtk.Label;
  declare _error: Gtk.Label;
  declare _auth: Gtk.Button;

  private response(text: string) {
    if (text.length > 0) {
      this._error.visible = false;
      this._info.visible = false;
      this.dialog.authenticate(text);
      this._password.sensitive = false;
      this._auth.sensitive = false;
    } else return;
  }

  constructor(dialog: AuthenticationDialog, agent: AuthenticationAgent) {
    super({ application: App });

    if (agent._currentDialog !== dialog) {
      this.close();
      return;
    }

    this.dialog = dialog;

    dialog.connect("success", (_: AuthenticationDialog, success: boolean) => {
      this.loading = false;
      if (!success) {
        this._error.visible = true;
        this._error.label = "não funcionou, tente novamente";
        this._auth.sensitive = true;

        this._password.sensitive = true;
        this._password.text = "";
        this._password.grab_focus();
      }
    });
    agent.connect("done", () => this.close());

    this._password.grab_focus();
  }

  protected on_key_pressed(
    self: Gtk.EventControllerKey,
    keyval: number,
    keycode: number,
    state: Gdk.ModifierType,
  ) {
    if (keycode === 9) this.on_cancel();
  }

  protected format_name() {
    if (this.dialog.real_name.length > 0) return this.dialog.real_name;
    else if (this.dialog.user_name.length > 0) return this.dialog.user_name;
    else return "Administrador";
  }

  protected on_change(self: Gtk.Entry) {
    const text = self.get_text();
    this._auth.sensitive = text.length > 0;
  }

  protected on_cancel() {
    this.dialog.cancel();
  }

  protected on_authenticate() {
    this.loading = true;
    this.response(this._password.get_text());
  }

  protected message_visible() {
    return this.dialog.message.length > 0;
  }

  protected info_visible() {
    return this.dialog.info.length > 0;
  }

  protected error_visible() {
    return this.dialog.error.length > 0;
  }
}
