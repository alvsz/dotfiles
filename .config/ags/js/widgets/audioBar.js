import Audio from "resource:///com/github/Aylur/ags/service/audio.js";

import audioIcon from "./audioIcon.js";
import overlay_slider_and_icon from "./overlay_slider_and_icon.js";

const audioBar = (isSink) =>
  overlay_slider_and_icon(
    {
      vertical: false,
      className: isSink ? "volumeBar" : "micBar",
      vpack: "center",
      hexpand: true,

      onChange: ({ value }) => {
        if (isSink) {
          if (Audio.speaker) Audio.speaker.volume = value;
        } else {
          if (Audio.microphone) Audio.microphone.volume = value;
        }
      },

      drawValue: false,
      min: 0,
      max: 1,

      setup: (self) =>
        self.hook(Audio, () => {
          let available = false;
          let stream;

          if (isSink) {
            if (Audio.speaker?.stream) {
              stream = Audio.speaker;
              available = true;
            }
          } else {
            if (Audio.microphone?.stream) {
              stream = Audio.microphone;
              available = true;
            }
          }

          if (!available) {
            self.value = 0;
            // self.visible = false;
            return;
          }

          self.value = stream.volume;
          // self.visible = true;
        }),
    },
    [
      audioIcon({
        source: !isSink,
        hpack: "start",
      }),
    ],
  );

export default audioBar;
