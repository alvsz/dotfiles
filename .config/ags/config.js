import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import App from "resource:///com/github/Aylur/ags/app.js";
import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";

import Bar from "./js/windows/bar.js";
import AppMenu from "./js/windows/appmenu.js";
import Calendar from "./js/windows/calendar.js";
import Dashboard from "./js/windows/dashboard.js";
import Polkit from "./js/windows/polkit.js";

import Weather from "./js/services/weather.js";
import polkitAgent from "./js/services/polkitAgent.js";

import { cssPath, forMonitors, scssWatcher } from "./js/utils.js";

import calendarServer from "./js/services/ecal.js";
globalThis.calendarserver = calendarServer;

// import Lock from "./js/misc/Lock.js";
// globalThis.lock = Lock;

globalThis.weather = Weather;
globalThis.polkit = polkitAgent;
globalThis.utils = Utils;

Notifications.popupTimeout = 3000;
Notifications.cacheActions = true;

scssWatcher();

polkitAgent.connect("initiate", () => {
  App.addWindow(Polkit(polkitAgent._currentDialog));
});

const windows = [
  ...forMonitors(Bar),
  // forMonitors(Lockscreen),
  // ...forMonitors(Backdrop),
  // NotificationCenter(),
  // NotificationsPopupWindow(),
  AppMenu(),
  Calendar(),
  Dashboard(),
];

App.config({
  style: cssPath,
  windows: windows,
});
