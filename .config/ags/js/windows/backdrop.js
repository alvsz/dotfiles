import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import GLib from "gi://GLib";
import { Placeholder } from "../notification.js";
import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";
import { lookUpIcon } from "resource:///com/github/Aylur/ags/utils.js";
import icons from "../icons.js";
import App from "resource:///com/github/Aylur/ags/app.js";

const lengthStr = (length) => {
  const min = Math.floor(length / 60);
  const sec = Math.floor(length % 60);
  const sec0 = sec < 10 ? "0" : "";
  return `${min}:${sec0}${sec}`;
};

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

const mpris = (player) => {
  const albumCover = Widget.Box({
    className: "albumArt",
    hpack: "center",
    css: player
      .bind("coverPath")
      .as((path) => `background-image: url("${path}")`),
  });

  const slider = Widget.Slider({
    vertical: false,
    className: "position",
    vpack: "center",
    hexpand: true,

    drawValue: false,
    min: 0,
    max: 1,

    on_change: ({ value }) => (player.position = value * player.length),
    visible: player.bind("length").as((l) => l > 0),

    setup: (self) => {
      const update = () => {
        const value = player.position / player.length;
        self.value = value > 0 ? value : 0;
      };

      self.hook(player, update);
      self.hook(player, update, "position");
      self.poll(500, update);
    },
  });

  const positionTimer = Widget.Label({
    hpack: "start",
    vpack: "end",
    className: "positionTimer",
    visible: player.bind("length").as((l) => l > 0),

    setup: (self) => {
      const update = (_, time) => {
        self.label = lengthStr(time || player.position);
        self.visible = player.length > 0;
      };

      self.hook(player, update);
      self.hook(player, update, "position");
      self.poll(500, update);
    },
  });

  const lengthTimer = Widget.Label({
    hpack: "end",
    vpack: "end",
    className: "lengthTimer",
    visible: player.bind("length").transform((l) => l > 0),
    label: player.bind("length").transform(lengthStr),
  });

  const playPause = Widget.Button({
    class_name: "play-pause",
    on_clicked: () => player.playPause(),
    visible: player.bind("can_play"),
    child: Widget.Icon({
      icon: player.bind("play_back_status").transform((s) => {
        switch (s) {
          case "Playing":
            return icons.mpris.pause;
          case "Paused":
          case "Stopped":
            return icons.mpris.play;
        }
      }),
    }),
  });

  const prev = Widget.Button({
    on_clicked: () => player.previous(),
    visible: player.bind("can_go_prev"),
    child: Widget.Icon(icons.mpris.prev),
  });

  const next = Widget.Button({
    on_clicked: () => player.next(),
    visible: player.bind("can_go_next"),
    child: Widget.Icon(icons.mpris.next),
  });

  const trackTitle = Widget.Label({
    label: player.bind("trackTitle"),
    className: "trackTitle",
    hexpand: true,
    justification: "center",
    truncate: "middle",
    hpack: "center",
  });

  const artists = Widget.Label({
    label: player.bind("track_artists").transform((a) => a.join(", ")),
    className: "artists",
    hexpand: true,
    // hpack: "center",
    justification: "center",
    truncate: "middle",
    hpack: "center",
    visible: player.bind("track_artists").transform((a) => a != ""),
  });

  return Widget.Box({
    vertical: true,
    homogeneous: false,
    hexpand: true,
    hpack: "center",
    className: "mediaPlayer",
    children: [
      albumCover,

      trackTitle,
      artists,
      slider,
      Widget.Box({
        vertical: false,
        homogeneous: false,
        hpack: "fill",
        vpack: "end",
        children: [
          positionTimer,

          Widget.Box({
            homogeneous: true,
            vertical: false,
            hexpand: true,
            hpack: "center",
            vpack: "center",
            children: [prev, playPause, next],
          }),

          lengthTimer,
        ],
      }),
    ],
  });
};

const player = () => {
  const update = (self) => {
    if (Mpris.players.length > 0) {
      self.visible = true;
      self.children = [mpris(Mpris.players[0])];
    } else {
      self.visible = false;
      self.children = [];
    }
  };

  return Widget.Box({
    hpack: "center",
    vpack: "center",
  })
    .hook(
      Mpris,
      (self) => {
        update(self);
      },
      "player-closed",
    )
    .hook(
      Mpris,
      ((self) => {
        update(self);
      },
      "player-added"),
    );
};

const NotificationIcon = ({ appEntry, appIcon, image }) => {
  let icon = "dialog-information-symbolic";

  if (image) {
    icon = image;
  } else if (lookUpIcon(appIcon)) {
    icon = appIcon;
  } else if (lookUpIcon(appEntry)) {
    icon = appEntry;
  }

  return Widget.Icon({
    icon,
    hpack: "start",
    vpack: "center",
    vexpand: true,
    className: "appIcon",
  });
};

const Notification = (n) => {
  const summary = Widget.Label({
    className: "title",
    vpack: "fill",
    hpack: "start",
    hexpand: true,

    justification: "left",
    truncate: "end",
    wrap: false,
    useMarkup: true,
    label: n.summary.replaceAll("&", "&amp;"),
  });

  const time = Widget.Label({
    label: GLib.DateTime.new_from_unix_local(n.time).format("%H:%M"),
    className: "time",
    vpack: "center",
    justification: "right",
    hpack: "end",
  });

  return Widget.Box({
    className: `notification ${n.urgency}`,
    vertical: false,
    homogeneous: false,
    hexpand: true,
    attribute: { id: n.id },
    // hpack: "fill",
    // vpack: "fill",

    children: [NotificationIcon(n), summary, time],
  });
};

const notificationList = () =>
  Widget.Box({
    vertical: true,
    // homogeneous: true,
    hpack: "center",
    vpack: "start",
    className: "notificationList",
    vexpand: true,
    visible: true,
  }).hook(Notifications, (self) => {
    self.children = Notifications.notifications.reverse().map(Notification);

    if (self.children.length > 0) {
      self.children[0].toggleClassName("first", true);
    } else self.children = [Placeholder()];
  });

const Backdrop = ({ monitor } = {}) => {
  const WINDOW_NAME = `backdrop-${monitor}`;
  return Widget.Window({
    name: WINDOW_NAME,
    monitor: monitor,
    layer: "background",
    exclusivity: "ignore",
    visible: true,
    anchor: ["top"],
    // anchor: ["top", "bottom", "left", "right"],
    child: Widget.Box({
      className: "backdrop",
      hpack: "center",
      vpack: "center",
      hexpand: true,
      vexpand: true,
      vertical: true,
      homogeneous: false,
      css: `min-width: 1920px; min-height: 1080px`,

      children: [
        date(),
        clock(),
        Widget.Scrollable({
          className: "scroll",
          hpack: "center",
          // vpack: "end",
          vexpand: true,
          hexpand: true,
          hscroll: "never",
          vscroll: "automatic",

          vscrollbar_policy: 3,

          child: Widget.Box({
            vertical: true,
            vexpand: true,
            children: [
              // albumArt(),
              player(),
              notificationList(),
              //
            ],
          }),
        }),

        Widget.Button({
          onClicked: () => {
            const window = App.getWindow(WINDOW_NAME);

            // const window = self.get_parent_window();

            App.closeWindow(WINDOW_NAME);
            App.removeWindow(window);
          },
          child: Widget.Label("destruir"),
        }),

        Widget.Label({
          label: "Desbloquear",
          vpack: "end",
        }),

        // notificationList(),
        // playerInfo()
      ],
    }),
  });
};
export default Backdrop;
