import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Bluetooth from "resource:///com/github/Aylur/ags/service/bluetooth.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";

const devButton = (dev) =>
  Widget.Button({
    className: "deviceButton",
    onClicked: () => {
      if (!dev.trusted && !dev.connected)
        Utils.execAsync(`bluetoothctl pair "${dev.address}"`).catch((err) =>
          Utils.notify(
            "Erro ao parear",
            err.toString(),
            "network-error-symbolic",
          ),
        );

      dev.setConnection(!dev.connected);
    },

    child: Widget.Box({
      vertical: false,
      homogeneous: false,
      spacing: 0,
      children: [
        Widget.Icon({
          className: "icon",
          icon: Utils.lookUpIcon(dev.iconName)
            ? dev.iconName
            : "bluetooth-active",
        }),

        Widget.Label({
          justification: "left",
          hpack: "start",
          wrap: false,
          truncate: "end",
          hexpand: true,
          label: dev.alias,
        }),

        dev.connected && dev._device.battery_type != 0
          ? Widget.Icon({
              icon: `battery-level-${Math.floor(dev.battery_percentage / 10) * 10}-symbolic`,
              className: "battery",
            })
          : null,

        dev.connected ? Widget.Icon("object-select-symbolic") : null,
      ],
    }),
  });

const bluetoothInfo = () => {
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
          if (Bluetooth.enabled)
            Bluetooth._client.default_adapter_setup_mode = false;
          const stack = self.parent.parent.parent;
          stack.shown = "userCenter";
        },
      }),

      Widget.Label({
        label: "Bluetooth",
        hexpand: true,
        hpack: "center",
        className: "title",
      }),

      Widget.Switch({
        hpack: "end",
        vpack: "center",
        active: Bluetooth.bind("enabled"),
        onActivate: ({ active }) => (Bluetooth.enabled = active),
      }),
    ],
  });

  const body = Widget.Box({
    vertical: true,
    homogeneous: false,
    vexpand: true,
    className: "bluetoothPopup",

    children: [
      header,

      Widget.Box({
        vertical: true,
        className: "deviceList",

        children: [
          Widget.Box({
            vertical: true,
            className: "known",

            children: [
              Widget.Box({
                vertical: false,
                children: [
                  Widget.Label({
                    label: "Meus dispositivos",
                    className: "title",
                    vpack: "center",
                    hpack: "start",
                  }),
                ],
              }),

              Widget.Separator({ vertical: true }),

              Widget.Box({
                vertical: true,
                homogeneous: true,
              }).hook(Bluetooth, (self) => {
                const children = Bluetooth.devices
                  .filter((dev) => dev.paired)
                  .sort((a, b) => {
                    if (a.connected === b.connected) {
                      return 0;
                    } else if (a.connected) {
                      return -1;
                    } else {
                      return 1;
                    }
                  })
                  .map(devButton);

                if (children.length < 1) self.children = [];
                else self.children = children;
              }),
            ],
          }),

          Widget.Box({
            className: "unknown",
            vertical: true,
            children: [
              Widget.Box({
                vertical: false,
                homogeneous: false,

                children: [
                  Widget.Label({
                    label: "Outros dispositivos",
                    className: "title",
                    vpack: "end",
                    hpack: "start",
                    hexpand: true,
                  }),

                  Widget.Button({
                    child: Widget.Stack({
                      transition: "slide_down",

                      children: {
                        refresh: Widget.Icon("view-refresh"),
                        spinner: Widget.Spinner(),
                      },
                    }).hook(
                      Bluetooth._client,
                      (self) => {
                        self.shown = Bluetooth._client
                          .default_adapter_setup_mode
                          ? "spinner"
                          : "refresh";
                      },
                      "notify::default-adapter-setup-mode",
                    ),

                    onClicked: () => {
                      if (Bluetooth.enabled) {
                        Bluetooth._client.default_adapter_setup_mode = true;

                        Utils.timeout(30000, () => {
                          Bluetooth._client.default_adapter_setup_mode = false;
                        });
                      }
                    },
                  }),
                ],
              }),
              Widget.Separator({ vertical: true }),

              Widget.Box({
                vertical: true,
                homogeneous: true,
              }).hook(Bluetooth, (self) => {
                const children = Bluetooth.devices
                  .filter((dev) => !dev.paired)
                  .map(devButton);

                if (children.length < 1) self.children = [];
                else self.children = children.slice(0, 8);
              }),
            ],
          }),
        ],
      }),
    ],
  });

  return body;
};

export default bluetoothInfo;
