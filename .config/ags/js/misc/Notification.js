import GLib from "gi://GLib";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { lookUpIcon, timeout } from "resource:///com/github/Aylur/ags/utils.js";
import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";

const NotificationIcon = ({ appEntry, appIcon, image }) => {
  let icon = "dialog-information-symbolic";

  if (image) {
    icon = image;
  } else if (lookUpIcon(appIcon)) {
    icon = appIcon;
  } else if (lookUpIcon(appEntry)) {
    icon = appEntry;
  }

  return Widget.Icon({
    icon,
    // size: 58,
    hpack: "start",
    vpack: "start",
    vexpand: true,
    className: "appIcon",
  });
};

const Notification = (n, popup) => {
  const summary = Widget.Label({
    className: "title",
    vpack: "fill",
    hpack: "start",
    hexpand: true,

    // xalign: 0,
    justification: "left",
    // maxWidthChars: 24,
    truncate: "end",
    wrap: false,
    useMarkup: true,
    label: n.summary.replaceAll("&", "&amp;"),
  });

  const body = Widget.Label({
    className: "description",
    hexpand: true,
    vexpand: true,
    hpack: "start",
    useMarkup: true,
    // xalign: 0,
    justification: "left",
    truncate: "end",
    wrap: true,
    label: n.body.replaceAll("&", "&amp;"),
  });

  const time = Widget.Label({
    label: GLib.DateTime.new_from_unix_local(n.time).format("%H:%M"),
    className: "time",
    vpack: "center",
    hpack: "end",
  });

  const dismiss = Widget.Button({
    className: "dismiss",
    vpack: "center",
    hpack: "end",

    child: Widget.Icon("window-close-symbolic"),
    onClicked: () => {
      if (n.popup) n.dismiss();
      // else n.close.bind(n);
      else n.close();
    },
  });

  const actions = Widget.Box({
    className: "actions",
    homogeneous: true,
    hexpand: true,
    hpack: "fill",
    vpack: "fill",

    children: n.actions.map(({ id, label }) =>
      Widget.Button({
        className: "actionButton",
        onClicked: () => n.invoke(id),
        hexpand: true,
        child: Widget.Label(label),
      }),
    ),
    setup: (self) => {
      self.children.length > 0 &&
        self.children[0].toggleClassName("firstH", true);
    },
  });

  return Widget.Box({
    className: `notification ${n.urgency}`,
    vertical: true,
    homogeneous: false,
    hexpand: true,
    attribute: { id: n.id },
    // hpack: "fill",
    // vpack: "fill",

    children: [
      Widget.Box({
        vertical: false,
        homogeneous: false,
        hexpand: true,
        // hpack: "fill",
        // vpack: "fill",

        children: [
          NotificationIcon(n),

          Widget.Box({
            vertical: true,
            homogeneous: false,
            hexpand: true,
            // hpack: "fill",
            // vpack: "fill",

            children: [
              Widget.Box({
                vertical: false,
                homogeneous: false,
                hexpand: true,
                // hpack: "fill",
                // vpack: "fill",

                children: [summary, time, dismiss],
              }),

              body,
            ],
          }),
        ],
      }),
      actions,
    ],
  });
};

export default Notification;
