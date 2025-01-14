import { Gtk } from "astal/gtk4";
import { property, register } from "astal/gobject";

import Mpris from "gi://AstalMpris";

import template from "./barMprisButton.blp";

@register({
  GTypeName: "barMprisButton",
  Template: template,
  InternalChildren: ["mpris_stack"],
})
export default class barMprisButton extends Gtk.Button {
  @property(Mpris.Mpris) declare mpris: Mpris.Mpris;
  declare _mpris_stack: Gtk.Stack;

  private get_player(bus_name: string) {
    const players = this.mpris.get_players();

    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (p.bus_name == bus_name) return { player: p, index: i };
    }
    return undefined;
  }

  private player_label(player: Mpris.Player) {
    const limitWidth = 45;
    const title = `${player.artist} - ${player.title}`;

    if (title.length > limitWidth) {
      return title.substring(0, limitWidth - 3) + "...";
    } else {
      return title;
    }
  }

  constructor() {
    super();

    this.mpris = Mpris.get_default();

    this.mpris.get_players().map((player: Mpris.Player) => {
      this.on_player_added(this.mpris, player);
    });
  }

  protected on_player_added(self: Mpris.Mpris, player: Mpris.Player) {
    const label = new Gtk.Label();

    player.connect("notify", (self: Mpris.Player) => {
      label.label = this.player_label(self);
    });
    label.label = this.player_label(player);

    this._mpris_stack.add_named(label, player.bus_name);
    this._mpris_stack.set_visible_child_name(player.bus_name);
  }

  protected on_player_closed(self: Mpris.Mpris, player: Mpris.Player) {
    const label = this._mpris_stack.get_child_by_name(player.bus_name);
    if (label) {
      this._mpris_stack.remove(label);
    }

    setTimeout(() => {
      if (this.mpris.get_players().length == 0)
        this._mpris_stack.set_visible_child_name("nada");
    }, 1000);
  }

  protected on_mpris_button_clicked(self: Gtk.Button) {
    const player = this.get_player(this._mpris_stack.visible_child_name);
    if (player) {
      player.player.play_pause();
    }
  }

  protected on_mpris_button_scroll(
    scroll: Gtk.EventControllerScroll,
    dx: number,
    dy: number,
  ) {
    const player = this.get_player(this._mpris_stack.visible_child_name);
    if (player) {
      const p = this.mpris.players[player.index + dy];
      if (p) {
        this._mpris_stack.set_visible_child_name(p.bus_name);
      }
    }
  }
}
