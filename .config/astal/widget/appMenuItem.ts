import { App, Gtk } from "astal/gtk4";
import { property, register } from "astal/gobject";
import AstalApps from "gi://AstalApps?version=0.1";
import { lookup_icon } from "../util";

import template from "./appMenuItem.blp";
import icons from "../icons";

@register({
  GTypeName: "appMenuItem",
  Template: template,
})
export default class appMenuItem extends Gtk.Button {
  @property(AstalApps.Application) declare application: AstalApps.Application;
  private window_name: string;

  protected on_clicked() {
    const w = App.get_window(this.window_name);
    if (!w || !w.is_visible()) return;

    w.hide();
    this.application.launch();
  }

  protected get_app_icon() {
    if (this.application.icon_name && lookup_icon(this.application.icon_name))
      return this.application.icon_name;
    else {
      // @ts-ignore
      const icon = this.application.app.get_icon();

      if (icon) {
        const iconName = icon.to_string();
        if (lookup_icon(iconName)) return iconName;
        return icons.apps.fallback;
      }

      return icons.apps.fallback;
    }
  }

  constructor(app: AstalApps.Application, window_name: string) {
    super();

    this.application = app;
    this.window_name = window_name;
  }
}
