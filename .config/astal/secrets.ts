#!/bin/env -S ags run --gtk4

import { App } from "astal/gtk4";
import Secret from "gi://Secret?version=1";

const main = () => {
  const s = Secret.Service.get_sync(Secret.ServiceFlags.LOAD_COLLECTIONS, null);
  print(s);

  s.get_collections()?.forEach((c) => {
    print("coleçao:", c.get_label());
    c.get_items().forEach((i) => {
      print("\titem:", i.get_label());
      const a = i.get_attributes();

      for (const j of Object.keys(a)) {
        print(`\t\t${j}:`, a[j]);
      }

      // print(a);
      // print(Object.keys(a));

      i.load_secret_sync(null);
      const s = i.get_secret();

      if (s) {
        const decoder = new TextDecoder();
        print("\t\tsegredo:", decoder.decode(s.get()));
      }

      print("\n");
    });
    print("\n\n");
    // print(c.get_name());
    // print(c.)
  });

  App.quit();
};

App.start({
  main: main,
  instanceName: "portal-client",
});
