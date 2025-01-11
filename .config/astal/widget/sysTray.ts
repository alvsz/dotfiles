import { Gtk } from "astal/gtk4";
import { property, register } from "astal/gobject";

import Tray from "gi://AstalTray";
import template from "./sysTray.blp";

@register({
  GTypeName: "sysTrayItem",
  Template: template,
  InternalChildren: ["menu"],
})
class sysTrayItem extends Gtk.Button {
  declare _menu: Gtk.PopoverMenu;
  @property(Tray.TrayItem) declare item: Tray.TrayItem;

  constructor(i: Tray.TrayItem) {
    super();

    this.item = i;
    this._menu.set_parent(this);
    this._menu.set_position(Gtk.PositionType.BOTTOM);

    this.item.connect("notify::action-group", (self: Tray.TrayItem) => {
      this.insert_action_group("dbusmenu", self.action_group);
    });
    this.insert_action_group("dbusmenu", this.item.action_group);
  }

  protected on_clicked() {
    this.item.activate(0, 0);
  }

  protected open_menu() {
    this.item.about_to_show();
    this._menu.popup();
  }

  protected on_scroll(
    scroll: Gtk.EventControllerScroll,
    dx: number,
    dy: number,
  ) {
    this.item.scroll(dx, "horizontal");
    this.item.scroll(dy, "vertical");
  }
}

@register({
  GTypeName: "sysTray",
})
export default class sysTray extends Gtk.Box {
  declare items: Map<string, Gtk.Button>;
  @property(Tray.Tray) declare tray: Tray.Tray;

  constructor() {
    super();

    this.tray = Tray.get_default();
    this.items = new Map<string, Gtk.Button>();

    this.tray.connect("item-added", (self: Tray.Tray, item_id: string) => {
      if (this.items.has(item_id)) return;

      const item = new sysTrayItem(self.get_item(item_id));
      this.items.set(item_id, item);
      this.append(item);
    });

    this.tray.connect("item-removed", (self: Tray.Tray, item_id: string) => {
      if (!this.items.has(item_id)) return;

      const item = this.items.get(item_id);
      if (item) this.remove(item);
    });
  }
}
