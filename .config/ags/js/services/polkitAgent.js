import GLib from "gi://GLib";
import PolkitAgent from "gi://PolkitAgent";
import AccountsService from "gi://AccountsService";
import Polkit from "gi://Polkit";
import GjsPolkit from "gi://GjsPolkit";
import Service from "resource:///com/github/Aylur/ags/service.js";

const FALLBACK_ICON = "avatar-default-symbolic";

class AuthenticationDialog extends Service {
  static {
    Service.register(
      this,
      {
        done: ["boolean"],
        request: ["string", "boolean"],
        error: ["string"],
        info: ["string"],
      },
      {
        ["action-id"]: ["string", "r"],
        ["message"]: ["string", "r"],
        ["icon-name"]: ["string", "r"],
        ["echo-on"]: ["boolean", "r"],
        ["request"]: ["string", "r"],
        ["error"]: ["string", "r"],
        ["info"]: ["string", "r"],
        ["user-name"]: ["string", "r"],
        ["real-name"]: ["string", "r"],
        ["user-image"]: ["string", "r"],
      },
    );
  }

  constructor(actionId, message, iconName, cookie, userNames) {
    super();

    this._actionId = actionId;
    this.changed("action-id");
    this._message = message;
    this.changed("message");
    this._iconName = iconName;
    this.changed("icon-name");

    this._echoOn = null;
    this.changed("echo-on");
    this._request = null;
    this.changed("request");
    this._error = null;
    this.changed("error");
    this._info = null;
    this.changed("info");

    this._userName = null;
    this.changed("user-name");
    this._realName = null;
    this.changed("real-name");
    this._userImage = FALLBACK_ICON;
    this.changed("user-image");

    this._cookie = cookie;
    this._userNames = userNames;

    if (userNames.length > 1) {
      print(
        `polkitAuthenticationAgent: Received ${userNames.length} identities that can be used for authentication. Only considering one.`,
      );
    }

    let userName = GLib.get_user_name();

    print("username: " + userName);

    if (!userNames.includes(userName)) userName = "root";
    if (!userNames.includes(userName)) userName = userNames[0];

    this._user = AccountsService.UserManager.get_default().get_user(userName);
    this._user.connect("notify::is-loaded", this._onUserChanged.bind(this));
    this._user.connect("changed", this._onUserChanged.bind(this));

    print("realname: " + this._user.get_real_name());

    this._identityToAuth = Polkit.UnixUser.new_for_name(userName);

    this._startSession();

    this._onUserChanged();
  }

  _startSession() {
    this._session = null;

    this._session = new PolkitAgent.Session({
      identity: this._identityToAuth,
      cookie: this._cookie,
    });

    print("nova sessão " + this._session.toString());

    this._session.connect("completed", (_, success) => {
      if (success) {
        print("completou com sucesso");
        this.emit("done", false);
      } else {
        print("completou sem sucesso");
        this._startSession();
      }
    });

    this._session.connect("request", (_, request, echoOn) => {
      print("nova request:  " + request);
      print("novo echoon: " + echoOn.toString());

      this._request = request;
      this.changed("request");
      this._echoOn = echoOn;
      this.changed("echo-on");

      this.emit("request", request, echoOn);
    });

    this._session.connect("show-error", (_, error) => {
      print("novo erro: " + error);

      this._error = error;
      this.changed("error");

      this.emit("error", error);
    });

    this._session.connect("show-info", (_, info) => {
      print("novo info: " + info);

      this._info = info;
      this.changed("info");

      this.emit("info", info);
    });

    this._session.initiate();
  }

  _onUserChanged() {
    if (!this._user.is_loaded) return;

    const userName = this._user.get_user_name();
    if (userName) {
      this._userName = userName;
      this.changed("user-name");
    }

    const realName = this._user.get_real_name();
    if (realName) {
      this._realName = realName;
      this.changed("real-name");
    }

    const iconFile = this._user.get_icon_file();
    if (iconFile) {
      this._userImage = iconFile;
      this.changed("user-image");
    }
  }

  authenticate(password) {
    this?._session?.response(password);
  }

  cancel() {
    this.emit("done", true);
  }

  get action_id() {
    return this._actionId;
  }
  get message() {
    return this._message;
  }
  get icon_name() {
    return this._iconName;
  }
  get echo_on() {
    return this._echoOn;
  }
  get request() {
    return this._request;
  }
  get error() {
    return this._error;
  }
  get info() {
    return this._info;
  }
  get user_name() {
    return this._userName;
  }
  get real_name() {
    return this._realName;
  }
  get user_image() {
    return this._userImage;
  }
}

class AuthenticationAgent extends Service {
  static {
    // takes three arguments
    // the class itself
    // an object defining the signals
    // an object defining its properties
    Service.register(
      this,
      {
        initiate: [],
        done: [],
      },
      {},
    );
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
      this._nativeAgent.register();
    } catch (e) {
      log("Failed to register AuthenticationAgent");
    }
  }

  disable() {
    try {
      this._nativeAgent.unregister();
    } catch (e) {
      log("Failed to unregister AuthenticationAgent");
    }
  }

  _onInitiate(_, actionId, message, iconName, cookie, userNames) {
    print("nova autenticação iniciada");

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
    print("autenticação terminada com status " + dismissed.toString());
    this._currentDialog = null;

    this._nativeAgent.complete(dismissed);
    this.emit("done");
  }
}

const service = new AuthenticationAgent();
service.enable();

export default service;
