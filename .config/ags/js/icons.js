export default {
  settings: "emblem-system-symbolic",
  tick: "object-select-symbolic",
  lock: "system-lock-screen-symbolic",
  audio: {
    mic: {
      muted: "microphone-disabled-symbolic",
      low: "microphone-sensitivity-low-symbolic",
      medium: "microphone-sensitivity-medium-symbolic",
      high: "microphone-sensitivity-high-symbolic",
    },
    volume: {
      muted: "audio-volume-muted-symbolic",
      low: "audio-volume-low-symbolic",
      medium: "audio-volume-medium-symbolic",
      high: "audio-volume-high-symbolic",
      overamplified: "audio-volume-overamplified-symbolic",
    },
    type: {
      headset: "audio-headphones-symbolic",
      speaker: "audio-speakers-symbolic",
      card: "audio-card-symbolic",
    },
    mixer: "",
  },
  asusctl: {
    profile: {
      Balanced: "power-profile-balanced-symbolic",
      Quiet: "power-profile-power-saver-symbolic",
      Performance: "power-profile-performance-symbolic",
    },
    mode: {
      Integrated: "",
      Hybrid: "󰢮",
    },
  },
  apps: {
    fallback: "applications-other",
    apps: "view-app-grid-symbolic",
    search: "folder-saved-search-symbolic",
    refresh: "view-refresh-symbolic",
  },
  battery: {
    charging: "󱐋",
    warning: "battery-empty-symbolic",
  },
  bluetooth: {
    enabled: "bluetooth-active-symbolic",
    disabled: "bluetooth-disabled-symbolic",
  },
  brightness: {
    indicator: "display-brightness-symbolic",
    keyboard: "keyboard-brightness-symbolic",
    screen: "display-brightness-symbolic",
  },
  powermenu: {
    sleep: "weather-clear-night-symbolic",
    reboot: "system-reboot-symbolic",
    logout: "system-log-out-symbolic",
    shutdown: "system-shutdown-symbolic",
  },
  recorder: {
    recording: "media-record-symbolic",
  },
  notifications: {
    noisy: "preferences-system-notifications-symbolic",
    silent: "notifications-disabled-symbolic",
  },
  trash: {
    full: "user-trash-full-symbolic",
    empty: "user-trash-symbolic",
  },
  mpris: {
    fallback: "audio-x-generic-symbolic",
    shuffle: "media-playlist-shuffle-symbolic",
    loop: {
      none: "media-playlist-consecutive-symbolic",
      track: "media-playlist-repeat-song-symbolic",
      playlist: "media-playlist-repeat-symbolic",
    },
    pause: "media-playback-pause-symbolic",
    play: "media-playback-start-symbolic",
    stop: "media-playback-stop-symbolic",
    prev: "media-skip-backward-symbolic",
    next: "media-skip-forward-symbolic",
  },
  ui: {
    arrow: {
      right: "go-next",
      left: "go-previous",
      down: "go-down",
      up: "go-up",
    },
  },
  system: {
    cpu: "org.gnome.SystemMonitor-symbolic",
    ram: "drive-harddisk-solidstate-symbolic",
    temp: "temperature-symbolic",
  },
};
