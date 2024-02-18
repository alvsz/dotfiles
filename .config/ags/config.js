import Bar from "./js/windows/bar.js";
// import {
//   NotificationCenter,
//   // NotificationsPopupWindow,
// } from "./js/windows/notificationCenter.js";

import AppMenu from "./js/windows/appmenu.js";
import Calendar from "./js/windows/calendar.js";
import Backdrop from "./js/windows/backdrop.js";
// import Lockscreen from "./js/windows/lockscreen.js";

import * as utils from "./js/utils.js";
// import * as vars from "./js/vars.js";

import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";

Notifications.popupTimeout = 3000;
Notifications.cacheActions = true;

globalThis.utils = utils;

import goa from "./js/services/goa.js";
globalThis.goa = goa;

utils.scssWatcher();

const windows = [
  utils.forMonitors(Bar),
  // utils.forMonitors(Lockscreen),
  utils.forMonitors(Backdrop),
  // NotificationCenter(),
  // NotificationsPopupWindow(),
  AppMenu(),
  Calendar(),
].flat(2);

// globalThis.windowList = windows;

export default {
  style: utils.cssPath,
  windows: windows,
};
