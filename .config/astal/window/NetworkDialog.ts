import { App, Astal, Gdk, Gtk } from "astal/gtk4";
import { property, register } from "astal/gobject";
import {
  AuthenticationAgent,
  AuthenticationDialog,
} from "../service/polkitAgent";
import libTrem from "gi://libTrem?version=0.1";

import Template from "./NetworkDialog.blp";
import NM from "gi://NM?version=1.0";

@register({
  GTypeName: "PasswordEntry",
})
class PasswordEntry extends Gtk.Entry {
  declare secret: libTrem.NetworkSecret;

  constructor(secret: libTrem.NetworkSecret) {
    super({
      halign: Gtk.Align.FILL,
      hexpand: true,
      sensitive: secret.key != null,
      placeholder_text: secret.label,
      text: secret.val,
      visibility: !secret.password,
    });

    this.secret = secret;
  }
}

@register({
  GTypeName: "NetworkDialog",
  Template: Template,
  InternalChildren: ["message", "passwords", "info", "auth"],
})
export default class NetworkDialog extends Astal.Window {
  @property(libTrem.NetworkSecretDialog)
  declare dialog: libTrem.NetworkSecretDialog;
  declare secrets: Array<PasswordEntry>;
  declare _message: Gtk.Label;
  declare _passwords: Gtk.Box;
  declare _info: Gtk.Label;
  declare _auth: Gtk.Button;

  constructor(dialog: libTrem.NetworkSecretDialog) {
    super({ application: App, name: `networkDialog ${dialog.request_id}` });
    print("construc dialog");

    this.dialog = dialog;
    this.dialog.connect("done", () => this.close());

    let initial_focus = false;
    this.secrets = dialog.get_secrets().map((s) => {
      const reactive = s.key != null;
      if (s.validate) s.valid = s.validate(s);
      else if (s.valid) s.valid = s.val.length > 0;

      const password = new PasswordEntry(s);

      password.connect("activate", (source) => {
        const text = source.get_text();
        if (text.length > 0) this.on_authenticate();
      });

      password.connect("notify::text", (source) => {
        const text = source.get_text();
        s.val = text;
        if (s.validate) s.valid = s.validate(s);
        else s.valid = s.val.length > 0;
        this.update_auth_button();
      });

      if (reactive) {
        if (!initial_focus) {
          password.grab_focus();
          initial_focus = true;
        }
      } else {
        s.valid = true;
      }

      this._passwords.append(password);
      return password;
    });
  }

  protected on_key_pressed(
    self: Gtk.EventControllerKey,
    keyval: number,
    keycode: number,
    state: Gdk.ModifierType,
  ) {
    if (keycode === 9) this.on_cancel();
  }

  protected on_change(self: Gtk.Entry) {
    const text = self.get_text();
    this._auth.sensitive = text.length > 0;
  }

  protected on_cancel() {
    this.dialog.cancel();
  }

  protected on_authenticate() {
    this.dialog.authenticate(this.secrets.map((s) => s.secret));
  }

  protected message_visible() {
    return this.dialog.message.length > 0;
  }

  protected info_visible() {
    return this.dialog.flags & NM.SecretAgentGetSecretsFlags.WPS_PBC_ACTIVE;
  }

  protected update_auth_button() {
    let valid = true;
    this.secrets.forEach((s) => {
      valid = valid && s.secret.valid;
    });
    this._auth.sensitive = valid;
  }
}
