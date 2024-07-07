import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import Battery from "resource:///com/github/Aylur/ags/service/battery.js";
import SystemTray from "resource:///com/github/Aylur/ags/service/systemtray.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Network from "resource:///com/github/Aylur/ags/service/network.js";
import Audio from "resource:///com/github/Aylur/ags/service/audio.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";

import GLib from "gi://GLib";
import Gtk from "gi://Gtk";

import Weather from "../services/weather.js";

import revealOnClick from "../misc/revealOnClick.js";
import audioIcon from "../misc/audioIcon.js";
import networkIndicator from "../misc/networkIcon.js";
import bluetoothIcon from "../misc/bluetoothIcon.js";

import * as User from "../misc/User.js";

globalThis.gtk = Gtk;
globalThis.glib = GLib;
globalThis.user = User;
globalThis.audio = Audio;
globalThis.battery = Battery;
globalThis.notification = Notifications;
globalThis.network = Network;
globalThis.mpris = Mpris;
globalThis.weather = Weather;
globalThis.utils = Utils;

import { dwlIpc } from "../vars.js";

const Workspace = ({
  onPrimaryClick,
  onSecondaryClick,
  onMiddleClick,
  urgent,
  selected,
  occupied,
} = {}) =>
  Widget.Button({
    child: Widget.Label(urgent ? "" : selected ? "" : occupied ? "" : ""),
    onPrimaryClick: onPrimaryClick,
    onSecondaryClick: onSecondaryClick,
    onMiddleClick: onMiddleClick,
    vpack: "fill",
    className: urgent
      ? "urgent"
      : selected
        ? "selected"
        : occupied
          ? "occupied"
          : "normal",
  });

const genTags = (monitorId) => {
  let Tags = [];
  const mon = dwlIpc.value[monitorId];

  for (const tag of mon.tags) {
    let test = Workspace({
      urgent: tag.state == 2,
      selected: tag.state == 1,
      occupied: tag.clients > 0,
      onMiddleClick: () => {},
      onPrimaryClick: () => {},
      onSecondaryClick: () => {},
    });
    Tags.push(test);
  }
  return Tags;
};

const dwlTags = (monitorId) =>
  Widget.Box({
    vertical: false,
    spacing: 5,
    homogeneous: false,
    className: "dwlTags",
  }).hook(dwlIpc, (self) => {
    self.children = genTags(monitorId);
  });

const clientTitle = (monitorId) =>
  Widget.Label({
    className: "clientTitle",
    maxWidthChars: 45,
    hpack: "start",
  }).hook(dwlIpc, (self) => {
    const mon = dwlIpc.value[monitorId];

    const limitWidth = 45;

    const title =
      mon.title != "" ? mon.title : mon.appid != "" ? mon.appid : "";

    if (title.length > limitWidth) {
      self.label = title.substring(0, limitWidth - 3) + "...";
    } else {
      self.label = title;
    }

    // self.label = title;
  });

const clientIcon = (monitorId) =>
  Widget.Icon({
    className: "clientIcon",
    vpack: "fill",
  }).hook(dwlIpc, (self) => {
    const mon = dwlIpc.value[monitorId];

    self.icon = mon.appid;
  });

const client = (monitorId) =>
  Widget.Box({
    // spacing: 5,
    homogeneous: false,
    className: "client",
    children: [clientIcon(monitorId), clientTitle(monitorId)],
  }).hook(dwlIpc, (self) => {
    const mon = dwlIpc.value[monitorId];

    self.visible = mon.appid != "" || mon.title != "";
    self.tooltipText = `${mon.appid} - ${mon.title}`;
  });

const layoutIcon = (monitorId) =>
  Widget.Button({
    hpack: "start",
    vpack: "fill",
    className: "layoutIcon",
    child: Widget.Label(),
  }).hook(dwlIpc, (self) => {
    const mon = dwlIpc.value[monitorId];

    self.label = mon.layout.new.symbol;
  });

const dwl = (monitorId) =>
  Widget.Box({
    // spacing: 8,
    hpack: "start",
    vpack: "fill",
    // vexpand: true,
    className: "dwl",
    children: [dwlTags(monitorId), layoutIcon(monitorId), client(monitorId)],
    setup: (self) => {
      self.children.length > 0 &&
        self.children[0].toggleClassName("firstH", true);
    },
  });

const archDash = () =>
  Widget.Button({
    child: Widget.Label({
      label: "",
      className: "archDash",
    }),
    hpack: "start",
    vpack: "fill",
    onPrimaryClick: () => {
      utils.execAsync(["echo", "Hi Mom"]);
    },
    className: "module",
  });

const Media = () =>
  Widget.Button({
    className: "media",
    onPrimaryClick: () => Mpris.getPlayer("")?.playPause(),
    onScrollUp: () => Mpris.getPlayer("")?.next(),
    onScrollDown: () => Mpris.getPlayer("")?.previous(),
    child: Widget.Label({}).hook(Mpris, (self) => {
      const mpris = Mpris.getPlayer("");

      const limitWidth = 45;

      const title = `${mpris.trackArtists.join(", ")} - ${mpris.trackTitle}`;

      // mpris player can be undefined
      if (mpris) {
        if (title.length > limitWidth) {
          self.label = title.substring(0, limitWidth - 3) + "...";
        } else {
          self.label = title;
        }
      } else {
        self.label = "Nothing is playing";
      }
    }),
  });

const SysTray = () =>
  Widget.Box({
    className: "sysTray",
    vpack: "fill",
  }).hook(SystemTray, (self) => {
    self.children = SystemTray.items.map((item) =>
      Widget.Button({
        child: Widget.Icon({ icon: item.bind("icon") }),
        vpack: "fill",
        className: "trayItem",

        onPrimaryClick: (_, event) => item.activate(event),
        onSecondaryClick: (_, event) => {
          item.menu.toggleClassName("trayMenu", true);
          item.openMenu(event);
        },
        tooltipText: item.bind("tooltip-markup"),
      }),
    );

    self.children.length > 0 &&
      self.children[0].toggleClassName("firstH", true);
  });

const batteryIcon = () =>
  Widget.Icon({
    className: "batteryIcon",
    vpack: "center",
    visible: Battery.bind("available"),
    icon: Battery.bind("iconName"),
  });
//   .hook(Battery, (self) => {
//   self.visible = Battery.available;
//   self.icon = Battery.iconName;
// });

// const batteryLabel = () =>
//   Widget.Label(`${Battery.percent}%`).hook(Battery, (self) => {
//     self.label = `${Battery.percent}%`;
//   });
//
// const batteryBox = () => {
//   return Widget.Box({
//     // spacing: 7,
//     // visible: Battery.bind("available"),
//     children: [batteryIcon(), batteryLabel()],
//   }).hook(Battery, (self) => (self.visible = Battery.available));
// };

const Clock = () =>
  Widget.Label({
    vpack: "center",
  }).poll(30000, (self) => {
    const time = GLib.DateTime.new_from_unix_local(Date.now() / 1000);
    self.label = time.format("%a %d, %R");
  });

const WeatherConditions = () =>
  Widget.Icon({
    vpack: "center",
  }).hook(
    weather,
    (self) => {
      const icon = weather.get_icon_name();
      if (Utils.lookUpIcon(icon)) {
        self.visible = true;
        self.icon = icon;
      } else self.visible = false;
    },
    "notify",
  );

const Left = (monitorId) =>
  Widget.Box({
    hpack: "start",
    vpack: "fill",
    hexpand: true,
    vexpand: true,
    homogeneous: false,
    className: "leftBar",
    children: [archDash(), dwl(monitorId)],
  });

const Center = () =>
  Widget.Box({
    vpack: "fill",
    children: [Media()],
    className: "centerBar",
    setup: (self) => {
      self.children.length > 0 &&
        self.children[0].toggleClassName("firstH", true);
    },
  });

const Right = (monitorId) =>
  Widget.Box({
    hpack: "end",
    vpack: "fill",
    // hexpand: false,
    // spacing: 7,
    className: "rightBar",
    children: [
      revealOnClick({
        shown: Widget.Icon("go-first"),
        hidden: SysTray(),
      }).hook(dwlIpc, (self) => {
        self.visible = dwlIpc.value[monitorId].active;
      }),
      networkIndicator(),
      audioIcon(),
      bluetoothIcon(),
      batteryIcon(),
      // batteryBox(),
      Clock(),
      WeatherConditions(),
    ],

    setup: (self) => {
      self.children.length > 0 &&
        self.children[0].toggleClassName("firstH", true);
    },
  });

const Bar = ({ monitor } = {}) =>
  Widget.Window({
    name: `bar-${monitor}`,
    monitor: monitor,
    layer: "bottom",
    anchor: ["top", "left", "right"],
    exclusivity: "exclusive",
    // exclusive: true,
    className: "barwindow",
    child: Widget.CenterBox({
      startWidget: Left(monitor),
      centerWidget: Center(monitor),
      endWidget: Right(monitor),
    }),
  });

export default Bar;
