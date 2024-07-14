import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Network from "resource:///com/github/Aylur/ags/service/network.js";

const knownSSIDs = () => {
  let knownSSIDs = new Set();
  const connections = Network._client.get_connections();

  for (const connection of connections) {
    const wireless = connection.get_setting_wireless();
    if (wireless) knownSSIDs.add(wireless.get_ssid().get_data().toString());
  }
  return knownSSIDs;
};

const wifiButton = (ap, wireless) =>
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
          label: wireless
            ? ap.get_ssid()
              ? ap.get_ssid().get_data().toString()
              : "Unknown"
            : "Rede cabeada",
        }),
      ],
    }),
  });

const networkList = () => {
  const SSIDs = knownSSIDs();
  let knownNetworks = [];
  let unknownNetworks = [];

  const aps = Network.wifi._device.get_access_points();
  // print(aps);

  for (const ap of aps) {
    // print(ap.get_rsn_flags());
    // print(ap.get_ssid().get_value());
    const ssid = ap.get_ssid()?.get_data().toString();
    // print(ssid);

    if (ssid)
      if (SSIDs.has(ssid)) {
        knownNetworks.push(wifiButton(ap, true));
        // print(`${ssid} é conhecido`);
        // print(knownNetworks);
      } else {
        unknownNetworks.push(wifiButton(ap, true));
        // print(`${ssid} não é conhecido`);
        // print(unknownNetworks);
      }
  }

  return [knownNetworks, unknownNetworks];
};

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
        const [knownNetworks, unknownNetworks] = networkList();
        // print(knownNetworks);
        // print(unkownNetworks);

        self.children = [
          Widget.Label({
            label: "Minhas redes",
            className: "title",
            hpack: "start",
          }),
          Widget.Separator({ vertical: true }),
          wifiButton(Network.wired, false),
          knownNetworks,

          Widget.Label({
            label: "Outras redes",
            className: "title",
            hpack: "start",
            visible: unknownNetworks.length > 0,
          }),
          Widget.Separator({
            vertical: true,
            visible: unknownNetworks.length > 0,
          }),
          unknownNetworks,
        ].flat(1);

        if (self.children.length > 0)
          self.children[0].toggleClassName("first", true);
      }),
    ],
  });

  return body;
};

export default info;
