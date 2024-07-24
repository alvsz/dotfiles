import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import GLib from "gi://GLib";
import { Placeholder } from "../notification.js";
import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";
import Notification from "../widgets/Notification.js";

// import Spacer from "../misc/Spacer.js";
// import icons from "../icons.js";

const clock = () =>
  Widget.Label({
    className: "time",
  }).poll(30000, (self) => {
    const time = GLib.DateTime.new_from_unix_local(Date.now() / 1000);
    self.label = time.format("%R");
  });

const date = () =>
  Widget.Label({
    className: "date",
    // hpack: "center",
  }).poll(600000, (self) => {
    const time = GLib.DateTime.new_from_unix_local(Date.now() / 1000);
    self.label = time.format("%A, %d de %B");
  });

const albumArt = () =>
  Widget.Box({
    className: "albumArt",
    hpack: "center",
  }).hook(Mpris, (self) => {
    const temp = Mpris.getPlayer("");

    if (temp && temp.coverPath) {
      self.css = `background-image: url("${temp.coverPath}")`;
      self.visible = true;
    } else {
      self.visible = false;
    }
  });

const playerTime = () =>
  Widget.CenterBox({
    vertical: false,
    homogeneous: false,
    // hpack: "center",
    hexpand: true,
    className: "playerTime",

    // startWidget: length(),
    //
    // centerWidget: progressBar(),
    //
    // endWidget: position(),
  });

const playerInfo = () =>
  Widget.Box({
    vertical: true,
    homogeneous: false,
    className: "playerBox",
    hpack: "center",
    children: [
      // playerTitle(),
      // playerArtists(),
      playerTime(),
      // playerControls()
    ],
  }).hook(Mpris, (self) => {
    const temp = Mpris.getPlayer("");

    if (temp) {
      self.visible = true;
    } else {
      self.visible = false;
    }
  });

const notificationList = () =>
  Widget.Box({
    vertical: true,
    // homogeneous: true,
    // hpack: "fill",
    // vpack: "fill",
    // vexpand: true,
  }).hook(Notifications, (self) => {
    self.children = Notifications.notifications.reverse().map(Notification);

    if (self.children.length > 0) {
      self.children[0].toggleClassName("first", true);
    } else self.children = [Placeholder()];
  });

const notifs = () =>
  Widget.Scrollable({
    className: "scroll",
    hscroll: "never",
    vscroll: "automatic",
    child: Widget.Box({
      vertical: true,
      homogeneous: false,
      children: [albumArt(), playerInfo(), notificationList()],
    }),
  });

const Backdrop = ({ monitor } = {}) =>
  Widget.Window({
    name: `backdrop-${monitor}`,
    monitor: monitor,
    layer: "background",
    exclusivity: "ignore",
    visible: true,
    anchor: [],
    child: Widget.Box({
      className: "backdrop",
      vertical: true,
      homogeneous: false,
      children: [
        date(),
        clock(),

        // Spacer("spacer1"),
      ],
    }),
  });

export default Backdrop;
