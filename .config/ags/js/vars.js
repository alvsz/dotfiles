import Variable from "resource:///com/github/Aylur/ags/variable.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import GLib from "gi://GLib";

const cacheHome = GLib.getenv("XDG_CACHE_HOME");

const [ok, colorsJson] = GLib.file_get_contents(`${cacheHome}/wal/colors.json`);
let colors = Array();

if (ok) {
  colors = JSON.parse(new TextDecoder().decode(colorsJson));
}

const dwlIpc = Variable(JSON.parse(Utils.exec("dwl-msg.lua status")), {
  listen: [["dwl-msg.lua", "follow"], (out) => JSON.parse(out)],
});

// const focusedMon = () => {
//   for (const mon of dwlIpc.value) {
//     if (!mon.active) break;
//     else {
//       return mon;
//     }
//   }
// };

export { colors, dwlIpc };
