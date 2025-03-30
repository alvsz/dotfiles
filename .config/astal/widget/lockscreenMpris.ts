import { GLib } from "astal";
import { App, Gdk, Gtk } from "astal/gtk4";
import GObject, { property, register } from "astal/gobject";

import Mpris from "gi://AstalMpris";
import Cava from "gi://AstalCava";
import cairo from "gi://cairo?version=1.0";

import icons from "../icons";
import Template from "./lockscreenMpris.blp";

@register({
  GTypeName: "LockscreenMpris",
  Template: Template,
  InternalChildren: ["cava"],
})
export default class LockscreenMpris extends Gtk.Box {
  @property(Mpris.Player) declare player: Mpris.Player;
  @property(Cava.Cava) declare cava: Cava.Cava;
  private mpris: Mpris.Mpris;
  declare _cava: Gtk.DrawingArea;

  protected format_play_button() {
    if (this.player?.playback_status == Mpris.PlaybackStatus.PLAYING)
      return icons.mpris.pause;
    else return icons.mpris.play;
  }

  protected on_value_changed(self: Gtk.Adjustment) {
    if (Math.abs(self.value - this.player?.position) > 1) {
      this.player?.set_position(self.value);
    }
  }

  protected format_length() {
    return this.lengthStr(this.player?.length);
  }

  protected format_position() {
    return this.lengthStr(this.player?.position);
  }

  protected on_previous() {
    this.player?.previous();
  }

  protected on_playpause() {
    this.player?.play_pause();
  }

  protected on_next() {
    this.player?.next();
  }

  protected spacer_visible() {
    return this.player?.can_go_next === this.player?.can_go_previous;
  }

  protected player_active() {
    return this.player.playback_status === Mpris.PlaybackStatus.PLAYING;
  }

  private lengthStr(length: number) {
    if (length === -1) return "--:--";
    const min = Math.floor(length / 60);
    const sec = Math.floor(length % 60);
    const sec0 = sec < 10 ? "0" : "";
    return `${min}:${sec0}${sec}`;
  }

  constructor() {
    super();

    this.mpris = Mpris.get_default();
    this.mpris.connect(
      "player-added",
      (self: Mpris.Mpris, player: Mpris.Player) => {
        this.player = self.get_players()[0];
        this.visible = true;
      },
    );
    this.mpris.connect(
      "player-closed",
      (self: Mpris.Mpris, player: Mpris.Player) => {
        if (self.get_players().length === 0) {
          this.visible = false;
          return;
        }
        this.player = self.get_players()[0];
      },
    );
    if (this.mpris.get_players().length === 0) this.visible = false;
    this.player = this.mpris.get_players()[0];

    this._cava.set_draw_func((self, cr, width, height) => {
      const fg = self.get_color();
      const values = this.cava.get_values();
      const bar_width = Math.floor((width - 2) / this.cava.bars);
      const line_width = Math.floor(bar_width / 2);

      // @ts-ignore
      cr.setSourceRGBA(fg.red, fg.green, fg.blue, fg.alpha);
      // @ts-ignore
      cr.setLineCap(cairo.LineCap.ROUND);

      // @ts-ignore
      cr.setLineWidth(line_width);

      let old_x = line_width;
      for (let i = 0; i < this.cava.bars; i++) {
        const bar_height = (values[i] * (height - 2 * line_width)) / 3;
        const bar_y = Math.floor((height - 2 * line_width - bar_height) / 2);
        // @ts-ignore
        cr.moveTo(old_x, bar_y);
        // @ts-ignore
        cr.lineTo(old_x, bar_y + bar_height);
        // @ts-ignore
        cr.stroke();

        old_x += bar_width;
      }
    });

    this.cava.connect("notify", () => {
      this._cava.queue_draw();
    });
  }
}
