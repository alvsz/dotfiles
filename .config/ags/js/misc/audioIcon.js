import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Audio from "resource:///com/github/Aylur/ags/service/audio.js";

const audioIcon = (source, setup = () => {}) =>
  Widget.Icon({
    className: "audioIcon",
    vpack: "center",
    setup: (self) => {
      if (typeof setup == "function") setup(self);
    },
  }).hook(
    Audio,
    (self) => {
      let icon;
      let stream;

      if (!source) {
        if (!Audio.speaker.stream) return;
        stream = Audio.speaker;
      } else {
        if (!Audio.microphone.stream) return;
        stream = Audio.microphone;
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

      self.icon = `${
        source ? "microphone-sensitivity" : "audio-volume"
      }-${icon}`;

      self.tooltipText = `Volume ${Math.floor(stream.volume * 100)}%`;
    },
    source ? "microphone-changed" : "speaker-changed",
  );

export default audioIcon;
