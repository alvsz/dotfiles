import { GLib, bind } from "astal";
import { App, Astal, Gdk, Gtk } from "astal/gtk4";
import Template from "./Bar.blp";
import { property, register } from "astal/gobject";
import GObject from "gi://GObject";
import Mpris from "gi://AstalMpris";
import Battery from "gi://AstalBattery";
import Wp from "gi://AstalWp";
import Network from "gi://AstalNetwork";
import Bluetooth from "gi://AstalBluetooth";
import icons from "../icons";

@register({
  GTypeName: "Bar",
  Template: Template,
  InternalChildren: ["clock", "mpris_stack", "tray_toggle"],
})
export default class Bar extends Astal.Window {
  declare _clock: Gtk.Label;
  declare _tray_toggle: Gtk.ToggleButton;
  declare _mpris_stack: Gtk.Stack;
  declare mpris: Mpris.Mpris;
  declare bluetooth: Bluetooth.Bluetooth;
  @property(Boolean) declare powered: boolean;

  private update_clock() {
    const now = GLib.DateTime.new_now_local();
    this._clock.label = now.format("%a %d, %R") || "";
  }

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

  private add_player(player: Mpris.Player) {
    const label = new Gtk.Label();

    player.connect("notify", (self: Mpris.Player) => {
      label.label = this.player_label(self);
    });
    label.label = this.player_label(player);

    this._mpris_stack.add_named(label, player.bus_name);
    this._mpris_stack.set_visible_child_name(player.bus_name);
  }

  private remove_player = (self: Mpris.Mpris, player: Mpris.Player) => {
    const label = this._mpris_stack.get_child_by_name(player.bus_name);
    if (label) {
      this._mpris_stack.remove(label);
    }

    setTimeout(() => {
      if (this.mpris.get_players().length == 0)
        this._mpris_stack.set_visible_child_name("nada");
    }, 1000);
  };

  constructor() {
    super({
      application: App,
      anchor:
        Astal.WindowAnchor.TOP |
        Astal.WindowAnchor.LEFT |
        Astal.WindowAnchor.RIGHT,
      visible: true,
    });

    this.mpris = Mpris.get_default();
    this.bluetooth = Bluetooth.get_default();

    this.bluetooth.bind_property(
      "is-powered",
      this,
      "powered",
      GObject.BindingFlags.SYNC_CREATE,
    );

    this._mpris_stack.add_named(
      new Gtk.Label({ label: "Nada tocando" }),
      "nada",
    );

    this.mpris.get_players().map((player: Mpris.Player) => {
      this.add_player(player);
    });

    this.mpris.connect(
      "player-added",
      (self: Mpris.Mpris, player: Mpris.Player) => {
        this.add_player(player);
      },
    );

    this.mpris.connect("player-closed", this.remove_player);

    setInterval(() => {
      this.update_clock();
    }, 15000);

    this.update_clock();

    this._tray_toggle.child.icon_name = icons.ui.arrow.left;
  }

  protected bluetooth_icon() {
    if (this.powered) return icons.bluetooth.enabled;
    else return icons.bluetooth.disabled;
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
    // print(scroll, dy, dx);
  }
}
