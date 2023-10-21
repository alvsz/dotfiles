import Gtk from "gi://Gtk";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
// import { Widget } from '../imports.js';

export default ({ orientation = "vertical", ...rest } = {}) =>
    Widget({
        ...rest,
        type: Gtk.Separator,
        orientation: Gtk.Orientation[orientation.toUpperCase()],
    });
