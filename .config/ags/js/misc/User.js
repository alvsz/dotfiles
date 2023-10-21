import GLib from "gi://GLib";
import Gio from "gi://Gio";

const userId = GLib.getenv("UID");

const bus = Gio.bus_get_sync(Gio.BusType.SYSTEM, null);

const call = (prop) =>
  bus.call_sync(
    "org.freedesktop.Accounts",
    `/org/freedesktop/Accounts/User${userId ? userId : 1000}`,
    "org.freedesktop.DBus.Properties",
    "Get",
    new GLib.Variant("(ss)", ["org.freedesktop.Accounts.User", prop]),
    new GLib.VariantType("(v)"),
    Gio.DBusSendMessageFlags.NONE,
    -1,
    null,
    null,
  );

export const realName = call("RealName").recursiveUnpack().toString();
export const iconFile = call("IconFile").recursiveUnpack().toString();

// export default info;
