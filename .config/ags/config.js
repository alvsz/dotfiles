import Bar from "./js/windows/bar.js";
import AppMenu from "./js/windows/appmenu.js";
import Calendar from "./js/windows/calendar.js";
import Backdrop from "./js/windows/backdrop.js";
import Dashboard from "./js/windows/dashboard.js";

import Weather from "./js/services/weather.js";

globalThis.weather = Weather;

import App from "resource:///com/github/Aylur/ags/app.js";

// import {
//   NotificationCenter,
//   // NotificationsPopupWindow,
// } from "./js/windows/notificationCenter.js";
// import Lockscreen from "./js/windows/lockscreen.js";

import { cssPath, forMonitors, scssWatcher } from "./js/utils.js";

// import goaClient from "./js/services/goaClient.js";
// globalThis.goa = goaClient;

import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
globalThis.utils = Utils;

// import iCal from "./js/services/iCal.js";
// globalThis.ical = iCal;

// import * as vars from "./js/vars.js";

import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";

Notifications.popupTimeout = 3000;
Notifications.cacheActions = true;

scssWatcher();

const windows = [
  ...forMonitors(Bar),
  // forMonitors(Lockscreen),
  ...forMonitors(Backdrop),
  // NotificationCenter(),
  // NotificationsPopupWindow(),
  AppMenu(),
  Calendar(),
  Dashboard(),
];

// globalThis.windowList = windows;

App.config({
  style: cssPath,
  windows: windows,
});
