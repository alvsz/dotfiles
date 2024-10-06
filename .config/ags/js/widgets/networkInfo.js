import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Network from "resource:///com/github/Aylur/ags/service/network.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";

import NM from "gi://NM";
globalThis.nm = NM;

const knownSSIDs = () => {
  let knownSSIDs = new Set();
  const connections = Network._client.get_connections();

  for (const connection of connections) {
    const wireless = connection.get_setting_wireless();
    if (wireless)
      knownSSIDs.add(
        NM.utils_ssid_to_utf8(wireless.ssid.get_data() || new Uint8Array()),
      );
  }
  return knownSSIDs;
};

const wiredButton = (conn) =>
  Widget.Button({
    className: "networkButton",

    child: Widget.Box({
      vertical: false,
      homogeneous: false,
      spacing: 0,
      children: [
        Widget.Icon({
          className: "icon",
          icon: conn.bind("iconName"),
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

        Widget.Icon({
          icon: "object-select-symbolic",
          visible: Network.bind("primary").as((p) => p == "wired"),
        }),
      ],
    }),
  });

const wifiButton = (ap) =>
  Widget.Button({
    className: "networkButton",
    onClicked: () => {
      // if (known) {
      Utils.execAsync(`nmcli dev wifi connect "${ap.ssid}"`).catch((err) =>
        Utils.notify(
          "Erro ao conectar à rede Wi-Fi",
          err.toString(),
          "network-error-symbolic",
        ),
      );
      // }
    },

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
          label: ap._ap.ssid ? ap.ssid : ap.bssid,
        }),

        ap.active
          ? Network.wifi.state == "activated"
            ? Widget.Icon("object-select-symbolic")
            : Widget.Spinner()
          : null,

        ap._ap.rsn_flags > 0 || ap._ap.wpa_flags > 0
          ? Widget.Icon({
              icon: "dialog-password",
              className: "password",
            })
          : null,
      ],
    }),
  });

const networkInfo = () => {
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

        children: [
          Widget.Box({
            vertical: true,
            className: "known",

            children: [
              Widget.Label({
                label: "Minhas redes",
                className: "title",
                vpack: "center",
                hpack: "start",
              }),
              Widget.Separator({ vertical: true }),
              wiredButton(Network.wired),

              Widget.Box({
                vertical: true,
                homogeneous: true,
              }).hook(Network, (self) => {
                const SSIDs = knownSSIDs();

                const children = Network.wifi.access_points
                  .filter((ap) => SSIDs.has(ap.ssid))
                  .sort((b, a) => {
                    return a.strength - b.strength;
                  })
                  .map((ap) => wifiButton(ap));

                if (children.length < 1) self.children = [];
                else self.children = children;
              }),
            ],
          }),

          Widget.Box({
            className: "unknown",
            vertical: true,
            children: [
              Widget.Label({
                label: "Outras redes",
                className: "title",
                vpack: "center",
                hpack: "start",
              }),

              Widget.Separator({
                vertical: true,
              }),

              Widget.Box({
                vertical: true,
                homogeneous: true,
              }).hook(Network, (self) => {
                const SSIDs = knownSSIDs();

                const children = Network.wifi.access_points
                  .filter((ap) => !SSIDs.has(ap.ssid))
                  .sort((b, a) => {
                    return a.strength - b.strength;
                  })
                  .map((ap) => wifiButton(ap));

                if (children.length < 1) {
                  self.children = [];
                  self.parent.visible = false;
                } else {
                  self.children = children.slice(0, 8);
                  self.parent.visible = true;
                }
              }),
            ],
          }),
        ],
      }),
    ],
  });

  return body;
};

export default networkInfo;
