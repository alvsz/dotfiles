import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Audio from "resource:///com/github/Aylur/ags/service/audio.js";

import { getDefaultSink, getDefaultSource } from "../utils.js";

const audioIcon = (source) =>
  Widget.Icon({
    className: "audioIcon",
    vpack: "center",
  }).hook(
    Audio,
    (self) => {
      if (!Audio.speaker) return;

      let icon;
      let stream;

      if (!source) {
        stream = getDefaultSink();
      } else {
        stream = getDefaultSource();
      }

      if (stream.stream.isMuted) {
        icon = "muted-symbolic";
      } else {
        if (stream.volume > 1) {
          icon = "overamplified";
        } else if (stream.volume >= 0.67) {
          icon = "high";
        } else if (stream.volume >= 0.34) {
          icon = "medium";
        } else if (stream.volume >= 0.1) {
          icon = "low";
        } else {
          icon = "muted";
        }
      }

      self.icon = `${source ? "microphone-sensitivity" : "audio-volume"
        }-${icon}`;

      // self.icon = "microphone-sensitivity-muted-symbolic";
      // self.icon = "microphone-sensitivity-muted";

      // self.icon = source
      //   ? `microphone-sensitivity-${icon}`
      //   : `audio-volume-${icon}`;

      self.tooltipText = `Volume ${Math.floor(stream.volume * 100)}%`;
    },
    source ? "microphone-changed" : "speaker-changed",
  );

export default audioIcon;
