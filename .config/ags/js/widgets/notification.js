import GLib from "gi://GLib";
import Widget from "resource:///com/github/Aylur/ags/widget.js";

import NotificationIcon from "./notificationIcon.js";

const notification = (n) => {
  const summary = Widget.Label({
    className: "title",
    vpack: "fill",
    hpack: "start",
    hexpand: true,

    justification: "left",
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
    justification: "fill",
    // truncate: "end",
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
        hpack: "fill",
        vpack: "fill",
        className: "actionButton",
        onClicked: () => n.invoke(id),
        hexpand: true,
        child: Widget.Label({
          justification: "center",
          hpack: "center",
          label: label,
          wrap: true,
          // truncate: "middle",
        }),
      }),
    ),
  });

  return Widget.Box({
    className: `notification ${n.urgency}`,
    vertical: true,
    homogeneous: false,
    hexpand: true,
    // attribute: { id: n.id },
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

export default notification;
