import { App, Astal, Gtk } from "astal/gtk4";
import { register } from "astal/gobject";

import template from "./AppMenu.blp";
import icons from "../icons";
import AstalApps from "gi://AstalApps?version=0.1";
import appMenuItem from "../widget/appMenuItem";

@register({
  GTypeName: "AppMenu",
  Template: template,
  InternalChildren: ["entry", "list", "placeholder"],
})
export default class AppMenu extends Astal.Window {
  declare _entry: Gtk.Entry;
  declare _list: Astal.Box;
  declare _placeholder: Gtk.Label;
  private apps = new AstalApps.Apps();

  private update_list(text: string) {
    this._list.set_children(
      this.apps
        .fuzzy_query(text)
        .map((app) => [new appMenuItem(app, this.name)])
        .flat(),
    );
  }

  protected on_activate(self: Gtk.Entry) {
    const text = self.get_text();
    const query = this.apps.fuzzy_query(text);

    if (query[0]) {
      this.hide();
      query[0].launch();
    }
  }

  protected on_change(self: Gtk.Entry) {
    const text = self.get_text();
    this.update_list(text);

    this._placeholder.visible = this._list.children.length === 0;
  }

  constructor() {
    super({
      application: App,
    });

    App.connect("window-toggled", (_, window: Gtk.Window) => {
      if (window != this) return;

      this.apps.reload();
      this._entry.set_text("");
      if (this.is_visible()) this._entry.grab_focus();
    });

    this.update_list("");
    this._entry.primary_icon_name = icons.apps.search;
    this._entry.secondary_icon_name = icons.apps.refresh;
  }
}
