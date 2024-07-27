import Widget from "resource:///com/github/Aylur/ags/widget.js";
import App from "resource:///com/github/Aylur/ags/app.js";
import polkitAgent from "../services/polkitAgent.js";

const WINDOW_NAME = "polkit";

const polkit = (dialog) => {
  const close = () => {
    App.closeWindow(WINDOW_NAME);
    const window = App.getWindow(WINDOW_NAME);
    if (window) App.removeWindow(window);
  };
  const cancel = () => {
    dialog.cancel();
    // close();
  };
  const response = (text) => {
    if (text.length > 0) {
      error.visible = false;
      info.visible = false;
      dialog.authenticate(text);
      password.sensitive = false;
      authButton.sensitive = false;
    } else return;
  };

  const title = Widget.Label({
    className: "title",
    hpack: "center",
    label: "Autenticação necessária",
  });

  const userImage = Widget.Icon({
    className: "userImage",
    hpack: "center",
    icon: dialog.bind("user-image"),
  });

  const userName = Widget.Label({
    className: "userName",
    hpack: "center",
  }).hook(dialog, (self) => {
    if (dialog.realName) self.label = dialog.realName;
    else if (dialog.userName) self.label = dialog.userName;
    else self.label = "Administrador";
  });

  const message = Widget.Label({
    className: "message",
    hpack: "center",
    wrap: true,
    justification: "center",
  }).hook(dialog, (self) => {
    if (dialog.message) {
      self.visible = true;
      self.label = dialog.message;
    } else self.visible = false;
  });

  const info = Widget.Label({
    className: "info",
    hpack: "center",
    wrap: true,
    justification: "center",
    // label:
    //   "Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.",
  }).hook(
    dialog,
    (self) => {
      if (dialog.info) {
        self.visible = true;
        self.label = dialog.info;
      } else self.visible = false;
    },
    "info",
  );

  const password = Widget.Entry({
    // hpack: "center",
    hpack: "fill",
    hexpand: true,
    placeholderText: "Senha",
    visibility: dialog.bind("echo-on"),
    onChange: ({ text }) => {
      authButton.sensitive = text.length > 0;
    },
    onAccept: ({ text }) => {
      response(text);
    },
  });

  const error = Widget.Label({
    className: "error",
    hpack: "center",
    wrap: true,
    justification: "center",
    // label:
    //   "Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.",
  }).hook(
    dialog,
    (self) => {
      if (dialog.error) {
        self.visible = true;
        self.label = dialog.error;
      } else self.visible = false;
    },
    "error",
  );

  const cancelButton = Widget.Button({
    className: "cancelButton",
    hpack: "fill",
    child: Widget.Label("Cancelar"),
    onClicked: () => cancel(),
  });

  const authButton = Widget.Button({
    className: "authButton",
    hpack: "fill",
    child: Widget.Label("Autenticar"),
    sensitive: false,
    onClicked: () => {
      const text = password.get_text();
      response(text);
    },
  });

  polkitAgent.connect("done", () => close());
  dialog.connect("success", (_, success) => {
    if (!success) {
      error.visible = true;
      error.label = "não funcionou, tente novamente";
      authButton.sensitive = true;

      password.sensitive = true;
      password.text = "";
      password.grab_focus();
    }
  });

  return Widget.Window({
    name: WINDOW_NAME,
    anchor: [],
    layer: "overlay",
    keymode: "exclusive",
    visible: true,
    child: Widget.Box({
      vertical: true,
      homogeneous: false,
      className: "polkit",
      children: [
        title,
        message,
        userImage,
        userName,
        password,
        info,
        error,
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

export default polkit;
