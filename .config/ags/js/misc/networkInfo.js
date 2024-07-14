import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Network from "resource:///com/github/Aylur/ags/service/network.js";

import NM from "gi://NM";

const _STRENGTH_ICONS = [
  { value: 80, icon: "network-wireless-signal-excellent-symbolic" },
  { value: 60, icon: "network-wireless-signal-good-symbolic" },
  { value: 40, icon: "network-wireless-signal-ok-symbolic" },
  { value: 20, icon: "network-wireless-signal-weak-symbolic" },
  { value: 0, icon: "network-wireless-signal-none-symbolic" },
];

const get_access_points = () => {
  return Network.wifi._device
    .get_access_points()
    .map((ap) => ({
      bssid: ap.bssid,
      address: ap.hw_address,
      lastSeen: ap.last_seen,
      ssid: ap.ssid
        ? NM.utils_ssid_to_utf8(ap.ssid.get_data() || new Uint8Array())
        : ap.bssid,
      active: ap === Network.wifi._ap,
      rsn: ap.rsn_flags,
      strength: ap.strength,
      frequency: ap.frequency,
      iconName: _STRENGTH_ICONS.find(({ value }) => value <= ap.strength)?.icon,
    }))
    .sort((b, a) => {
      return a.strength - b.strength;
    });
};

const knownSSIDs = () => {
  let knownSSIDs = new Set();
  const connections = Network._client.get_connections();

  for (const connection of connections) {
    const wireless = connection.get_setting_wireless();
    if (wireless) knownSSIDs.add(wireless.get_ssid().get_data());
  }
  return knownSSIDs;
};

const wiredButton = (conn) => {
  const active = Network.primary === "wired";

  return Widget.Button({
    className: "networkButton",

    child: Widget.Box({
      vertical: false,
      homogeneous: false,
      spacing: 0,
      children: [
        Widget.Icon({
          className: "icon",
          icon: conn.iconName,
        }),

        Widget.Label({
          className: "networkType",
          justification: "left",
          hpack: "start",
          wrap: false,
          truncate: "end",
          hexpand: true,
          label: "Rede cabeada",
        }),

        active
          ? Widget.Icon({
              icon: "object-select-symbolic",
            })
          : null,
      ],
    }),
  });
};

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
          hexpand: true,
          label: ap.ssid,
        }),

        ap.active
          ? Widget.Icon({
              icon: "object-select-symbolic",
            })
          : null,
      ],
    }),
  });

const networkList = () => {
  const SSIDs = knownSSIDs();
  let knownNetworks = [];
  let unknownNetworks = [];

  const aps = get_access_points();

  for (const ap of aps) {
    const ssid = ap.ssid;

    if (ssid)
      if (SSIDs.has(ssid)) {
        knownNetworks.push(wifiButton(ap));
      } else {
        unknownNetworks.push(wifiButton(ap));
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

        self.children = [
          Widget.Label({
            label: "Minhas redes",
            className: "title",
            hpack: "start",
          }),
          Widget.Separator({ vertical: true }),
          wiredButton(Network.wired),
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
