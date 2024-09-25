import Widget from "resource:///com/github/Aylur/ags/widget.js";

import UPowerGlib from "gi://UPowerGlib";
globalThis.upower = UPowerGlib;

const kindToIcon = {
  [UPowerGlib.DeviceKind.UNKNOWN]: "UNKNOWN",
  [UPowerGlib.DeviceKind.LINE_POWER]: "LINE_POWER",
  [UPowerGlib.DeviceKind.TABLET]: "input-tablet",
  [UPowerGlib.DeviceKind.COMPUTER]: "computer",
  [UPowerGlib.DeviceKind.GAMING_INPUT]: "input-gaming",
  [UPowerGlib.DeviceKind.PEN]: "PEN",
  [UPowerGlib.DeviceKind.TOUCHPAD]: "input-touchpad",
  [UPowerGlib.DeviceKind.MODEM]: "modem",
  [UPowerGlib.DeviceKind.NETWORK]: "NETWORK",
  [UPowerGlib.DeviceKind.HEADSET]: "audio-headset",
  [UPowerGlib.DeviceKind.SPEAKERS]: "audio-speakers",
  [UPowerGlib.DeviceKind.HEADPHONES]: "audio-headphones",
  [UPowerGlib.DeviceKind.BATTERY]: "battery",
  [UPowerGlib.DeviceKind.VIDEO]: "video-display",
  [UPowerGlib.DeviceKind.OTHER_AUDIO]: "audio-card",
  [UPowerGlib.DeviceKind.REMOTE_CONTROL]: "REMOTE_CONTROL",
  [UPowerGlib.DeviceKind.PRINTER]: "printer",
  [UPowerGlib.DeviceKind.SCANNER]: "scanner",
  [UPowerGlib.DeviceKind.CAMERA]: "camera-photo",
  [UPowerGlib.DeviceKind.WEARABLE]: "WEARABLE",
  [UPowerGlib.DeviceKind.TOY]: "TOY",
  [UPowerGlib.DeviceKind.BLUETOOTH_GENERIC]: "BLUETOOTH_GENERIC",
  [UPowerGlib.DeviceKind.LAST]: "LAST",
  [UPowerGlib.DeviceKind.UPS]: "UPS",
  [UPowerGlib.DeviceKind.MONITOR]: "monitor",
  [UPowerGlib.DeviceKind.MOUSE]: "input-mouse",
  [UPowerGlib.DeviceKind.KEYBOARD]: "input-keyboard",
  [UPowerGlib.DeviceKind.PDA]: "pda",
  [UPowerGlib.DeviceKind.PHONE]: "phone",
  [UPowerGlib.DeviceKind.MEDIA_PLAYER]: "multimedia-player",
};

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
        icon: kindToIcon[device.kind],
      }),
      Widget.Box({
        vertical: true,
        homogeneous: false,
        hpack: "fill",
        vpack: "fill",
        children: [
          Widget.Label({
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

const deviceList = () => {
  const client = UPowerGlib.Client.new();

  const box = Widget.Box({
    vertical: true,
    homogeneous: false,
    hpack: "fill",
    vpack: "fill",
    className: "upower",
    setup: (self) => {
      const update = () => {
        self.children = client.get_devices().map((d) => deviceItem(d));
      };
      update();
      self.hook(client, update, "device_added");
      self.hook(client, update, "device_removed");
    },
  });

  return box;
};

export default deviceList;
