import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Network from "resource:///com/github/Aylur/ags/service/network.js";

const wifiButton = (ap) =>
  Widget.Button({
    className: "networkButton",

    child: Widget.Box({
      vertical: false,
      homogeneous: false,
      spacing: 0,
      children: [
        Widget.Icon({
          className: "icon",
          icon: ap.iconName,
        }),

        Widget.Label({
          className: "networkType",
          justification: "left",
          hpack: "start",
          wrap: false,
          truncate: "end",
          label: ap.ssid,
        }),
      ],
    }),
  });

const info = () => {
  const header = Widget.Box({
    vertical: false,
    homogeneous: false,
    className: "header",

    children: [
      Widget.Button({
        child: Widget.Icon({
          className: "goBack",
          icon: "go-previous",
        }),

        onClicked: (self) => {
          const stack = self.parent.parent.parent;
          stack.shown = "userCenter";
        },
      }),

      Widget.Label({
        label: "Internet",
        hexpand: true,
        hpack: "center",
        className: "title",
      }),

      Widget.Switch({
        hpack: "end",
        vpack: "center",
        active: Network.wifi.bind("enabled"),
        onActivate: ({ active }) => (Network.wifi.enabled = active),
      }),
    ],
  });

  const body = Widget.Box({
    vertical: true,
    homogeneous: false,
    vexpand: true,
    className: "networkPopup",

    children: [
      header,

      Widget.Box({
        vertical: true,
        className: "wifiList",
      }).hook(Network.wifi, (self) => {
        self.children = Network.wifi.access_points.map(wifiButton);

        if (self.children.length > 0)
          self.children[0].toggleClassName("first", true);
      }),
    ],
  });

  return body;
};

export default info;
