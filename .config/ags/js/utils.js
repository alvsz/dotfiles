import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import App from "resource:///com/github/Aylur/ags/app.js";
import Audio from "resource:///com/github/Aylur/ags/service/audio.js";

import * as vars from "./vars.js";

export const cssPath = `${App.configDir}/style.css`;
export const scssPath = `${App.configDir}/style.scss`;

const reloadTheme = () => {
  Utils.exec(`sassc ${scssPath} ${cssPath}`);
  App.resetCss();
  App.applyCss(cssPath);
  console.log("scss reloaded");
};

export const scssWatcher = () => {
  Utils.monitorFile(scssPath, () => reloadTheme());
};

// export const scssWatcher = () => {
//   reloadTheme();
//
//   Utils.subprocess(
//     ["inotifywait", "--recursive", "--event", "create,modify", "-m", scssPath],
//     reloadTheme,
//   );
// };

export const jsWatcher = () => {
  Utils.subprocess(
    [
      "inotifywait",
      "--recursive",
      "--event",
      "create,modify",
      "-m",
      "~/.config/ags/js",
    ],
    () => {
      Utils.execAsync(["sh", "-c", "alacritty"]);
    },
  );
};

export const forMonitors = (widget) => {
  return vars.dwlIpc.value.map((mon) => {
    return widget(mon.id);
    // const id = vars.dwlIpc.value.indexOf(mon);
    // return widget({ monitor: id });
  });
};

export const getDefaultSink = () => {
  const defaultStream = Audio.control.get_default_sink();

  if (defaultStream) return Audio.getStream(defaultStream.id);
  else return Audio.speakers[0];
};

export const getDefaultSource = () => {
  const defaultStream = Audio.control.get_default_source();

  if (defaultStream) return Audio.getStream(defaultStream.id);
  else return Audio.microphones[0];
};

globalThis.defaultsource = getDefaultSource;
globalThis.defaultsink = getDefaultSink;

// export const
