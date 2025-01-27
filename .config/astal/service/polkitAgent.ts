import GLib from "gi://GLib";
import PolkitAgent from "gi://PolkitAgent";
import AccountsService from "gi://AccountsService";
import Polkit from "gi://Polkit";
import GjsPolkit from "gi://GjsPolkit";
import { App } from "astal/gtk4";
import { GObject, property, register, signal } from "astal/gobject";

const FALLBACK_ICON = "avatar-default-symbolic";

@register({
  GTypeName: "AuthenticationDialog",
})
export class AuthenticationDialog extends GObject.Object {
  @signal(Boolean) declare done: (a: boolean) => void;
  @signal(Boolean) declare success: (a: boolean) => void;

  declare _actionId: string;
  declare _message: string;
  declare _iconName: string;
  declare _echoOn: boolean;
  declare _cookie: string;
  declare _request: string;
  declare _error: string;
  declare _info: string;
  declare _userName: string;
  declare _realName: string;
  declare _userImage: string;
  declare _userNames: Array<string> | undefined;

  declare _session: PolkitAgent.Session;

  declare _user: AccountsService.User;
  declare _identityToAuth: Polkit.Identity;

  constructor(
    actionId: string,
    message: string,
    iconName: string,
    cookie: string,
    userNames: Array<string>,
  ) {
    super();

    this._actionId = actionId;
    this.notify("action-id");
    this._message = message;
    this.notify("message");
    this._iconName = iconName;
    this.notify("icon-name");

    this._echoOn = false;
    this.notify("echo-on");
    this._request = "";
    this.notify("request");
    this._error = "";
    this.notify("error");
    this._info = "";
    this.notify("info");

    this._userName = "";
    this.notify("user-name");
    this._realName = "";
    this.notify("real-name");
    this._userImage = FALLBACK_ICON;
    this.notify("user-image");

    this._cookie = cookie;
    this._userNames = userNames;

    let userName = GLib.get_user_name();

    if (userNames.length > 1) {
      logError(
        `polkitAuthenticationAgent: Received ${userNames.length} identities that can be used for authentication. Only considering one.`,
      );
    }

    if (!userNames.includes(userName)) userName = "root";
    if (!userNames.includes(userName)) userName = userNames[0];

    this._user = AccountsService.UserManager.get_default().get_user(userName);
    this._user.connect("notify::is-loaded", this._onUserChanged.bind(this));
    this._user.connect("changed", this._onUserChanged.bind(this));

    const i = Polkit.UnixUser.new_for_name(userName);
    if (!i) this.emit("done", false);
    else this._identityToAuth = i;

    this._startSession();
    this._onUserChanged();
  }

  _startSession() {
    this._session = new PolkitAgent.Session({
      identity: this._identityToAuth,
      cookie: this._cookie,
    });

    this._session.connect("completed", (_, success) => {
      this.emit("success", success);
      if (success) {
        this.emit("done", false);
      } else {
        this._startSession();
      }
    });

    this._session.connect("request", (_, request: string, echoOn: boolean) => {
      this._request = request;
      this.notify("request");

      this._echoOn = echoOn;
      this.notify("echo-on");
    });

    this._session.connect("show-error", (_, error: string) => {
      this._error = error;
      this.notify("error");
    });

    this._session.connect("show-info", (_, info: string) => {
      this._info = info;
      this.notify("info");
    });

    this._session.initiate();
  }

  _onUserChanged() {
    if (!this._user.is_loaded) return;

    const realName = this._user.get_real_name();
    if (realName) {
      this._realName = realName;
      this.notify("real-name");
    }

    const userName = this._user.get_user_name();
    if (userName) {
      this._userName = userName;
      this.notify("user-name");
    }

    const iconFile = this._user.get_icon_file();
    if (iconFile) {
      this._userImage = iconFile;
      this.notify("user-image");
    }
  }

  authenticate(password: string) {
    this?._session?.response(password);
  }

  cancel() {
    this.emit("done", true);
  }

  @property(String) get action_id() {
    return this._actionId;
  }
  @property(String) get message() {
    return this._message;
  }
  @property(String) get icon_name() {
    return this._iconName;
  }
  @property(Boolean) get echo_on() {
    return this._echoOn;
  }
  @property(String) get request() {
    return this._request;
  }
  @property(String) get error() {
    return this._error;
  }
  @property(String) get info() {
    return this._info;
  }
  @property(String) get user_name() {
    return this._userName;
  }
  @property(String) get real_name() {
    return this._realName;
  }
  @property(String) get user_image() {
    return this._userImage;
  }
}

@register({
  GTypeName: "AuthenticationAgent",
})
export class AuthenticationAgent extends GObject.Object {
  @signal(AuthenticationDialog) declare initiate: (
    a: AuthenticationDialog,
  ) => void;
  @signal() declare done: () => void;

  declare _nativeAgent: GjsPolkit.PolkitAuthenticationAgent;
  declare _currentDialog: AuthenticationDialog | null;

  constructor() {
    super();

    this._nativeAgent = new GjsPolkit.PolkitAuthenticationAgent();
    this._nativeAgent.connect("initiate", this._onInitiate.bind(this));
    this._nativeAgent.connect("cancel", this._onCancel.bind(this));
  }

  enable() {
    try {
      this._nativeAgent.register();
    } catch (e) {
      // @ts-ignore
      logError(e, "Failed to register AuthenticationAgent");
      App.quit();
    }
  }

  disable() {
    try {
      this._nativeAgent.unregister();
    } catch (e) {
      // @ts-ignore
      logError(e, "Failed to unregister AuthenticationAgent");
      App.quit();
    }
  }

  _onInitiate(
    _: GjsPolkit.PolkitAuthenticationAgent,
    actionId: string,
    message: string,
    iconName: string,
    cookie: string,
    userNames: Array<string>,
  ) {
    this._currentDialog = new AuthenticationDialog(
      actionId,
      message,
      iconName,
      cookie,
      userNames,
    );
    this._currentDialog.connect("done", this._onDialogDone.bind(this));
    this.emit("initiate", this._currentDialog);
  }

  _onCancel(_: GjsPolkit.PolkitAuthenticationAgent) {
    this._completeRequest(false);
  }

  _onDialogDone(_: AuthenticationDialog, dismissed: boolean) {
    this._completeRequest(dismissed);
  }

  _completeRequest(dismissed: boolean) {
    this._nativeAgent.complete(dismissed);

    this._currentDialog = null;
    this.emit("done");
  }
}
