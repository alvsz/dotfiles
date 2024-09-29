import Widget from "resource:///com/github/Aylur/ags/widget.js";

import UPowerGlib from "gi://UPowerGlib";
globalThis.upowerglib = UPowerGlib;

const client = UPowerGlib.Client.new();
globalThis.upower = client;

import icons from "../icons.js";

const deviceItem = (device) =>
  Widget.Box({
    vertical: false,
    homogeneous: false,
    hpack: "fill",
    vpack: "fill",
    className: "device",
    children: [
      Widget.Icon({
        vpack: "center",
        icon: icons.upower[device.kind],
      }),
      Widget.Box({
        vertical: true,
        homogeneous: false,
        hpack: "fill",
        vpack: "fill",
        children: [
          Widget.Label({
            hpack: "start",
            justification: "left",
            wrap: true,
            label: device.model,
          }),
          Widget.LevelBar({
            vertical: false,
            hexpand: true,

            min_value: 0,
            max_value: 100,
            bar_mode: "continuous",
          }).hook(
            device,
            (self) => {
              self.value = device.percentage;
            },
            "notify::percentage",
          ),
        ],
      }),
    ],
  });

const deviceList = () =>
  Widget.Box({
    vertical: true,
    homogeneous: false,
    hpack: "fill",
    vpack: "fill",
    className: "upower",
    setup: (self) => {
      const update = () => {
        const devices = client.get_devices().map((d) => deviceItem(d));

        if (devices.length < 1) {
          self.children = [];
          self.visible = false;
        } else {
          self.children = devices;
          self.visible = true;
        }
      };
      update();
      self.hook(client, update, "device_added");
      self.hook(client, update, "device_removed");
    },
  });

export default deviceList;
