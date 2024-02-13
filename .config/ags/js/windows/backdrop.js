import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import GLib from "gi://GLib";

import Spacer from "../misc/Spacer.js";
import icons from "../icons.js";

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
  })
    .hook(Mpris, (self) => {
      const temp = Mpris.getPlayer("");

      if (temp && temp.coverPath) {
        self.css = `background-image: url("${temp.coverPath}")`;
        self.visible = true;
      } else {
        self.visible = false;
      }
    })
    .on("draw", (album, _) => {
      const height = album.get_allocated_height();
      album.set_size_request(height, height);
    });

const playerTitle = () =>
  Widget.Label({ className: "title" }).hook(Mpris, (self) => {
    const temp = Mpris.getPlayer("");

    if (temp && temp.trackTitle) {
      self.label = temp.trackTitle;
      self.visible = true;
    } else {
      self.visible = false;
    }
  });

const playerArtists = () =>
  Widget.Label({ className: "artists" }).hook(Mpris, (self) => {
    const temp = Mpris.getPlayer("");

    if (temp && temp.trackArtists) {
      self.label = temp.trackArtists.join(", ");
      self.visible = true;
    } else {
      self.visible = false;
    }
  });

const position = () =>
  Widget.Label({
    className: "position",
    hpack: "end",
    justification: "right",
  }).hook(Mpris, (self) => {
    const temp = Mpris.getPlayer("");

    if (temp && temp.position) {
      self.label = temp.position.toString();
      self.visible = true;
    } else {
      self.visible = false;
    }
  });

const progressBar = () =>
  Widget.ProgressBar({
    vertical: false,
    hpack: "center",
    vpack: "center",
    className: "progress",
  }).hook(Mpris, (self) => {
    const temp = Mpris.getPlayer("");

    if (temp && temp.length && temp.position) {
      self.value = temp.position / temp.length;
      self.visible = true;
    } else {
      self.visible = false;
    }
  });

const length = () =>
  Widget.Label({
    className: "length",
    hpack: "start",
    justification: "left",
  }).hook(Mpris, (self) => {
    const temp = Mpris.getPlayer("");

    if (temp && temp.length) {
      self.label = temp.length.toString();
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

    startWidget: length(),

    centerWidget: progressBar(),

    endWidget: position(),
  });

const playerControls = () =>
  Widget.Box({
    vertical: false,
    homogeneous: true,
    className: "controls",
    children: [
      Widget.Button({
        hpack: "center",
        child: Widget.Icon(icons.mpris.shuffle),
      }),
      Widget.Button({
        hpack: "center",
        child: Widget.Icon(icons.mpris.prev),
      }),
      Widget.Button({
        hpack: "center",
        child: Widget.Icon(icons.mpris.playing),
      }),
      Widget.Button({
        hpack: "center",
        child: Widget.Icon(icons.mpris.next),
      }),
      Widget.Button({
        hpack: "center",
        child: Widget.Icon(icons.mpris.loop.track),
      }),
    ],
  });

const playerInfo = () =>
  Widget.Box({
    vertical: true,
    homogeneous: false,
    className: "playerBox",
    hpack: "center",
    children: [playerTitle(), playerArtists(), playerTime(), playerControls()],
  }).hook(Mpris, (self) => {
    const temp = Mpris.getPlayer("");

    if (temp) {
      self.visible = true;
    } else {
      self.visible = false;
    }
  });

const Backdrop = ({ monitor } = {}) =>
  Widget.Window({
    name: `backdrop-${monitor}`,
    monitor: monitor,
    layer: "background",
    exclusivity: "ignore",
    visible: false,
    anchor: ["top", "left", "right", "bottom"],
    child: Widget.Box({
      className: "backdrop",
      vertical: true,
      homogeneous: false,
      children: [
        // clock(),
        date(),
        clock(),
        Spacer("spacer1"),
        albumArt(),
        Spacer("spacer1"),
        playerInfo(),
      ],
    }),
  });

export default Backdrop;
