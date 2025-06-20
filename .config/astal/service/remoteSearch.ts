import { GLib, Gio } from "astal";

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

  search(query: string) {
    const s = query.split(" ");
    let result: Map<string, GLib.Variant>[];

    try {
      this.proxy.call(
        "GetInitialResultSet",
        new GLib.Variant("(as)", [s]),
        0,
        -1,
        null,
        (self, res) => {
          const v = self?.call_finish(res);
          if (v != null) {
            print("não é null!!!!");

            this.proxy.call("GetResultMetas", v, 0, -1, null, (self1, res) => {
              const v1 = self1?.call_finish(res);
              if (v1 != null) print("v1 também não é null!!!");
              print(v1?.deep_unpack());
            });
          }
          print(v?.deep_unpack());
        },
      );
    } catch (e) {
      log(`Received error from D-Bus search provider ${this.id}: ${e}`);
      // logError(e);
    }
  }

  // createIcon(size, meta) {
  //   let gicon = null;
  //   let icon = null;
  //
  //   if (meta["icon"]) {
  //     gicon = Gio.icon_deserialize(meta["icon"]);
  //   } else if (meta["gicon"]) {
  //     gicon = Gio.icon_new_for_string(meta["gicon"]);
  //   } else if (meta["icon-data"]) {
  //     const [
  //       width,
  //       height,
  //       rowStride,
  //       hasAlpha,
  //       bitsPerSample,
  //       nChannels_,
  //       data,
  //     ] = meta["icon-data"];
  //     gicon = Shell.util_create_pixbuf_from_data(
  //       data,
  //       GdkPixbuf.Colorspace.RGB,
  //       hasAlpha,
  //       bitsPerSample,
  //       width,
  //       height,
  //       rowStride,
  //     );
  //   }
  //
  //   if (gicon) icon = new St.Icon({ gicon, icon_size: size });
  //   return icon;
  // }

  // filterResults(results, maxNumber) {
  //   if (results.length <= maxNumber) return results;
  //
  //   let regularResults = results.filter((r) => !r.startsWith("special:"));
  //   let specialResults = results.filter((r) => r.startsWith("special:"));
  //
  //   return regularResults
  //     .slice(0, maxNumber)
  //     .concat(specialResults.slice(0, maxNumber));
  // }

  // async getInitialResultSet(terms, cancellable) {
  //   try {
  //     const [results] = await this.proxy.GetInitialResultSetAsync(
  //       terms,
  //       cancellable,
  //     );
  //     return results;
  //   } catch (error) {
  //     if (!error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
  //       log(`Received error from D-Bus search provider ${this.id}: ${error}`);
  //     return [];
  //   }
  // }

  // async getSubsearchResultSet(previousResults, newTerms, cancellable) {
  //   try {
  //     const [results] = await this.proxy.GetSubsearchResultSetAsync(
  //       previousResults,
  //       newTerms,
  //       cancellable,
  //     );
  //     return results;
  //   } catch (error) {
  //     if (!error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
  //       log(`Received error from D-Bus search provider ${this.id}: ${error}`);
  //     return [];
  //   }
  // }

  // async getResultMetas(ids, cancellable) {
  //   let metas;
  //   try {
  //     [metas] = await this.proxy.GetResultMetasAsync(ids, cancellable);
  //   } catch (error) {
  //     if (!error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
  //       log(
  //         `Received error from D-Bus search provider ${this.id} during GetResultMetas: ${error}`,
  //       );
  //     return [];
  //   }
  //
  //   let resultMetas = [];
  //   for (let i = 0; i < metas.length; i++) {
  //     for (let prop in metas[i]) {
  //       // we can use the serialized icon variant directly
  //       if (prop !== "icon") metas[i][prop] = metas[i][prop].deepUnpack();
  //     }
  //
  //     resultMetas.push({
  //       id: metas[i]["id"],
  //       name: metas[i]["name"],
  //       description: metas[i]["description"],
  //       createIcon: (size) => this.createIcon(size, metas[i]),
  //       clipboardText: metas[i]["clipboardText"],
  //     });
  //   }
  //   return resultMetas;
  // }

  // activateResult(id) {
  //   this.proxy.ActivateResultAsync(id).catch(logError);
  // }

  // launchSearch(_terms) {
  //   // the provider is not compatible with the new version of the interface, launch
  //   // the app itself but warn so we can catch the error in logs
  //   log(
  //     `Search provider ${this.appInfo.get_id()} does not implement LaunchSearch`,
  //   );
  //   this.appInfo.launch([], global.create_app_launch_context(0, -1));
  // }
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

  // activateResult(id, terms) {
  //   this.proxy
  //     .ActivateResultAsync(id, terms, global.get_current_time())
  //     .catch(logError);
  // }

  // launchSearch(terms) {
  //   this.proxy
  //     .LaunchSearchAsync(terms, global.get_current_time())
  //     .catch(logError);
  // }
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
