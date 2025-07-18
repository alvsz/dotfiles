import { Gio } from "astal";
import { App, Astal, Gdk, Gtk } from "astal/gtk4";
import { register } from "astal/gobject";

import template from "./AppMenu.blp";
import icons from "../icons";
import AstalApps from "gi://AstalApps?version=0.1";
import appMenuItem from "../widget/appMenuItem";
import { setup_search } from "../service/remoteSearch";
import searchProviderApp from "../widget/searchProviderItem";
import { remove_children } from "../util";
import libTrem from "gi://libTrem?version=0.1";

@register({
  GTypeName: "AppMenu",
  Template: template,
  InternalChildren: ["entry", "providers", "app_list", "placeholder"],
})
export default class AppMenu extends Astal.Window {
  declare _entry: Gtk.Entry;
  declare _providers: Gtk.Box;
  declare _app_list: Gtk.Box;
  declare _placeholder: Gtk.Label;

  private apps = new AstalApps.Apps();
  private providers: libTrem.RemoteSearchProvider[];
  private app_query: AstalApps.Application[] = [];
  private temp: searchProviderApp[] = [];

  private update_list(text: string) {
    this.app_query = this.apps.fuzzy_query(text);

    remove_children(this._app_list);
    this.app_query.forEach((app) =>
      this._app_list.append(new appMenuItem(app, this.name)),
    );
    this._app_list.show();
  }

  protected on_activate(self: Gtk.Entry) {
    const text = self.get_text();
    this.app_query = this.apps.fuzzy_query(text);

    if (this._app_list.get_first_child()) {
      (this._app_list.get_first_child() as appMenuItem).on_clicked();
    }
  }

  private async lookup_providers(text: string[]) {
    const c = await Promise.all(this.temp.map((p) => p.search(text)));
    const s = c.reduce((p, v) => p + v);

    if (s > 0) this._providers.show();
    else this._providers.hide();
  }

  protected on_change(self: Gtk.Entry) {
    const text = self.get_text();
    this.update_list(text);

    this._placeholder.visible = Boolean(this._app_list.get_first_child());

    if (text.length === 0) this._providers.hide();
    else this.lookup_providers(text.split(" "));
  }

  protected on_key_pressed(
    _self: Gtk.EventControllerKey,
    keyval: number,
    _keycode: number,
    _state: Gdk.ModifierType,
  ) {
    if (keyval === Gdk.KEY_Escape) this.hide();
  }

  constructor() {
    super({
      application: App,
    });

    const s = new Gio.Settings({
      schema: "org.gnome.desktop.search-providers",
    });
    s.connect("changed", (self) => {
      this.providers = setup_search(self);
    });

    this.providers = setup_search(s);

    this.providers.forEach((p) => {
      const s = new searchProviderApp(p, this.name);
      this.temp.push(s);
      this._providers.append(s);
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
