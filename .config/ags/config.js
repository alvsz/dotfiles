// importing 
// import App from 'resource:///com/github/Aylur/ags/app.js';
// import Variable from 'resource:///com/github/Aylur/ags/variable.js';
// import { exec, execAsync } from 'resource:///com/github/Aylur/ags/utils.js';
// import GLib from 'gi://GLib'


import Bar from './js/bar.js'
import * as utils from './js/utils.js'
// import {} from './vars.js'

utils.jsWatcher()
utils.scssWatcher()


// exporting the config so ags can manage the windows
export default {
  style: utils.cssPath,
  windows: [
    Bar({ name: "bar-main" }),

    // you can call it, for each monitor
    // Bar({ monitor: 0 }),
    // Bar({ monitor: 1 })
  ],
};

