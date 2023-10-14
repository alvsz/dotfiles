import Notifications from 'resource:///com/github/Aylur/ags/service/notifications.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import Audio from 'resource:///com/github/Aylur/ags/service/audio.js';
import Battery from 'resource:///com/github/Aylur/ags/service/battery.js';
import SystemTray from 'resource:///com/github/Aylur/ags/service/systemtray.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import { exec, execAsync } from 'resource:///com/github/Aylur/ags/utils.js';

import * as vars from './vars.js'

const Workspace = ({ onPrimaryClick, onSecondaryClick, onMiddleClick, urgent, selected, occupied } = {}) => Widget.Button({
  child: Widget.Label(
    urgent && "" || selected && "" || occupied && "" || ""
  ),
  onPrimaryClick: onPrimaryClick,
  onSecondaryClick: onSecondaryClick,
  onMiddleClick: onMiddleClick,
  style: "font: 13pt siji",
  valign: "center",
  className: urgent && "urgent" || selected && "selected" || occupied && "occupied" || "normal",
})

const dwlTags = () => Widget.Box({
  vertical: false,
  spacing: 15,
  className: "module",
  homogeneous: true,
  connections: [
    [vars.dwlIpc, self => {
      let Tags = []
      const mon = vars.focusedMon()

      for (const tag of mon.tags) {
        let test = Workspace({
          urgent: (tag.state == 2),
          selected: (tag.state == 1),
          occupied: (tag.clients > 0)
        })
        Tags.push(test)
      }

      self.children = Tags
    }]
  ]
})

const clientTitle = () => Widget.Label({
  className: 'client-title',
  connections: [
    [vars.dwlIpc, self => {
      const mon = vars.focusedMon()
      const limitWidth = 45

      if (mon.title.length > limitWidth) {
        self.label = (mon.title.substring(0, (limitWidth - 3)) + '...')
      }
      else {
        self.label = mon.title
        self.visible = (self.label != "")
      }
    }],
  ]
});

const clientIcon = () => Widget.Icon({
  size: 20,
  connections: [
    [vars.dwlIpc, self => {
      const mon = vars.focusedMon()

      self.icon = mon.appid
      self.visible = (mon.appid != "" && mon.title != "")
    }],
  ]
})

const client = () => Widget.Box({
  spacing: 5,
  homogeneous: false,
  children: [
    clientIcon(),
    clientTitle(),
  ],
  connections: [
    [vars.dwlIpc, self => {
      const mon = vars.focusedMon()

      self.visible = (mon.appid != "" && mon.title != "")
    }]
  ]
})

const layoutIcon = () => Widget.Button({
  halign: "start",
  child: Widget.Label({
    style: "font: 13pt siji",
    connections: [
      [vars.dwlIpc, self => {
        const mon = vars.focusedMon()

        self.label = mon.layout.new.symbol
      }]
    ]
  })
})

const dwl = () => Widget.Box({
  spacing: 8,
  halign: "start",
  valign: "fill",
  vexpand: true,
  className: "module",
  style: "padding: 0px 5px 0px 5px;",
  children: [
    dwlTags(),
    layoutIcon(),
    client(),
  ]
})

const Clock = () => Widget.Label({
  className: 'clock',
  connections: [
    // this is bad practice, since exec() will block the main event loop
    // in the case of a simple date its not really a problem
    [1000, self => self.label = exec('date "+%H:%M:%S %b %e."')],

    // this is what you should do
    [1000, self => execAsync(['date', '+%H:%M:%S %b %e.'])
      .then(date => self.label = date).catch(console.error)],
  ],
});

// we don't need dunst or any other notification daemon
// because the Notifications module is a notification daemon itself
const Notification = () => Widget.Box({
  className: 'notification',
  children: [
    Widget.Icon({
      icon: 'preferences-system-notifications-symbolic',
      connections: [
        [Notifications, self => self.visible = Notifications.popups.length > 0],
      ],
    }),
    Widget.Label({
      connections: [[Notifications, self => {
        self.label = Notifications.popups[0]?.summary || '';
      }]],
    }),
  ],
});

const Media = () => Widget.Button({
  className: 'media',
  onPrimaryClick: () => Mpris.getPlayer('')?.playPause(),
  onScrollUp: () => Mpris.getPlayer('')?.next(),
  onScrollDown: () => Mpris.getPlayer('')?.previous(),
  child: Widget.Label({
    connections: [[Mpris, self => {
      const mpris = Mpris.getPlayer('');
      // mpris player can be undefined
      if (mpris)
        self.label = `${mpris.trackArtists.join(', ')} - ${mpris.trackTitle}`;
      else
        self.label = 'Nothing is playing';
    }]],
  }),
});

const Volume = () => Widget.Box({
  className: 'volume',
  style: 'min-width: 180px',
  children: [
    Widget.Stack({
      items: [
        // tuples of [string, Widget]
        ['101', Widget.Icon('audio-volume-overamplified-symbolic')],
        ['67', Widget.Icon('audio-volume-high-symbolic')],
        ['34', Widget.Icon('audio-volume-medium-symbolic')],
        ['1', Widget.Icon('audio-volume-low-symbolic')],
        ['0', Widget.Icon('audio-volume-muted-symbolic')],
      ],
      connections: [[Audio, self => {
        if (!Audio.speaker)
          return;

        if (Audio.speaker.isMuted) {
          self.shown = '0';
          return;
        }

        const show = [101, 67, 34, 1, 0].find(
          threshold => threshold <= Audio.speaker.volume * 100);

        self.shown = `${show}`;
      }, 'speaker-changed']],
    }),
    Widget.Slider({
      hexpand: true,
      drawValue: false,
      onChange: ({ value }) => Audio.speaker.volume = value,
      connections: [[Audio, self => {
        self.value = Audio.speaker?.volume || 0;
      }, 'speaker-changed']],
    }),
  ],
});

const BatteryLabel = () => Widget.Box({
  className: 'battery',
  children: [
    Widget.Icon({
      connections: [[Battery, self => {
        self.icon = `battery-level-${Math.floor(Battery.percent / 10) * 10}-symbolic`;
      }]],
    }),
    Widget.ProgressBar({
      valign: 'center',
      connections: [[Battery, self => {
        if (Battery.percent < 0)
          return;

        self.fraction = Battery.percent / 100;
      }]],
    }),
  ],
});

const SysTray = () => Widget.Box({
  connections: [[SystemTray, self => {
    self.children = SystemTray.items.map(item => Widget.Button({
      child: Widget.Icon({ binds: [['icon', item, 'icon']] }),
      onPrimaryClick: (_, event) => item.activate(event),
      onSecondaryClick: (_, event) => item.openMenu(event),
      binds: [['tooltip-markup', item, 'tooltip-markup']],
    }));
  }]],
});

const archDash = () => Widget.Button({
  child: Widget.Label({
    label: "",
    style: "color: #1793d1; font: 12pt Symbols Nerd Font; margin: 0px 14px 0px 14px;",
  }),
  halign: "start",
  valign: "fill",
  onPrimaryClick: () => { },
  className: "module"
})

const Left = () => Widget.Box({
  spacing: 10,
  halign: "start",
  valign: "fill",
  hexpand: true,
  vexpand: true,
  homogeneous: false,
  style: "margin: 3px 0px 0px 10px; min-height: 30px",
  children: [
    archDash(),
    dwl(),
    SysTray(),
  ],
});

const Center = () => Widget.Box({
  children: [
    Media(),
    Notification(),
  ],
});

const Right = () => Widget.Box({
  halign: 'end',
  className: 'module',
  style: "margin: 3px 10px 0px 0px; min-height: 30px",
  children: [
    SysTray(),
    Clock(),
  ],
});

const Bar = ({ name, monitor } = {}) => Widget.Window({
  name: `${name}`,
  className: 'bar',
  monitor,
  layer: "bottom",
  anchor: ['top', 'left', 'right'],
  exclusive: true,
  className: "barwindow",
  child: Widget.CenterBox({
    startWidget: Left(),
    centerWidget: Center(),
    endWidget: Right(),
  }),
})

export default Bar
