import Widget from "resource:///com/github/Aylur/ags/widget.js";
import App from "resource:///com/github/Aylur/ags/app.js";
import Applications from "resource:///com/github/Aylur/ags/service/applications.js";
import Gtk from "gi://Gtk";
// import Separator from "./misc/Separator.js";
import PopupWindow from "./misc/PopupWindow.js";
import icons from "./icons.js";

// import { exec, execAsync } from "resource:///com/github/Aylur/ags/utils.js";
// import GLib from "gi://GLib";

// import test from "./misc/Applications.js";
//
// globalThis.test = test;

globalThis.apps = Applications;

const WINDOW_NAME = "applauncher";

const AppItem = (app) => {
  const icon = app.app.get_icon();
  let iconName = null;

  let iconWidget = (iconName) =>
    Widget.Icon({
      className: "appIcon",
      icon: iconName,
      halign: "center",
    });

  if (app.iconName == "") {
    if (icon && icon.get_file) {
      iconName = icon.get_file().get_path();
    } else {
      iconName = "nwergojnervojneorj";
    }
  } else {
    iconName = app.iconName;
  }

  return Widget.Button({
    className: "app",
    onClicked: () => {
      App.closeWindow(WINDOW_NAME);
      app.launch();
    },
    child: Widget.Box({
      spacing: 5,
      children: [
        iconWidget(iconName),
        Widget.Box({
          vertical: true,
          children: [
            Widget.Label({
              className: "title",
              label: app.name,
              xalign: 0,
              valign: "center",
              ellipsize: 3,
            }),
            Widget.Label({
              className: "description",
              label: app.description || "",
              wrap: true,
              xalign: 0,
              justification: "left",
              valign: "center",
            }),
          ],
        }),
      ],
    }),
  });
};

// globalThis.appItem = appItem;

const Applauncher = () => {
  const list = Widget.Box({ vertical: true });

  const placeholder = Widget.Label({
    label: " Sem resultados",
    className: "placeholder",
  });

  const entry = Widget.Entry({
    hexpand: true,
    text: "-",
    placeholderText: "Pesquisar",
    onAccept: ({ text }) => {
      const list = Applications.query(text);
      if (list[0]) {
        App.toggleWindow(WINDOW_NAME);
        list[0].launch();
      }
    },
    onChange: ({ text }) => {
      list.children = Applications.query(text)
        .map((app) => [
          // Separator(),
          //
          AppItem(app),
        ])
        .flat();
      // list.add(Separator());
      list.show_all();

      placeholder.visible = list.children.length == 0;
    },
  });

  return Widget.Box({
    className: "appLauncher",
    properties: [["list", list]],
    vertical: true,
    children: [
      Widget.Box({
        className: "header",
        spacing: 5,
        children: [Widget.Icon(icons.apps.search), entry],
      }),
      Widget.Scrollable({
        hscroll: "never",
        className: "scroll",
        vexpand: true,
        child: Widget.Box({
          vertical: true,
          children: [list, placeholder],
        }),
      }),
    ],
    connections: [
      [
        App,
        (_, name, visible) => {
          if (name !== WINDOW_NAME) return;

          entry.set_text("");
          if (visible) entry.grab_focus();
        },
      ],
    ],
  });
};

export default () =>
  PopupWindow({
    name: WINDOW_NAME,
    // expand: false,
    content: Applauncher(),
  });
