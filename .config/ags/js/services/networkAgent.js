import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Gtk from "gi://Gtk";
import NM from "gi://NM";
import Shell from "gi://Shell";
import GjsNetworkAgent from "gi://GjsNetworkAgent";

import NetworkSecretDialog from "./networkSecretDialog.js";
import VPNRequestHandler from "./VPNRequestHandler.js";

const app = Gtk.Application.get_default();

Gio._promisify(Shell.NetworkAgent.prototype, "init_async");
Gio._promisify(Shell.NetworkAgent.prototype, "search_vpn_plugin");

class NetworkAgent extends Service {
  static {
    Service.register(
      this,
      {
        //
      },
      {
        //
      },
    );
  }
  constructor() {
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

  _showNotification(requestId, connection, settingName, hints, flags) {
    let title, body;

    let connectionSetting = connection.get_setting_connection();
    let connectionType = connectionSetting.get_connection_type();
    switch (connectionType) {
      case "802-11-wireless": {
        let wirelessSetting = connection.get_setting_wireless();
        let ssid = NM.utils_ssid_to_utf8(wirelessSetting.get_ssid().get_data());
        title = _("Authentication required");
        body = _(
          "Passwords or encryption keys are required to access the wireless network “%s”",
        ).format(ssid);
        break;
      }
      case "802-3-ethernet":
        title = _("Wired 802.1X authentication");
        body = _("A password is required to connect to “%s”").format(
          connection.get_id(),
        );
        break;
      case "pppoe":
        title = _("DSL authentication");
        body = _("A password is required to connect to “%s”").format(
          connection.get_id(),
        );
        break;
      case "gsm":
        if (hints.includes("pin")) {
          title = _("PIN code required");
          body = _("PIN code is needed for the mobile broadband device");
          break;
        }
      // fall through
      case "cdma":
      case "bluetooth":
        title = _("Authentication required");
        body = _("A password is required to connect to “%s”").format(
          connectionSetting.get_id(),
        );
        break;
      case "vpn":
        title = _("VPN password");
        body = _("A password is required to connect to “%s”").format(
          connectionSetting.get_id(),
        );
        break;
      default:
        log(`Invalid connection type: ${connectionType}`);
        this._native.respond(
          requestId,
          Shell.NetworkAgentResponse.INTERNAL_ERROR,
        );
        return;
    }

    const source = MessageTray.getSystemSource();
    const notification = new MessageTray.Notification({ source, title, body });
    notification.iconName = "dialog-password-symbolic";

    notification.connect("activated", () => {
      notification.answered = true;
      this._handleRequest(requestId, connection, settingName, hints, flags);
    });

    this._notifications[requestId] = notification;
    notification.connect("destroy", () => {
      if (!notification.answered)
        this._native.respond(
          requestId,
          Shell.NetworkAgentResponse.USER_CANCELED,
        );
      delete this._notifications[requestId];
    });

    source.addNotification(notification);
  }

  _newRequest(agent, requestId, connection, settingName, hints, flags) {
    if (!(flags & NM.SecretAgentGetSecretsFlags.USER_REQUESTED))
      this._showNotification(requestId, connection, settingName, hints, flags);
    else this._handleRequest(requestId, connection, settingName, hints, flags);
  }

  _handleRequest(requestId, connection, settingName, hints, flags) {
    if (settingName === "vpn") {
      this._vpnRequest(requestId, connection, hints, flags);
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
    dialog.open();
  }

  _cancelRequest(agent, requestId) {
    if (this._dialogs[requestId]) {
      this._dialogs[requestId].close();
      this._dialogs[requestId].destroy();
      delete this._dialogs[requestId];
    } else if (this._vpnRequests[requestId]) {
      this._vpnRequests[requestId].cancel(false);
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
        Shell.NetworkAgentResponse.INTERNAL_ERROR,
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

export default NetworkAgent;
