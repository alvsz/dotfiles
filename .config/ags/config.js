import Bar from "./js/windows/bar.js";
import AppMenu from "./js/windows/appmenu.js";
import Calendar from "./js/windows/calendar.js";
import Backdrop from "./js/windows/backdrop.js";

// import {
//   NotificationCenter,
//   // NotificationsPopupWindow,
// } from "./js/windows/notificationCenter.js";
// import Lockscreen from "./js/windows/lockscreen.js";

import { cssPath, forMonitors, scssWatcher } from "./js/utils.js";

// import goaClient from "./js/services/goaClient.js";
// globalThis.goa = goaClient;

// import iCal from "./js/services/iCal.js";
// globalThis.ical = iCal;

// import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
// globalThis.utils = Utils;

// import * as vars from "./js/vars.js";

import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";

Notifications.popupTimeout = 3000;
Notifications.cacheActions = true;

scssWatcher();

const windows = [
  forMonitors(Bar),
  // forMonitors(Lockscreen),
  forMonitors(Backdrop),
  // NotificationCenter(),
  // NotificationsPopupWindow(),
  AppMenu(),
  Calendar(),
].flat(2);

// globalThis.windowList = windows;

export default {
  style: cssPath,
  windows: windows,
};
