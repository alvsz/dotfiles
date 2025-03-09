import { Gdk, Gtk } from "astal/gtk4";
import GObject, { property, register } from "astal/gobject";

import Mpris from "gi://AstalMpris";
import template from "./mprisPlayerList.blp";
import icons from "../icons";
import { lookup_icon } from "../util";

@register({
  GTypeName: "mprisPlayer",
  Template: template,
  InternalChildren: ["previous", "playpause", "next"],
})
class mprisPlayer extends Gtk.Box {
  @property(Mpris.Player) declare player: Mpris.Player;
  declare _previous: Gtk.Button;
  declare _playpause: Gtk.Button;
  declare _next: Gtk.Button;

  constructor(player: Mpris.Player) {
    super({ player: player } as any);
  }

  protected format_play_button() {
    if (this.player.playback_status == Mpris.PlaybackStatus.PLAYING)
      return icons.mpris.pause;
    else return icons.mpris.play;
  }

  protected on_value_changed(self: Gtk.Adjustment) {
    if (Math.abs(self.value - this.player.position) > 1) {
      print("setando posição, importante!!!");
      this.player.set_position(self.value);
    }
  }

  protected format_length() {
    return this.lengthStr(this.player.length);
  }

  protected format_position() {
    return this.lengthStr(this.player.position);
  }

  protected format_player_icon() {
    const name = this.player.bus_name.substring(23).split(".")[0];
    let icon;

    if (lookup_icon(name)) {
      icon = name;
    } else {
      const palavras = this.player.identity.split(" ");

      palavras.forEach((element) => {
        if (lookup_icon(element.toLowerCase())) {
          icon = element;
        }
      });
    }

    if (icon) return icon;
    else return icons.mpris.fallback;
  }

  protected on_previous() {
    this.player.previous();
  }

  protected on_playpause() {
    this.player.play_pause();
  }

  protected on_next() {
    this.player.next();
  }

  private lengthStr(length: number) {
    if (length === -1) return "--:--";
    const min = Math.floor(length / 60);
    const sec = Math.floor(length % 60);
    const sec0 = sec < 10 ? "0" : "";
    return `${min}:${sec0}${sec}`;
  }
}

@register({
  GTypeName: "mprisPlayerList",
})
export default class mprisPlayerList extends Gtk.Box {
  declare players: Map<string, Gtk.Box>;
  @property(Mpris.Mpris) declare mpris: Mpris.Mpris;

  constructor() {
    super({
      orientation: Gtk.Orientation.VERTICAL,
      visible: false,
    });
    this.add_css_class("mpris-list");
    this.mpris = Mpris.get_default();
    this.players = new Map<string, Gtk.Box>();

    this.mpris.connect(
      "player-added",
      (self: Mpris.Mpris, player: Mpris.Player) => {
        this.add_player(player);
      },
    );

    this.mpris.connect(
      "player-closed",
      (self: Mpris.Mpris, player: Mpris.Player) => {
        if (!this.players.has(player.bus_name)) return;

        const widget = this.players.get(player.bus_name);
        if (widget) {
          this.players.delete(player.bus_name);
          this.remove(widget);
        }
        if (this.players.size == 0) this.hide();
      },
    );

    this.mpris.players.forEach((p) => {
      this.add_player(p);
    });
  }

  private add_player(player: Mpris.Player) {
    if (this.players.has(player.bus_name)) return;

    const widget = new mprisPlayer(player);
    this.players.set(player.bus_name, widget);
    this.append(widget);
    this.show();
  }
}
