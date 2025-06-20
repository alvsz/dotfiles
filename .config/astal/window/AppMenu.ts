import { Gio } from "astal";
import { App, Astal, Gdk, Gtk } from "astal/gtk4";
import { register } from "astal/gobject";

import template from "./AppMenu.blp";
import icons from "../icons";
import AstalApps from "gi://AstalApps?version=0.1";
import appMenuItem from "../widget/appMenuItem";
import { RemoteSearchProvider, setup_search } from "../service/remoteSearch";
import searchProviderApp from "../widget/searchProviderItem";

@register({
  GTypeName: "AppMenu",
  Template: template,
  InternalChildren: ["entry", "providers", "app_list", "placeholder"],
})
export default class AppMenu extends Astal.Window {
  declare _entry: Gtk.Entry;
  declare _providers: Astal.Box;
  declare _app_list: Astal.Box;
  declare _placeholder: Gtk.Label;

  private apps = new AstalApps.Apps();
  private providers: RemoteSearchProvider[];
  private app_query: AstalApps.Application[] = [];
  private temp: searchProviderApp[] = [];

  private update_list(text: string) {
    this.app_query = this.apps.fuzzy_query(text);

    this._app_list.set_children(
      this.app_query.map((app) => [new appMenuItem(app, this.name)]).flat(),
    );
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

    this._placeholder.visible = this._app_list.children.length === 0;

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
      print("mudou as configurações");
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
