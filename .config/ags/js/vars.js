import Variable from "resource:///com/github/Aylur/ags/variable.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import { exec, execAsync } from "resource:///com/github/Aylur/ags/utils.js";
import GLib from "gi://GLib";

const cacheHome = GLib.getenv("XDG_CACHE_HOME");

const [ok, colorsJson] = GLib.file_get_contents(`${cacheHome}/wal/colors.json`);
let colors = Array();

if (ok) {
  colors = JSON.parse(new TextDecoder().decode(colorsJson));
}

const dwlIpc = Variable(JSON.parse(Utils.exec("dwl-msg status")), {
  listen: [["dwl-msg", "follow"], (out) => JSON.parse(out)],
});

// const time = Variable(0, {
//   poll: [1000, ["date", "+%s"]],
// });

const focusedMon = () => {
  for (const mon of dwlIpc.value) {
    if (!mon.active) break;
    else {
      return mon;
    }
  }
};

// const formatTime = (format) => {
//   let timeOut;
//
//   execAsync(["date", `+${format}`])
//     .then((out) => (timeOut = out))
//     .catch((err) => print(err));
//
//   console.log(timeOut);
//   return timeOut;
// };

export { colors, dwlIpc, focusedMon };
