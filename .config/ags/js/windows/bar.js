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
import Gdk from "gi://Gdk";

import DateTime from "../services/datetime.js";
import revealOnClick from "../widgets/revealOnClick.js";
import audioIcon from "../widgets/audioIcon.js";
import networkIndicator from "../widgets/networkIcon.js";
import bluetoothIcon from "../widgets/bluetoothIcon.js";

import icons from "../icons.js";
import * as User from "../misc/User.js";

globalThis.gtk = Gtk;
globalThis.glib = GLib;
globalThis.user = User;
globalThis.audio = Audio;
globalThis.battery = Battery;
globalThis.notification = Notifications;
globalThis.network = Network;
globalThis.mpris = Mpris;
globalThis.tray = SystemTray;
globalThis.utils = Utils;
globalThis.gdk = Gdk;

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

    self.icon = Utils.lookUpIcon(mon.appid) ? mon.appid : icons.apps.fallback;
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
  });

const archDash = () =>
  Widget.Button({
    child: Widget.Label({
      label: "",
    }),
    className: "archDash",
    hpack: "start",
    vpack: "fill",
    onPrimaryClick: () => {
      utils.execAsync(["echo", "Hi Mom"]);
    },
  });

const Media = () =>
  Widget.Button({
    className: "media",

    onPrimaryClick: () => Mpris.getPlayer("")?.playPause(),
    onScrollUp: () => Mpris.getPlayer("")?.next(),
    onScrollDown: () => Mpris.getPlayer("")?.previous(),

    child: Widget.Label({}).hook(Mpris, (self) => {
      const mpris = Mpris.players?.[0];

      const limitWidth = 45;

      if (mpris) {
        const title = `${mpris.trackArtists.join(", ")} - ${mpris.trackTitle}`;

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
  });

const batteryIcon = () =>
  Widget.Icon({
    className: "batteryIcon",
    vpack: "center",
    visible: Battery.bind("available"),
    icon: Battery.bind("iconName"),
  });

const Clock = () =>
  Widget.Label({
    vpack: "center",
  }).hook(
    DateTime,
    (self) => {
      self.label = DateTime.format("%a %d, %R");
    },
    "minute",
  );

const Left = (monitorId) =>
  Widget.Box({
    hpack: "start",
    vpack: "fill",
    hexpand: true,
    vexpand: true,
    homogeneous: false,
    className: "leftBar",
    children: [
      archDash(),
      // dwl(monitorId)
    ],
  });

const Center = () =>
  Widget.Box({
    vpack: "fill",
    children: [Media()],
    className: "centerBar",
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
        shown: Widget.Icon(icons.ui.arrow.left),
        hidden: SysTray(),
      }),
      // .hook(dwlIpc, (self) => {
      //   self.visible = dwlIpc.value[monitorId].active;
      // }),
      networkIndicator(),
      audioIcon({ source: false }),
      bluetoothIcon(),
      batteryIcon(),
      // batteryBox(),
      Clock(),
    ],
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
