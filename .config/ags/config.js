// importing
// import App from 'resource:///com/github/Aylur/ags/app.js';
// import Variable from 'resource:///com/github/Aylur/ags/variable.js';
// import { exec, execAsync } from 'resource:///com/github/Aylur/ags/utils.js';
// import GLib from 'gi://GLib'

import Bar from "./js/windows/bar.js";
import {
  NotificationCenter,
  NotificationsPopupWindow,
} from "./js/windows/notificationCenter.js";
import AppMenu from "./js/windows/appmenu.js";
import * as utils from "./js/utils.js";
import Lockscreen from "./js/windows/lockscreen.js";
// import Calendar from "./js/windows/calendar.js";
// import * as vars from "./js/vars.js";

globalThis.utils = utils;

utils.scssWatcher();

const windows = [
  utils.forMonitors(Bar),
  utils.forMonitors(Lockscreen),
  NotificationCenter(),
  NotificationsPopupWindow(),
  AppMenu(),
  // Calendar(),
].flat(2);

globalThis.windowList = windows;

export default {
  style: utils.cssPath,
  notificationPopupTimeout: 3000,
  cacheNotificationActions: true,

  windows: windows,
};
