import GLib from "gi://GLib";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { lookUpIcon, timeout } from "resource:///com/github/Aylur/ags/utils.js";

const NotificationIcon = ({ appEntry, appIcon, image }) => {
  if (image) {
    return Widget.Box({
      valign: "start",
      hexpand: false,
      className: "icon img",
      style: `
                background-image: url("${image}");
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
            `,
      // min-width: 78px;
      // min-height: 78px;
    });
  }

  let icon = "dialog-information-symbolic";
  if (lookUpIcon(appIcon)) {
    icon = appIcon;
  }

  if (lookUpIcon(appEntry)) {
    icon = appEntry;
  }

  return Widget.Box({
    valign: "start",
    hexpand: false,
    className: "icon",
    // style: `
    //         min-width: 78px;
    //         min-height: 78px;
    //     `,
    children: [
      Widget.Icon({
        icon,
        size: 58,
        halign: "center",
        hexpand: true,
        valign: "center",
        vexpand: true,
        className: "appIcon",
      }),
    ],
  });
};

export const Notification = (n) =>
  Widget.EventBox({
    className: `notification ${n.urgency}`,
    // halign: "center",
    onPrimaryClick: () => n.dismiss(),
    properties: [["hovered", false]],

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
                      // valign: "start",
                      xalign: 0,
                      justification: "left",
                      hexpand: true,
                      maxWidthChars: 24,
                      truncate: "end",
                      wrap: true,
                      label: n.summary.replaceAll("&", "&amp;"),
                      useMarkup: true,
                    }),

                    Widget.Label({
                      label: GLib.DateTime.new_from_unix_local(n.time).format(
                        "%H:%M",
                      ),
                      className: "time",
                    }),

                    Widget.Button({
                      className: "close-button",
                      valign: "start",
                      child: Widget.Icon("window-close-symbolic"),
                      onClicked: n.close.bind(n),
                    }),
                  ],
                }),

                Widget.Label({
                  className: "description",
                  hexpand: true,
                  vexpand: true,
                  halign: "start",
                  valign: "start",
                  useMarkup: true,
                  xalign: 0,
                  justification: "left",
                  label: n.body.replaceAll("&", "&amp;"),
                  wrap: true,
                }),

                Widget.ProgressBar({
                  value:
                    n.hints?.value != null ? n.hints.value.unpack() / 100 : 30,
                  visible: n.hits?.value == null,
                  className: "progress",
                }),
              ],
            }),
          ],
        }),

        Widget.Box({
          className: "actions",
          children: n.actions.map(({ id, label }) =>
            Widget.Button({
              className: "actionButton",
              onClicked: () => n.invoke(id),
              hexpand: true,
              child: Widget.Label(label),
            }),
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
