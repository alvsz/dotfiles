import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";

import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Gtk from "gi://Gtk";
import NM from "gi://NM";
import GjsNetworkAgent from "gi://GjsNetworkAgent";
globalThis.gjsnetworkagent = GjsNetworkAgent;

// import NetworkSecretDialog from "./networkSecretDialog.js";
// import VPNRequestHandler from "./VPNRequestHandler.js";

const app = Gtk.Application.get_default();

Gio._promisify(GjsNetworkAgent.NetworkAgent.prototype, "init_async");
Gio._promisify(GjsNetworkAgent.NetworkAgent.prototype, "search_vpn_plugin");

globalThis.gjsnetworkagent = GjsNetworkAgent;

class NetworkSecretDialog extends Service {
  static {
    Service.register(
      this,
      {
        done: ["boolean"],
      },
      {
        ["title"]: ["string", "r"],
        ["message"]: ["string", "r"],
        ["secrets"]: ["jsobject", "r"],
        ["request-id"]: ["string", "r"],
        ["flags"]: ["int", "r"],
      },
    );
  }
  constructor(
    agent,
    requestId,
    connection,
    settingName,
    hints,
    flags,
    contentOverride,
  ) {
    super();

    this._agent = agent;
    this._requestId = requestId;
    this.changed("request-id");
    this._connection = connection;
    this._settingName = settingName;
    this._hints = hints;
    this._flags = flags;
    this.changed("flags");

    if (contentOverride) this._content = contentOverride;
    else this._content = this._getContent();
  }

  cancel() {
    this._agent.respond(
      this._requestId,
      Shell.NetworkAgentResponse.USER_CANCELED,
    );
    this.close();
  }

  authenticate(secrets) {
    let valid = true;
    for (let i = 0; i < secrets.length; i++) {
      let secret = secrets[i];
      valid &&= secret.valid;
      if (secret.key !== null) {
        if (this._settingName === "vpn") this.cancel();
        //   this._agent.add_vpn_secret(this._requestId, secret.key, secret.value);
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
        content.message = _("A password is required to connect to “%s”").format(
          connectionSetting.get_id(),
        );
        this._getMobileSecrets(content.secrets, connectionType);
        break;
      default:
        log(`Invalid connection type: ${connectionType}`);
    }

    this.changed("title");
    this.changed("message");
    this.changed("secrets");
    return content;
  }

  get title() {
    return this._content.title;
  }
  get message() {
    return this._content.title;
  }
  get secrets() {
    return this._content.secrets;
  }
  get request_id() {
    return this._requestId;
  }
  get flags() {
    return this._flags;
  }
}

class NetworkAgent extends Service {
  static {
    Service.register(
      this,
      {
        initiate: ["jsobject"],
        //
      },
      {
        //
      },
    );
  }
  constructor() {
    super();

    this._native = new GjsNetworkAgent.NetworkAgent({
      identifier: app.application_id,
      capabilities: NM.SecretAgentCapabilities.VPN_HINTS,
      auto_register: false,
    });

    this._dialogs = {};
    this._vpnRequests = {};
    this._notifications = {};

    this._native.connect("new-request", this._newRequest.bind(this));
    this._native.connect("cancel-request", this._cancelRequest.bind(this));

    this._initialized = false;
    this._initNative();
  }

  async _initNative() {
    try {
      await this._native.init_async(GLib.PRIORITY_DEFAULT, null);
      this._initialized = true;
    } catch (e) {
      this._native = null;
      logError(e, "error initializing the NetworkManager Agent");
    }
  }

  enable() {
    if (!this._native) return;

    this._native.auto_register = true;
    if (this._initialized && !this._native.registered)
      this._native.register_async(null, null);
  }

  disable() {
    let requestId;

    for (requestId in this._dialogs) this._dialogs[requestId].cancel();
    this._dialogs = {};

    for (requestId in this._vpnRequests)
      this._vpnRequests[requestId].cancel(true);
    this._vpnRequests = {};

    for (requestId in this._notifications)
      this._notifications[requestId].destroy();
    this._notifications = {};

    if (!this._native) return;

    this._native.auto_register = false;
    if (this._initialized && this._native.registered)
      this._native.unregister_async(null, null);
  }

  async _showNotification(requestId, connection, settingName, hints, flags) {
    let title, body;

    let connectionSetting = connection.get_setting_connection();
    let connectionType = connectionSetting.get_connection_type();
    switch (connectionType) {
      case "802-11-wireless": {
        let wirelessSetting = connection.get_setting_wireless();
        let ssid = NM.utils_ssid_to_utf8(wirelessSetting.get_ssid().get_data());
        title = "Autenticação necessária";
        body =
          "Senhas ou chaves criptografadas são necessárias para acessar a rede sem fio “%s”".format(
            ssid,
          );
        break;
      }
      case "802-3-ethernet":
        title = "Autenticação 802.1X com cabo";
        body = "Uma senha é necessária para se conectar a “%s”".format(
          connection.get_id(),
        );
        break;
      case "pppoe":
        title = "Autenticação DSL";
        body = "Uma senha é necessária para se conectar a “%s”".format(
          connection.get_id(),
        );
        break;
      case "gsm":
        if (hints.includes("pin")) {
          title = "Código PIN necessário";
          body =
            "O código PIN é necessário para o dispositivo móvel de banda larga";
          break;
        }
      // fall through
      case "cdma":
      case "bluetooth":
        title = "Autenticação necessária";
        body = "Uma senha é necessária para se conectar a “%s”".format(
          connectionSetting.get_id(),
        );
        break;
      case "vpn":
        title = "Senha de VPN";
        body = "Uma senha é necessária para se conectar a “%s”".format(
          connectionSetting.get_id(),
        );
        break;
      default:
        log(`Invalid connection type: ${connectionType}`);
        this._native.respond(
          requestId,
          GjsNetworkAgent.NetworkAgentResponse.INTERNAL_ERROR,
        );
        return;
    }

    let id;
    let notif = { n: id, answered: false };

    id = await Utils.notify({
      summary: title,
      body: body,
      iconName: "dialog-password-symbolic",
      actions: {
        Autenticar: () => {
          notif.answered = true;
          this._handleRequest(requestId, connection, settingName, hints, flags);
        },
      },
    });

    const n = Notifications.getNotification(id);
    this._notifications[requestId] = notif;

    n.connect("closed", () => {
      if (!notif.answered)
        this._native.respond(
          requestId,
          GjsNetworkAgent.NetworkAgentResponse.USER_CANCELED,
        );
      delete this._notifications[requestId];
    });
  }

  _newRequest(agent, requestId, connection, settingName, hints, flags) {
    if (!(flags & NM.SecretAgentGetSecretsFlags.USER_REQUESTED))
      this._showNotification(requestId, connection, settingName, hints, flags);
    else this._handleRequest(requestId, connection, settingName, hints, flags);
  }

  _handleRequest(requestId, connection, settingName, hints, flags) {
    if (settingName === "vpn") {
      logError("não suporta vpn ainda");
      this._native.respond(
        requestId,
        GjsNetworkAgent.NetworkAgentResponse.USER_CANCELED,
      );
      // this._vpnRequest(requestId, connection, hints, flags);
      return;
    }

    let dialog = new NetworkSecretDialog(
      this._native,
      requestId,
      connection,
      settingName,
      hints,
      flags,
    );
    dialog.connect("destroy", () => {
      delete this._dialogs[requestId];
    });
    this._dialogs[requestId] = dialog;
    this.emit("initiate", dialog);
  }

  _cancelRequest(agent, requestId) {
    if (this._dialogs[requestId]) {
      this._dialogs[requestId].cancel();
      // this._dialogs[requestId].close();
      // this._dialogs[requestId].destroy();
      delete this._dialogs[requestId];
    } else if (this._vpnRequests[requestId]) {
      print("vpn");
      // this._vpnRequests[requestId].cancel(false);
      delete this._vpnRequests[requestId];
    }
  }

  async _vpnRequest(requestId, connection, hints, flags) {
    let vpnSetting = connection.get_setting_vpn();
    let serviceType = vpnSetting.service_type;

    let binary = await this._findAuthBinary(serviceType);
    if (!binary) {
      log("Invalid VPN service type (cannot find authentication binary)");

      /* cancel the auth process */
      this._native.respond(
        requestId,
        GjsNetworkAgent.NetworkAgentResponse.INTERNAL_ERROR,
      );
      return;
    }

    let vpnRequest = new VPNRequestHandler(
      this._native,
      requestId,
      binary,
      serviceType,
      connection,
      hints,
      flags,
    );
    vpnRequest.connect("destroy", () => {
      delete this._vpnRequests[requestId];
    });
    this._vpnRequests[requestId] = vpnRequest;
  }

  async _findAuthBinary(serviceType) {
    let plugin;

    try {
      plugin = await this._native.search_vpn_plugin(serviceType);
    } catch (e) {
      logError(e);
      return null;
    }

    const fileName = plugin.get_auth_dialog();
    if (!GLib.file_test(fileName, GLib.FileTest.IS_EXECUTABLE)) {
      log(`VPN plugin at ${fileName} is not executable`);
      return null;
    }

    const prop = plugin.lookup_property("GNOME", "supports-external-ui-mode");
    const trimmedProp = prop?.trim().toLowerCase() ?? "";

    return {
      fileName,
      supportsHints: plugin.supports_hints(),
      externalUIMode: ["true", "yes", "on", "1"].includes(trimmedProp),
    };
  }
}

const service = new NetworkAgent();
service.enable();

export default service;

// 217 VPNRequestHandler, 175 NetworkSecretDialog, 141 source notification
