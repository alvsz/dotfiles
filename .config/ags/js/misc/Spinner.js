import Gtk from "gi://Gtk";
import Widget from "resource:///com/github/Aylur/ags/widget.js";

globalThis.widget = Widget;

// const Spinner = Widget.subclass(Gtk.Spinner);

export default (props) =>
  // Spinner({
  Widget.Spinner({
    ...props,
    // type: Gtk.Spinner,
    active: true,
  });
