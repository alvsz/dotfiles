#!/bin/env -S ags run --gtk4

import { GLib, Gio } from "astal";
import { App } from "astal/gtk4";

import { RemoteSearchProvider, setup_search } from "./service/remoteSearch";

let p: RemoteSearchProvider[];

const main = () => {
  const s = new Gio.Settings({
    schema: "org.gnome.desktop.search-providers",
  });
  // print(s.get_value("enabled").recursiveUnpack());
  // print(s.get_value("sort-order").recursiveUnpack());

  p = setup_search(s);

  p.forEach((provider) => {
    // print(provider.app_info.get_name(), provider.id);

    provider.search("Documentos");
  });
};

App.start({
  main: main,
  instanceName: "portal",
  requestHandler(request, res) {
    print("query: ", request);
    p.forEach((provider) => provider.search(request));

    res("oii");
  },
});
