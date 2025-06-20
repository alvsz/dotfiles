import { GLib, Gio } from "astal";
import { Gtk } from "astal/gtk4";
import GdkPixbuf from "gi://GdkPixbuf?version=2.0";

const KEY_FILE_GROUP = "Shell Search Provider";

const SearchProviderIface = `
<node>
<interface name="org.gnome.Shell.SearchProvider">
<method name="GetInitialResultSet">
    <arg type="as" direction="in" />
    <arg type="as" direction="out" />
</method>
<method name="GetSubsearchResultSet">
    <arg type="as" direction="in" />
    <arg type="as" direction="in" />
    <arg type="as" direction="out" />
</method>
<method name="GetResultMetas">
    <arg type="as" direction="in" />
    <arg type="aa{sv}" direction="out" />
</method>
<method name="ActivateResult">
    <arg type="s" direction="in" />
</method>
</interface>
</node>`;

const SearchProvider2Iface = `
<node>
<interface name="org.gnome.Shell.SearchProvider2">
<method name="GetInitialResultSet">
    <arg type="as" direction="in" />
    <arg type="as" direction="out" />
</method>
<method name="GetSubsearchResultSet">
    <arg type="as" direction="in" />
    <arg type="as" direction="in" />
    <arg type="as" direction="out" />
</method>
<method name="GetResultMetas">
    <arg type="as" direction="in" />
    <arg type="aa{sv}" direction="out" />
</method>
<method name="ActivateResult">
    <arg type="s" direction="in" />
    <arg type="as" direction="in" />
    <arg type="u" direction="in" />
</method>
<method name="LaunchSearch">
    <arg type="as" direction="in" />
    <arg type="u" direction="in" />
</method>
</interface>
</node>`;

const SearchProviderProxyInfo =
  Gio.DBusInterfaceInfo.new_for_xml(SearchProviderIface);
const SearchProvider2ProxyInfo =
  Gio.DBusInterfaceInfo.new_for_xml(SearchProvider2Iface);

function* collectFromDatadirs(subdir: string) {
  let dataDirs = GLib.get_system_data_dirs();

  for (let i = 0; i < dataDirs.length; i++) {
    let path = GLib.build_filenamev([dataDirs[i], "gnome-shell", subdir]);
    let dir = Gio.File.new_for_path(path);
    let fileEnum;
    try {
      fileEnum = dir.enumerate_children(
        "standard::name,standard::type",
        Gio.FileQueryInfoFlags.NONE,
        null,
      );
    } catch (e) {
      fileEnum = null;
    }
    if (fileEnum != null) {
      let info;
      while ((info = fileEnum.next_file(null)))
        yield { file: fileEnum.get_child(info), info };
    }
  }
}

interface Metas {
  id: GLib.Variant<"s">;
  name: GLib.Variant<"s">;
  icon: GLib.Variant<"(sv)">;
  gicon: GLib.Variant<"s">;
  "icon-data": GLib.Variant<"(iiibiiay)">;
  description?: GLib.Variant<"s">;
  clipboardText?: GLib.Variant<"s">;
}

interface ResultMetas {
  id: string;
  name: string;
  description: string;
  icon: Gtk.Image;
  clipboardText: string;
}

export class RemoteSearchProvider {
  declare proxy: Gio.DBusProxy;
  declare app_info: Gio.DesktopAppInfo;
  declare id: string | null;
  declare is_remote_provider: boolean;
  declare can_launch_search: boolean;
  declare default_enabled: boolean;

  constructor(
    appInfo: Gio.DesktopAppInfo,
    dbusName: string,
    dbusPath: string,
    autoStart: boolean,
    proxyInfo: any,
  ) {
    if (!proxyInfo) proxyInfo = SearchProviderProxyInfo;

    let gFlags = Gio.DBusProxyFlags.DO_NOT_LOAD_PROPERTIES;
    if (autoStart)
      gFlags |= Gio.DBusProxyFlags.DO_NOT_AUTO_START_AT_CONSTRUCTION;
    else gFlags |= Gio.DBusProxyFlags.DO_NOT_AUTO_START;

    try {
      this.proxy = Gio.DBusProxy.new_for_bus_sync(
        Gio.BusType.SESSION,
        gFlags,
        proxyInfo,
        dbusName,
        dbusPath,
        proxyInfo.name,
        null,
      );
    } catch (e) {
      logError(e);
    }

    this.app_info = appInfo;
    this.id = appInfo.get_id();
    this.is_remote_provider = true;
    this.can_launch_search = false;
  }

  // search(query: string) {
  //   const s = query.split(" ");
  //   let result: Map<string, GLib.Variant>[];
  //
  //   try {
  //     this.proxy.call(
  //       "GetInitialResultSet",
  //       new GLib.Variant("(as)", [s]),
  //       0,
  //       -1,
  //       null,
  //       (self, res) => {
  //         try {
  //           const v = self?.call_finish(res);
  //           if (v != null) {
  //             this.proxy.call(
  //               "GetResultMetas",
  //               v,
  //               0,
  //               -1,
  //               null,
  //               (self1, res) => {
  //                 try {
  //                   const v1 = self1?.call_finish(res);
  //                   if (v1 != null) {
  //                     print(
  //                       "v1 de ",
  //                       this.app_info.get_name(),
  //                       "também não é null!!!",
  //                     );
  //                     const value = v1.deep_unpack() as Metas[][];
  //
  //                     value[0].forEach((obj) => {
  //                       print(
  //                         obj.name.deep_unpack(),
  //                         "\n\t",
  //                         obj.id.deep_unpack(),
  //                         "\n\t",
  //                         obj.description?.deep_unpack(),
  //                         "\n\t",
  //                         obj.clipboardText,
  //                         "\n\t",
  //                         obj.icon.deep_unpack(),
  //                         "\n\t",
  //                         obj.gicon,
  //                         "\n\t",
  //                         obj["icon-data"],
  //                       );
  //                     });
  //                   }
  //                 } catch {}
  //               },
  //             );
  //           }
  //         } catch {}
  //       },
  //     );
  //   } catch (e) {
  //     log(`Received error from D-Bus search provider ${this.id}: ${e}`);
  //     // logError(e);
  //   }
  // }

  createIcon(meta: Metas) {
    let gicon = null;

    if (meta["icon"]) {
      gicon = Gio.icon_deserialize(meta.icon);
      if (gicon) return Gtk.Image.new_from_gicon(gicon);
    } else if (meta["gicon"]) {
      gicon = Gio.icon_new_for_string(meta.gicon.deep_unpack());
      if (gicon) return Gtk.Image.new_from_gicon(gicon);
    } else if (meta["icon-data"]) {
      const [
        width,
        height,
        rowStride,
        hasAlpha,
        bitsPerSample,
        _nChannels,
        data,
      ] = meta["icon-data"].deep_unpack() as [
        number,
        number,
        number,
        boolean,
        number,
        number,
        any,
      ];
      gicon = GdkPixbuf.Pixbuf.new_from_data(
        data,
        GdkPixbuf.Colorspace.RGB,
        hasAlpha,
        bitsPerSample,
        width,
        height,
        rowStride,
        null,
      );

      return Gtk.Image.new_from_pixbuf(gicon);
    }
  }

  async getInitialResultSet(
    terms: string[],
    cancellable: Gio.Cancellable | null,
  ): Promise<GLib.Variant | null> {
    return new Promise((resolve, _reject) => {
      this.proxy.call(
        "GetInitialResultSet",
        new GLib.Variant("(as)", [terms]),
        0,
        -1,
        cancellable,
        (self, res) => {
          try {
            const results = self?.call_finish(res);
            if (results) resolve(results);
            else resolve(null);
          } catch (error) {
            log(
              `Received error from D-Bus search provider ${this.id}: ${error}`,
            );
            resolve(null);
          }
        },
      );
    });
  }

  async getSubsearchResultSet(
    previousResults: string[],
    newTerms: string[],
    cancellable: Gio.Cancellable | null,
  ): Promise<GLib.Variant | null> {
    return new Promise((resolve, _reject) => {
      this.proxy.call(
        "GetSubsearchResultSetAsync",
        new GLib.Variant("(as,as)", [previousResults, newTerms]),
        0,
        -1,
        cancellable,
        (self, res) => {
          try {
            const results = self?.call_finish(res);
            if (results) resolve(results);
            else resolve(null);
          } catch (error) {
            log(
              `Received error from D-Bus search provider ${this.id}: ${error}`,
            );
            resolve(null);
          }
        },
      );
    });
  }

  async getResultMetas(
    ids: GLib.Variant,
    cancellable: Gio.Cancellable | null,
  ): Promise<ResultMetas[]> {
    return new Promise((resolve, _reject) => {
      this.proxy.call(
        "GetResultMetas",
        ids,
        0,
        -1,
        cancellable,
        (self, res) => {
          let metas;

          try {
            const result = self?.call_finish(res).deep_unpack() as Metas[][];
            metas = result[0];
          } catch (error) {
            log(
              `Received error from D-Bus search provider ${this.id} during GetResultMetas: ${error}`,
            );
            resolve([]);
            return;
          }

          let resultMetas = [];

          for (let i = 0; i < metas.length; i++) {
            resultMetas.push({
              id: metas[i].id.deep_unpack() as string,
              name: metas[i].name.deep_unpack() as string,
              description: metas[i].description?.deep_unpack() as string,
              icon: this.createIcon(metas[i]),
              clipboardText: metas[i].clipboardText?.deep_unpack() as string,
            } as ResultMetas);
          }
          resolve(resultMetas);
        },
      );
    });
  }

  activateResult(id: string, _terms: string[]) {
    this.proxy.call(
      "ActivateResult",
      new GLib.Variant("(s)", [id]),
      0,
      -1,
      null,
      null,
    );
  }

  launchSearch(_terms: string[]) {
    // the provider is not compatible with the new version of the interface, launch
    // the app itself but warn so we can catch the error in logs
    log(`Search provider ${this.id} does not implement LaunchSearch`);
    this.app_info.launch();
  }
}

export class RemoteSearchProvider2 extends RemoteSearchProvider {
  constructor(
    appInfo: Gio.DesktopAppInfo,
    dbusName: string,
    dbusPath: string,
    autoStart: boolean,
  ) {
    super(appInfo, dbusName, dbusPath, autoStart, SearchProvider2ProxyInfo);

    this.can_launch_search = true;
  }

  activateResult(id: string, terms: string[]) {
    try {
      this.proxy.call(
        "ActivateResult",
        new GLib.Variant("(s, as, u)", [
          id,
          terms,
          Math.floor(Date.now() / 1000),
        ]),
        0,
        -1,
        null,
        null,
      );
    } catch (e) {
      logError(e);
    }
  }

  launchSearch(terms: string[]) {
    try {
      this.proxy.call(
        "LaunchSearchAsync",
        new GLib.Variant("(as, u)", [terms, Math.floor(Date.now() / 1000)]),
        0,
        -1,
        null,
        null,
      );
    } catch (e) {
      logError(e);
    }
  }
}

export const setup_search = (search_settings: Gio.Settings) => {
  let object_paths: { [key: string]: any } = {};
  let loaded_providers: RemoteSearchProvider[] = [];

  function load_remote_search_providers(file: Gio.File) {
    const keyfile = new GLib.KeyFile();
    const path = file.get_path();

    if (!path) return;

    try {
      keyfile.load_from_file(path, 0);
    } catch {
      return;
    }

    if (!keyfile.has_group(KEY_FILE_GROUP)) return;

    let remoteProvider;
    try {
      const bus_name = keyfile.get_string(KEY_FILE_GROUP, "BusName");
      const object_path = keyfile.get_string(KEY_FILE_GROUP, "ObjectPath");

      if (object_paths[object_path]) return;

      let app_info = null;
      try {
        const desktop_id = keyfile.get_string(KEY_FILE_GROUP, "DesktopId");
        app_info = Gio.DesktopAppInfo.new(desktop_id);
        if (!app_info.should_show()) return;
      } catch (e) {
        log(`Ignoring search provider ${path}: missing DesktopId`);
        logError(e);
        return;
      }

      let autostart = true;
      try {
        autostart = keyfile.get_boolean(KEY_FILE_GROUP, "AutoStart");
      } catch {}

      let version = 1;
      try {
        version = Number(keyfile.get_string(KEY_FILE_GROUP, "Version"));
      } catch {}

      if (version >= 2)
        remoteProvider = new RemoteSearchProvider2(
          app_info,
          bus_name,
          object_path,
          autostart,
        );
      else
        remoteProvider = new RemoteSearchProvider(
          app_info,
          bus_name,
          object_path,
          autostart,
          null,
        );

      remoteProvider.default_enabled = true;
      try {
        remoteProvider.default_enabled = !keyfile.get_boolean(
          KEY_FILE_GROUP,
          "DefaultDisabled",
        );
      } catch {
        // ignore error
      }

      object_paths[object_path] = remoteProvider;
      loaded_providers.push(remoteProvider);
    } catch (e) {
      // @ts-ignore
      // logError(e, "failed to add search provider");
      log(`Failed to add search provider ${path}: ${e}`);
    }
  }

  for (const { file } of collectFromDatadirs("search-providers")) {
    // print(file.get_path());
    load_remote_search_providers(file);
  }

  const sort_order = search_settings.get_strv("sort-order");
  const disabled = search_settings.get_strv("disabled");
  const enabled = search_settings.get_strv("enabled");

  loaded_providers.filter((provider) => {
    let app_id = provider.id;
    if (!app_id) return provider.default_enabled;

    if (provider.default_enabled) return !disabled.includes(app_id);
    else return enabled.includes(app_id);
  });

  loaded_providers.sort((providerA, providerB) => {
    let idxA, idxB;

    if (!providerA.id) return 1;
    if (!providerB.id) return -1;

    idxA = sort_order.indexOf(providerA.id);
    idxB = sort_order.indexOf(providerB.id);

    // if no provider is found in the order, use alphabetical order
    if (idxA === -1 && idxB === -1) {
      let nameA = providerA.app_info.get_name();
      let nameB = providerB.app_info.get_name();

      return GLib.utf8_collate(nameA, nameB);
    }

    // if providerA isn't found, it's sorted after providerB
    if (idxA === -1) return 1;

    // if providerB isn't found, it's sorted after providerA
    if (idxB === -1) return -1;

    // finally, if both providers are found, return their order in the list
    return idxA - idxB;
  });

  return loaded_providers;
};
