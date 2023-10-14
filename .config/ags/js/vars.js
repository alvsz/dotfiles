import Variable from 'resource:///com/github/Aylur/ags/variable.js';
import { exec, execAsync } from 'resource:///com/github/Aylur/ags/utils.js';
import GLib from 'gi://GLib'

const cacheHome = GLib.getenv('XDG_CACHE_HOME')

const [ok, colorsJson] = GLib.file_get_contents(`${cacheHome}/wal/colors.json`)
let colors = Array()

if (ok) {
  colors = JSON.parse(colorsJson);
}

const dwlIpc = Variable(execAsync(['dwl-msg', 'status']), {
  listen: [['dwl-msg', 'follow'], out => JSON.parse(out)],
});

const focusedMon = () => {
  for (const mon of dwlIpc.value) {
    if (!mon.active)
      break
    else {
      return mon
    }
  }
}

export { dwlIpc, focusedMon }
