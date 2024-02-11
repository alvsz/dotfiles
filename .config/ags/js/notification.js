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

  return Widget.Box({
    vpack: "start",
    hexpand: false,
    className: "icon",
    // style: `
    //         min-width: 78px;
    //         min-height: 78px;
    //     `,
    children: [
      Widget.Icon({
        icon,
        // size: 58,
        hpack: "center",
        hexpand: true,
        vpack: "center",
        vexpand: true,
        className: "appIcon",
      }),
    ],
  });
};

export const Notification = (n) =>
  Widget.EventBox({
    className: `notification ${n.urgency}`,
    // hpack: "center",
    onPrimaryClick: () => n.dismiss(),
    attribute: [["hovered", false]],

    onHover: (self) => {
      if (self._hovered) {
        return;
      }

      // if there are action buttons and they are hovered
      // EventBox onHoverLost will fire off immediately,
      // so to prevent this we delay it
      timeout(300, () => (self._hovered = true));
    },

    onHoverLost: (self) => {
      if (!self._hovered) {
        return;
      }

      self._hovered = false;
      n.dismiss();
    },

    vexpand: false,
    child: Widget.Box({
      vertical: true,
      className: "test",
      children: [
        Widget.Box({
          children: [
            NotificationIcon(n),
            Widget.Box({
              hexpand: true,
              vertical: true,
              children: [
                Widget.Box({
                  children: [
                    Widget.Label({
                      className: "title",
                      // vpack: "start",
                      xalign: 0,
                      justification: "left",
                      hexpand: true,
                      maxWidthChars: 24,
                      truncate: "end",
                      wrap: true,
                      label: n.summary.replaceAll("&", "&amp;"),
                      useMarkup: true,
                      vpack: "center",
                    }),

                    Widget.Label({
                      label: GLib.DateTime.new_from_unix_local(n.time).format(
                        "%H:%M",
                      ),
                      className: "time",
                      vpack: "center",
                    }),

                    Widget.Button({
                      className: "close-button",
                      vpack: "start",
                      child: Widget.Icon("window-close-symbolic"),
                      onClicked: n.close.bind(n),
                      vpack: "center",
                    }),
                  ],
                  vpack: "start",
                }),

                Widget.Label({
                  className: "description",
                  hexpand: true,
                  vexpand: true,
                  hpack: "start",
                  vpack: "start",
                  useMarkup: true,
                  xalign: 0,
                  justification: "left",
                  label: n.body.replaceAll("&", "&amp;"),
                  wrap: true,
                }),
                // Widget.ProgressBar({
                //   value: n.hints?.value != null
                //     ? n.hints.value.unpack() / 100
                //     : 30,
                //   visible: n.hints?.value != null,
                //   className: "progress",
                // }),
              ],
            }),
          ],
        }),

        Widget.Box({
          className: "actions",
          homogeneous: true,
          children: n.actions.map(({ id, label }) =>
            Widget.Button({
              className: "actionButton",
              onClicked: () => n.invoke(id),
              hexpand: true,
              child: Widget.Label(label),
            })
          ),
          setup: (self) => {
            // self.children = n.actions.map(({ id, label }) =>
            //   Widget.Button({
            //     className: "actionButton",
            //     onClicked: () => n.invoke(id),
            //     hexpand: true,
            //     child: Widget.Label(label),
            //   })
            // );
            self.children.length > 0 &&
              self.children[0].toggleClassName("firstH", true);
          },
        }),
      ],
    }),
  });

export const Placeholder = () =>
  Widget.Box({
    className: "placeholder",
    vertical: true,
    vexpand: true,
    vpack: "center",
    children: [
      Widget.Icon("notifications-disabled-symbolic"),
      Widget.Label("Your inbox is empty"),
    ],
    visible: Notifications.bind("notifications").transform(
      (n) => n.length === 0,
    ),
  });
