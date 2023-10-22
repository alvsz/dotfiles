// importing
// import App from 'resource:///com/github/Aylur/ags/app.js';
// import Variable from 'resource:///com/github/Aylur/ags/variable.js';
// import { exec, execAsync } from 'resource:///com/github/Aylur/ags/utils.js';
// import GLib from 'gi://GLib'

import Bar from "./js/bar.js";
import AppMenu from "./js/appmenu.js";
import * as utils from "./js/utils.js";
import Lockscreen from "./js/lockscreen.js";
// import * as vars from "./js/vars.js";

globalThis.utils = utils;

utils.scssWatcher();

export default {
  style: utils.cssPath,
  windows: [
    utils.forMonitors(Bar),
    utils.forMonitors(Lockscreen),
    AppMenu(),
  ].flat(2),
};
