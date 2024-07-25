import Bar from "./js/windows/bar.js";
import AppMenu from "./js/windows/appmenu.js";
import Calendar from "./js/windows/calendar.js";
// import Backdrop from "./js/windows/backdrop.js";
import Dashboard from "./js/windows/dashboard.js";

// import Lock from "./js/misc/Lock.js";
// globalThis.lock = Lock;

import Weather from "./js/services/weather.js";

globalThis.weather = Weather;

import App from "resource:///com/github/Aylur/ags/app.js";

import { cssPath, forMonitors, scssWatcher } from "./js/utils.js";

import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
globalThis.utils = Utils;

import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";

Notifications.popupTimeout = 3000;
Notifications.cacheActions = true;

scssWatcher();

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
