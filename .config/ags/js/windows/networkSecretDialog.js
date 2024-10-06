import Widget from "resource:///com/github/Aylur/ags/widget.js";
import App from "resource:///com/github/Aylur/ags/app.js";
import NM from "gi://NM";

const networkAgentDialog = (dialog) => {
  const WINDOW_NAME = `networkAgentDialog ${dialog._requestId}`;

  let initialFocusSet = false;
  const secrets = Object.values(dialog.secrets).map((s) => {
    const reactive = s.key != null;

    if (s.validate) s.valid = s.validate(s);
    else if (s.value) s.valid = s.value.length > 0;

    const password = Widget.Entry({
      hpack: "fill",
      hexpand: true,

      sensitive: reactive,
      placeholderText: s.label,
      text: s.value,
      visibility: !s.password,
      caps_lock_warning: s.password,

      onChange: ({ text }) => {
        // print(text);
        s.value = text;
        if (s.validate) s.valid = s.validate(s);
        else s.valid = s.value.length > 0;
        updateAuthButton();
      },

      onAccept: ({ text }) => {
        if (text.length > 0) response();
      },
    });

    if (reactive) {
      if (!initialFocusSet) {
        password.grab_focus();
        initialFocusSet = true;
      }
    } else {
      s.valid = true;
    }

    return Object.assign(password, {
      secret: s,
    });
  });

  const authButton = Widget.Button({
    className: "authButton",
    hpack: "fill",
    child: Widget.Label("Autenticar"),
    sensitive: false,

    onClicked: () => {
      response();
    },
  });

  const updateAuthButton = () => {
    let valid = true;

    secrets.forEach((s) => {
      valid &&= s.secret.valid;
    });

    authButton.sensitive = valid;
  };

  const close = () => {
    App.closeWindow(WINDOW_NAME);
    const window = App.getWindow(WINDOW_NAME);
    if (window) App.removeWindow(window);
  };

  const cancel = () => {
    dialog.cancel();
    close();
  };

  const response = () => {
    dialog.authenticate(secrets.map((s) => s.secret));
    close();
  };

  const title = Widget.Label({
    className: "title",
    hpack: "center",
    label: dialog.bind("title"),
  });

  const message = Widget.Label({
    className: "message",
    hpack: "center",
    wrap: true,
    justification: "center",
  }).hook(dialog, (self) => {
    const m = dialog.message;

    if (m) {
      self.visible = true;
      self.label = m;
    } else self.visible = false;
  });

  const info = Widget.Label({
    className: "info",
    hpack: "center",
    wrap: true,
    justification: "center",
  }).hook(dialog, (self) => {
    const f = dialog.flags;

    if (f & NM.SecretAgentGetSecretsFlags.WPS_PBC_ACTIVE) {
      self.label = `Alternativamente, você pode conectar pressionando o botão "WPS" no seu roteador`;
      self.visible = true;
    } else self.visible = false;
  });

  const password = Widget.Box({
    hpack: "fill",
    vpack: "start",
    hexpand: true,
    vertical: true,
    homogeneous: false,
    className: "passwords",
    children: secrets,
  });

  const cancelButton = Widget.Button({
    className: "cancelButton",
    hpack: "fill",
    child: Widget.Label("Cancelar"),
    onClicked: () => cancel(),
  });

  dialog.bind("done", () => close());

  return Widget.Window({
    name: WINDOW_NAME,
    anchor: [],
    layer: "overlay",
    keymode: "exclusive",
    visible: true,
    child: Widget.Box({
      vertical: true,
      homogeneous: false,
      className: "networkAgentDialog",
      children: [
        title,
        message,
        password,
        info,
        Widget.Box({
          homogeneous: true,
          hpack: "fill",
          hexpand: true,
          vertical: false,
          children: [cancelButton, authButton],
        }),
      ],
    }),
  }).keybind("Escape", () => cancel());
};

export default networkAgentDialog;
