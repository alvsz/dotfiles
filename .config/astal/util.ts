import { Gtk } from "astal/gtk4";

export const setCss = (widget: Gtk.Widget, css: string) => {
  if (!css.includes("{") || !css.includes("}")) css = `* { ${css} }`;

  const cssProvider = new Gtk.CssProvider();
  cssProvider.load_from_data(css, css.length);
  widget
    .get_style_context()
    .add_provider(cssProvider, Gtk.STYLE_PROVIDER_PRIORITY_USER);
};
