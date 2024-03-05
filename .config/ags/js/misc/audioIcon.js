import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Audio from "resource:///com/github/Aylur/ags/service/audio.js";

const audioIcon = () =>
  Widget.Icon({
    className: "audioIcon",
    vpack: "center",
  }).hook(
    Audio,
    (self) => {
      if (!Audio.speaker) return;

      const vol = Audio.speaker.volume * 100;
      let icon;

      if (Audio.control.get_default_sink().get_is_muted()) {
        self.icon = "audio-volume-muted-symbolic";
      } else {
        icon = [
          [101, "overamplified"],
          [67, "high"],
          [34, "medium"],
          [1, "low"],
          [0, "muted"],
        ].find(([threshold]) => threshold <= vol)[1];

        self.icon = `audio-volume-${icon}`;
      }
      self.tooltipText = `Volume ${Math.floor(vol)}%`;
    },
    "speaker-changed",
  );

export default audioIcon;
