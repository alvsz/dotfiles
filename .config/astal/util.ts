import { Gdk, Gtk } from "astal/gtk4";

export const lookup_icon = (
  name: string,
  fallbacks: string[] = [],
  size = 16,
) => {
  const d = Gdk.Display.get_default();

  if (d) {
    const it = Gtk.IconTheme.get_for_display(d);
    return it
      .lookup_icon(name, fallbacks, size, 1, null, null)
      .get_file()
      ?.get_path();
  } else return null;
};

export const setCss = (widget: Gtk.Widget, css: string) => {
  if (!css.includes("{") || !css.includes("}")) css = `* { ${css} }`;

  const cssProvider = new Gtk.CssProvider();
  cssProvider.load_from_data(css, css.length);
  widget
    .get_style_context()
    .add_provider(cssProvider, Gtk.STYLE_PROVIDER_PRIORITY_USER);
};

export const remove_children = (b: Gtk.Box) => {
  b.visible = false;
  let w = b.get_first_child();
  let n = w?.get_next_sibling();

  while (w) {
    b.remove(w);
    w = n || null;
    n = w?.get_next_sibling();
  }
};
