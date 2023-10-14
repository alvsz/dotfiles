// importing 
// import App from 'resource:///com/github/Aylur/ags/app.js';
// import Variable from 'resource:///com/github/Aylur/ags/variable.js';
// import { exec, execAsync } from 'resource:///com/github/Aylur/ags/utils.js';
// import GLib from 'gi://GLib'

import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';

import Bar from './js/bar.js'
// import {} from './vars.js'

const cssPath = `${ags.App.configDir}/style.css`
const scssPath = `${ags.App.configDir}/style.scss`

Utils.subprocess([
  'inotifywait',
  '--recursive',
  '--event', 'create,modify',
  '-m', scssPath,
], () => {
  console.log('scss reloaded');
  ags.Utils.exec(`sassc ${scssPath} ${cssPath}`);
  ags.App.resetCss();
  ags.App.applyCss(cssPath);
});

Utils.subprocess(
  ['sh', '-c', 'inotifywait --recursive --event create,modify -m ~/.config/ags/js | while read line; do ags -q; ags & done & disown']
)


// exporting the config so ags can manage the windows
export default {
  style: cssPath,
  windows: [
    Bar({ name: "bar-main" }),

    // you can call it, for each monitor
    // Bar({ monitor: 0 }),
    // Bar({ monitor: 1 })
  ],
};

