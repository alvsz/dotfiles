import { GLib, Gio } from "astal";
import { Gtk } from "astal/gtk4";
// import GdkPixbuf from "gi://GdkPixbuf?version=2.0";
import libTrem from "gi://libTrem?version=0.1";

const KEY_FILE_GROUP = "Shell Search Provider";
// const TIMEOUT = 50;

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

// export interface ResultMetas {
//   id: string;
//   name: string;
//   description: string;
//   icon: Gtk.Image;
//   clipboardText: string;
// }

export const setup_search = (search_settings: Gio.Settings) => {
  let object_paths: { [key: string]: any } = {};
  let loaded_providers: libTrem.RemoteSearchProvider[] = [];

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
      let desktop_id = null;
      try {
        desktop_id = keyfile.get_string(KEY_FILE_GROUP, "DesktopId");
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
        remoteProvider = libTrem.RemoteSearchProvider.new_v2(
          desktop_id,
          bus_name,
          object_path,
          autostart,
        );
      else
        remoteProvider = libTrem.RemoteSearchProvider.new_v1(
          desktop_id,
          bus_name,
          object_path,
          autostart,
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
      let nameA = providerA.get_name();
      let nameB = providerB.get_name();

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
