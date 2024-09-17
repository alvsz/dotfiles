import Clutter from "gi://Clutter";
import GObject from "gi://GObject";
import NM from "gi://NM";
import Pango from "gi://Pango";
import Shell from "gi://Shell";
import St from "gi://St";

const NetworkSecretDialog = GObject.registerClass(
  class NetworkSecretDialog extends ModalDialog.ModalDialog {
    _init(
      agent,
      requestId,
      connection,
      settingName,
      hints,
      flags,
      contentOverride,
    ) {
      super._init({ styleClass: "prompt-dialog" });

      this._agent = agent;
      this._requestId = requestId;
      this._connection = connection;
      this._settingName = settingName;
      this._hints = hints;

      if (contentOverride) this._content = contentOverride;
      else this._content = this._getContent();

      let contentBox = new Dialog.MessageDialogContent({
        title: this._content.title,
        description: this._content.message,
      });

      let initialFocusSet = false;
      for (let i = 0; i < this._content.secrets.length; i++) {
        let secret = this._content.secrets[i];
        let reactive = secret.key != null;

        let entryParams = {
          style_class: "prompt-dialog-password-entry",
          hint_text: secret.label,
          text: secret.value,
          can_focus: reactive,
          reactive,
          x_align: Clutter.ActorAlign.CENTER,
        };
        if (secret.password) secret.entry = new St.PasswordEntry(entryParams);
        else secret.entry = new St.Entry(entryParams);
        ShellEntry.addContextMenu(secret.entry);
        contentBox.add_child(secret.entry);

        if (secret.validate) secret.valid = secret.validate(secret);
        // no special validation, just ensure it's not empty
        else secret.valid = secret.value.length > 0;

        if (reactive) {
          if (!initialFocusSet) {
            this.setInitialKeyFocus(secret.entry);
            initialFocusSet = true;
          }

          secret.entry.clutter_text.connect("activate", this._onOk.bind(this));
          secret.entry.clutter_text.connect("text-changed", () => {
            secret.value = secret.entry.get_text();
            if (secret.validate) secret.valid = secret.validate(secret);
            else secret.valid = secret.value.length > 0;
            this._updateOkButton();
          });
        } else {
          secret.valid = true;
        }
      }

      if (this._content.secrets.some((s) => s.password)) {
        let capsLockWarning = new ShellEntry.CapsLockWarning();
        contentBox.add_child(capsLockWarning);
      }

      if (flags & NM.SecretAgentGetSecretsFlags.WPS_PBC_ACTIVE) {
        let descriptionLabel = new St.Label({
          text: _(
            "Alternatively you can connect by pushing the “WPS” button on your router",
          ),
          style_class: "message-dialog-description",
        });
        descriptionLabel.clutter_text.line_wrap = true;
        descriptionLabel.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;

        contentBox.add_child(descriptionLabel);
      }

      this.contentLayout.add_child(contentBox);

      this._okButton = {
        label: _("Connect"),
        action: this._onOk.bind(this),
        default: true,
      };

      this.setButtons([
        {
          label: _("Cancel"),
          action: this.cancel.bind(this),
          key: Clutter.KEY_Escape,
        },
        this._okButton,
      ]);

      this._updateOkButton();
    }

    _updateOkButton() {
      let valid = true;
      for (let i = 0; i < this._content.secrets.length; i++) {
        let secret = this._content.secrets[i];
        valid &&= secret.valid;
      }

      this._okButton.button.reactive = valid;
      this._okButton.button.can_focus = valid;
    }

    _onOk() {
      let valid = true;
      for (let i = 0; i < this._content.secrets.length; i++) {
        let secret = this._content.secrets[i];
        valid &&= secret.valid;
        if (secret.key !== null) {
          if (this._settingName === "vpn")
            this._agent.add_vpn_secret(
              this._requestId,
              secret.key,
              secret.value,
            );
          else
            this._agent.set_password(this._requestId, secret.key, secret.value);
        }
      }

      if (valid) {
        this._agent.respond(
          this._requestId,
          Shell.NetworkAgentResponse.CONFIRMED,
        );
        this.close();
      }
      // do nothing if not valid
    }

    cancel() {
      this._agent.respond(
        this._requestId,
        Shell.NetworkAgentResponse.USER_CANCELED,
      );
      this.close();
    }

    _validateWpaPsk(secret) {
      let value = secret.value;
      if (value.length === 64) {
        // must be composed of hexadecimal digits only
        for (let i = 0; i < 64; i++) {
          if (
            !(
              (value[i] >= "a" && value[i] <= "f") ||
              (value[i] >= "A" && value[i] <= "F") ||
              (value[i] >= "0" && value[i] <= "9")
            )
          )
            return false;
        }
        return true;
      }

      return value.length >= 8 && value.length <= 63;
    }

    _validateStaticWep(secret) {
      let value = secret.value;
      if (secret.wep_key_type === NM.WepKeyType.KEY) {
        if (value.length === 10 || value.length === 26) {
          for (let i = 0; i < value.length; i++) {
            if (
              !(
                (value[i] >= "a" && value[i] <= "f") ||
                (value[i] >= "A" && value[i] <= "F") ||
                (value[i] >= "0" && value[i] <= "9")
              )
            )
              return false;
          }
        } else if (value.length === 5 || value.length === 13) {
          for (let i = 0; i < value.length; i++) {
            if (
              !(
                (value[i] >= "a" && value[i] <= "z") ||
                (value[i] >= "A" && value[i] <= "Z")
              )
            )
              return false;
          }
        } else {
          return false;
        }
      } else if (secret.wep_key_type === NM.WepKeyType.PASSPHRASE) {
        if (value.length < 0 || value.length > 64) return false;
      }
      return true;
    }

    _getWirelessSecrets(secrets, _wirelessSetting) {
      let wirelessSecuritySetting =
        this._connection.get_setting_wireless_security();

      if (this._settingName === "802-1x") {
        this._get8021xSecrets(secrets);
        return;
      }

      switch (wirelessSecuritySetting.key_mgmt) {
        // First the easy ones
        case "wpa-none":
        case "wpa-psk":
        case "sae":
          secrets.push({
            label: _("Password"),
            key: "psk",
            value: wirelessSecuritySetting.psk || "",
            validate: this._validateWpaPsk,
            password: true,
          });
          break;
        case "none": // static WEP
          secrets.push({
            label: _("Key"),
            key: `wep-key${wirelessSecuritySetting.wep_tx_keyidx}`,
            value:
              wirelessSecuritySetting.get_wep_key(
                wirelessSecuritySetting.wep_tx_keyidx,
              ) || "",
            wep_key_type: wirelessSecuritySetting.wep_key_type,
            validate: this._validateStaticWep,
            password: true,
          });
          break;
        case "ieee8021x":
          if (wirelessSecuritySetting.auth_alg === "leap") {
            // Cisco LEAP
            secrets.push({
              label: _("Password"),
              key: "leap-password",
              value: wirelessSecuritySetting.leap_password || "",
              password: true,
            });
          } else {
            // Dynamic (IEEE 802.1x) WEP
            this._get8021xSecrets(secrets);
          }
          break;
        case "wpa-eap":
          this._get8021xSecrets(secrets);
          break;
        default:
          log(
            `Invalid wireless key management: ${wirelessSecuritySetting.key_mgmt}`,
          );
      }
    }

    _get8021xSecrets(secrets) {
      let ieee8021xSetting = this._connection.get_setting_802_1x();

      /* If hints were given we know exactly what we need to ask */
      if (this._settingName === "802-1x" && this._hints.length) {
        if (this._hints.includes("identity")) {
          secrets.push({
            label: _("Username"),
            key: "identity",
            value: ieee8021xSetting.identity || "",
            password: false,
          });
        }
        if (this._hints.includes("password")) {
          secrets.push({
            label: _("Password"),
            key: "password",
            value: ieee8021xSetting.password || "",
            password: true,
          });
        }
        if (this._hints.includes("private-key-password")) {
          secrets.push({
            label: _("Private key password"),
            key: "private-key-password",
            value: ieee8021xSetting.private_key_password || "",
            password: true,
          });
        }
        return;
      }

      switch (ieee8021xSetting.get_eap_method(0)) {
        case "md5":
        case "leap":
        case "ttls":
        case "peap":
        case "fast":
          // TTLS and PEAP are actually much more complicated, but this complication
          // is not visible here since we only care about phase2 authentication
          // (and don't even care of which one)
          secrets.push({
            label: _("Username"),
            key: null,
            value: ieee8021xSetting.identity || "",
            password: false,
          });
          secrets.push({
            label: _("Password"),
            key: "password",
            value: ieee8021xSetting.password || "",
            password: true,
          });
          break;
        case "tls":
          secrets.push({
            label: _("Identity"),
            key: null,
            value: ieee8021xSetting.identity || "",
            password: false,
          });
          secrets.push({
            label: _("Private key password"),
            key: "private-key-password",
            value: ieee8021xSetting.private_key_password || "",
            password: true,
          });
          break;
        default:
          log(
            `Invalid EAP/IEEE802.1x method: ${ieee8021xSetting.get_eap_method(0)}`,
          );
      }
    }

    _getPPPoESecrets(secrets) {
      let pppoeSetting = this._connection.get_setting_pppoe();
      secrets.push({
        label: _("Username"),
        key: "username",
        value: pppoeSetting.username || "",
        password: false,
      });
      secrets.push({
        label: _("Service"),
        key: "service",
        value: pppoeSetting.service || "",
        password: false,
      });
      secrets.push({
        label: _("Password"),
        key: "password",
        value: pppoeSetting.password || "",
        password: true,
      });
    }

    _getMobileSecrets(secrets, connectionType) {
      let setting;
      if (connectionType === "bluetooth")
        setting =
          this._connection.get_setting_cdma() ||
          this._connection.get_setting_gsm();
      else setting = this._connection.get_setting_by_name(connectionType);
      secrets.push({
        label: _("Password"),
        key: "password",
        value: setting.value || "",
        password: true,
      });
    }

    _getContent() {
      let connectionSetting = this._connection.get_setting_connection();
      let connectionType = connectionSetting.get_connection_type();
      let wirelessSetting;
      let ssid;

      let content = {};
      content.secrets = [];

      switch (connectionType) {
        case "802-11-wireless":
          wirelessSetting = this._connection.get_setting_wireless();
          ssid = NM.utils_ssid_to_utf8(wirelessSetting.get_ssid().get_data());
          content.title = _("Authentication required");
          content.message = _(
            "Passwords or encryption keys are required to access the wireless network “%s”",
          ).format(ssid);
          this._getWirelessSecrets(content.secrets, wirelessSetting);
          break;
        case "802-3-ethernet":
          content.title = _("Wired 802.1X authentication");
          content.message = null;
          content.secrets.push({
            label: _("Network name"),
            key: null,
            value: connectionSetting.get_id(),
            password: false,
          });
          this._get8021xSecrets(content.secrets);
          break;
        case "pppoe":
          content.title = _("DSL authentication");
          content.message = null;
          this._getPPPoESecrets(content.secrets);
          break;
        case "gsm":
          if (this._hints.includes("pin")) {
            let gsmSetting = this._connection.get_setting_gsm();
            content.title = _("PIN code required");
            content.message = _(
              "PIN code is needed for the mobile broadband device",
            );
            content.secrets.push({
              label: _("PIN"),
              key: "pin",
              value: gsmSetting.pin || "",
              password: true,
            });
            break;
          }
        // fall through
        case "cdma":
        case "bluetooth":
          content.title = _("Authentication required");
          content.message = _(
            "A password is required to connect to “%s”",
          ).format(connectionSetting.get_id());
          this._getMobileSecrets(content.secrets, connectionType);
          break;
        default:
          log(`Invalid connection type: ${connectionType}`);
      }

      return content;
    }
  },
);

export default NetworkSecretDialog;
