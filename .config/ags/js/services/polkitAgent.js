import GLib from "gi://GLib";
import PolkitAgent from "gi://PolkitAgent";
import Polkit from "gi://Polkit";
import GjsPolkit from "gi://GjsPolkit";
import Service from "resource:///com/github/Aylur/ags/service.js";

class AuthenticationDialog extends Service {
  static {
    Service.register(
      this,
      {
        done: ["boolean"],
        request: ["string", "boolean"],
        error: ["string"],
        info: ["info"],
      },
      {
        ["echo-on"]: ["boolean", "r"],
        ["request"]: ["string", "r"],
        ["error"]: ["string", "r"],
        ["info"]: ["string", "r"],
      },
    );
  }

  constructor(actionId, message, iconName, cookie, userNames) {
    this._actionId = actionId;
    this._message = message;
    this._iconName = iconName;
    this._cookie = cookie;
    this._userNames = userNames;

    if (userNames.length > 1) {
      print(
        `polkitAuthenticationAgent: Received ${userNames.length} ` +
        "identities that can be used for authentication. Only " +
        "considering one.",
      );
    }

    let userName = GLib.get_user_name();

    if (!userNames.includes(userName)) userName = "root";
    if (!userNames.includes(userName)) userName = userNames[0];

    this._user = AccountsService.UserManager.get_default().get_user(userName);

    this._doneEmitted = false;
    this._identityToAuth = Polkit.UnixUser.new_for_name(userName);
    this._completed = false;

    this._startSession();
  }

  _startSession() {
    this._session = null;
    this._session = new PolkitAgent.Session({
      identity: this._identityToAuth,
      cookie: this._cookie,
    });

    this._session.connect("completed", (_, success) => {
      this._completed = true;

      if (success) {
        print("completou com sucesso");
        this.emit("done", true);
        this._doneEmitted = true;
      } else {
        print("completou sem sucesso");
        this._startSession();
      }
    });

    this._session.connect("request", (_, request, echoOn) => {
      print("nova request");
      this._request = request;
      this.changed("request");
      this._echoOn = echoOn;
      this.changed("echo-on");

      this.emit("request", request, echoOn);
    });

    this._session.connect("show-error", (_, error) => {
      print("novo erro");
      this._error = error;
      this.changed("error");

      this.emit("error", error);
    });

    this._session.connect("show-info", (_, info) => {
      print("novo info");
      this._info = info;
      this.changed("info");

      this.emit("info", info);
    });
  }

  authenticate(password) {
    this?._session?.response(password);
  }
}

class AuthenticationAgent extends Service {
  static {
    // takes three arguments
    // the class itself
    // an object defining the signals
    // an object defining its properties
    Service.register(this, { initiate: [] }, {});
  }

  constructor() {
    super();

    this._nativeAgent = new GjsPolkit.PolkitAuthenticationAgent();
    this._nativeAgent.connect("initiate", this._onInitiate.bind(this));
    this._nativeAgent.connect("cancel", this._onCancel.bind(this));

    this._currentDialog = null;
  }

  enable() {
    try {
      this.register();
    } catch (e) {
      log("Failed to register AuthenticationAgent");
    }
  }

  disable() {
    try {
      this.unregister();
    } catch (e) {
      log("Failed to unregister AuthenticationAgent");
    }
  }

  _onInitiate(_, actionId, message, iconName, cookie, userNames) {
    this._currentDialog = new AuthenticationDialog(
      actionId,
      message,
      iconName,
      cookie,
      userNames,
    );
    this._currentDialog.connect("done", this._onDialogDone.bind(this));
    this.emit("initiate");
    // this.changed("initiate");
  }

  _onCancel(_) {
    this._completeRequest(false);
  }

  _onDialogDone(_, dismissed) {
    this._completeRequest(dismissed);
  }

  _completeRequest(dismissed) {
    this._currentDialog.close();
    this._currentDialog = null;

    this._nativeAgent.complete(dismissed);
  }
}

const service = new AuthenticationAgent();

export default service;
