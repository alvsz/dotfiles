import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import App from "resource:///com/github/Aylur/ags/app.js";
import * as vars from "./vars.js";

export const cssPath = `${App.configDir}/style.css`;
export const scssPath = `${App.configDir}/style.scss`;

export const scssWatcher = () => {
  Utils.subprocess(
    ["inotifywait", "--recursive", "--event", "create,modify", "-m", scssPath],
    () => {
      console.log("scss reloaded");
      Utils.exec(`sassc ${scssPath} ${cssPath}`);
      App.resetCss();
      App.applyCss(cssPath);
    },
  );
};

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

export const launchApp = (app) => {
  Utils.execAsync(["sh", "-c", `${app.executable} &`]);
  app.frequency += 1;
};

export const forMonitors = (widget) => {
  return vars.dwlIpc.value.map((mon) => {
    const id = vars.dwlIpc.value.indexOf(mon);
    return widget({ monitor: id });
  });
};
