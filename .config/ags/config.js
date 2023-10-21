// importing
// import App from 'resource:///com/github/Aylur/ags/app.js';
// import Variable from 'resource:///com/github/Aylur/ags/variable.js';
// import { exec, execAsync } from 'resource:///com/github/Aylur/ags/utils.js';
// import GLib from 'gi://GLib'

import Bar from "./js/bar.js";
import * as utils from "./js/utils.js";
import * as vars from "./js/vars.js";

utils.scssWatcher();

export default {
  style: utils.cssPath,
  windows: [
    vars.dwlIpc.value.map((mon) => {
      const id = vars.dwlIpc.value.indexOf(mon);
      return Bar({ monitor: id });
    }),
  ].flat(2),
};
