import { App, Gtk } from "astal/gtk4";
import { property, register } from "astal/gobject";
import { execAsync } from "astal/process";
import libTrem from "gi://libTrem?version=0.1";

import template from "./searchProviderItem.blp";
import template2 from "./searchProviderApp.blp";
import { Gio } from "astal";
import { remove_children } from "../util";

Gio._promisify(
  libTrem.RemoteSearchProvider.prototype,
  "search",
  "search_finish",
);

const MAX_RESULTS = 4;

@register({
  GTypeName: "searchProviderItem",
  Template: template,
})
class searchProviderItem extends Gtk.Button {
  private provider: libTrem.RemoteSearchProvider;
  private meta: libTrem.ResultMeta;
  private query: string[];
  private window_name: string;
  @property(String) declare title: string;
  @property(String) declare description: string;

  on_clicked() {
    const w = App.get_window(this.window_name);
    if (!w || !w.is_visible()) return;

    w.hide();
    this.provider.activate_result(this.meta.id, this.query);

    if (this.meta.clipboard_text)
      execAsync(["sh", "-c", `echo ${this.meta.clipboard_text} | wl-copy`]);
  }

  constructor(
    meta: libTrem.ResultMeta,
    provider: libTrem.RemoteSearchProvider,
    query: string[],
    window_name: string,
  ) {
    super();

    this.name = meta.name;
    this.title = meta.name;
    this.description = meta.description;
    this.meta = meta;
    this.provider = provider;
    this.query = query;
    this.window_name = window_name;

    if (meta.icon) {
      const i = Gtk.Image.new_from_gicon(meta.icon);
      (this.child as Gtk.Box).prepend(i);
    }
  }
}

@register({
  GTypeName: "searchProviderApp",
  Template: template2,
  InternalChildren: ["results"],
})
export default class searchProviderApp extends Gtk.Box {
  private provider: libTrem.RemoteSearchProvider;
  private window_name: string;
  private query: string[] = [];
  declare _results: Gtk.Box;
  @property(String) declare title_format: string;

  @property(String) declare title: string;
  @property(Gio.Icon) declare icon;

  async search(text: string[]): Promise<number> {
    this.query = text;

    try {
      const s = await this.provider.search(text);
      if (!s) return 0;

      const a = s.map((rm, n) =>
        n < MAX_RESULTS
          ? new searchProviderItem(rm, this.provider, text, this.window_name)
          : null,
      );

      if (a.length > 0) {
        remove_children(this._results);
        a.forEach((child) => (child ? this._results.append(child) : null));
        this._results.show();
        this.show();
      } else this.hide();

      return a.length;
    } catch (e) {
      this.hide();
      return 0;
    }
  }

  protected on_clicked() {
    const w = App.get_window(this.window_name);
    if (!w || !w.is_visible()) return;

    w.hide();
    this.provider.launch_search(this.query);
  }

  constructor(provider: libTrem.RemoteSearchProvider, window_name: string) {
    super();

    this.name = provider.get_name();
    this.provider = provider;
    this.title = provider.get_name();
    this.icon = provider.get_icon();
    this.window_name = window_name;

    this.title_format = `Mostrar mais em ${this.title}`;
  }
}
