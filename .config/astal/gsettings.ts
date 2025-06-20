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
};

App.start({
  main: main,
  instanceName: "portal",
  requestHandler(request, res) {
    print("\nquery: ", request);
    p.forEach((provider) => {
      provider
        .getInitialResultSet(request.split(" "), null)
        .then((v) => {
          if (v)
            provider
              .getResultMetas(v, null)
              .then((m) => {
                m.forEach((o) => {
                  print(o.id, o.name, o.description, o.icon, o.clipboardText);
                });
              })
              .catch(logError);
        })
        .catch(logError);
    });

    res("oii");
  },
});
