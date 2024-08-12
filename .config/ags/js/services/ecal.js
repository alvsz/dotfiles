import ECal from "gi://ECal";
import EDataServer from "gi://EDataServer";
import GLib from "gi://GLib";
import ICalGLib from "gi://ICalGLib";

globalThis.ical = ICalGLib;
globalThis.ecal = ECal;
globalThis.edataserver = EDataServer;

const main = () => {
  const registry = EDataServer.SourceRegistry.new_sync(null);
  const sources = registry.list_enabled(null);

  const location = ECal.system_timezone_get_location();

  const zone = location
    ? ICalGLib.Timezone.get_builtin_timezone(location)
    : ICalGLib.Timezone.get_utc_timezone();

  const promises = sources.map((source) => {
    if (source.has_extension("Calendar")) {
      const promise = new Promise((resolve, reject) => {
        ECal.Client.connect(
          source,
          ECal.ClientSourceType.EVENTS,
          20,
          null,
          (_, res) => {
            const client = ECal.Client.connect_finish(res);
            // print(client);

            if (client) {
              const start_date = GLib.DateTime.new_now_local().add_days(-1);
              const end_date = GLib.DateTime.new_now_local().add_days(7);

              const start = ECal.isodate_from_time_t(start_date.to_unix());
              const end = ECal.isodate_from_time_t(end_date.to_unix());

              const tz_location = zone.get_location();

              // print(start);
              // print(end);

              const sexp = `(occur-in-time-range? (make-time "${start}") (make-time "${end}") "${tz_location}")`;

              client.get_object_list_as_comps(sexp, null, (_, res2) => {
                const [ok, events] =
                  client.get_object_list_as_comps_finish(res2);
                if (!ok) {
                  resolve();
                  // print("not ok ", client);
                  // reject();
                  return;
                }
                // print(events);
                resolve(events);
              });
            } else {
              // print("não conectou no cliente ", source.display_name);
              resolve();
              // reject();
              return;
            }
          },
        );
      });
      // print(promise);
      return promise;
    }
  });

  return Promise.all(promises).then((results) => {
    // print("terminou", results.flat());
    return results.flat().filter((item) => item);
    // .filter((item) => item !== null && item !== undefined);
  });
};

export default main;

// print(source.display_name);
// print("tem eventos");
// // #9fe1e7
//
// for (const event of events) {
//   event.commit_sequence();
//
//   // print(event.summary);
//   // print(event.description);
//   // print(event.get_as_string());
//   print(event.get_summary().get_value());
//
//   const descriptions = event
//     .get_descriptions()
//     .map((d) => d.get_value());
//   const description = descriptions.join(" - ");
//   print(description);
// }
