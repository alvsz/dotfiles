import ECal from "gi://ECal";
import EDataServer from "gi://EDataServer";
import GLib from "gi://GLib";
import ICalGLib from "gi://ICalGLib";
import Service from "resource:///com/github/Aylur/ags/service.js";

globalThis.ical = ICalGLib;
globalThis.ecal = ECal;
globalThis.edataserver = EDataServer;

class CalendarServer extends Service {
  static {
    Service.register(
      this,
      {},
      {
        ["got-clients"]: ["boolean", "r"],
        ["events"]: ["jsobject", "r"],
      },
    );
  }

  constructor() {
    super();

    this._registry = EDataServer.SourceRegistry.new_sync(null);
    this._sources = this._registry.list_enabled(null);
    this._gotClients = false;

    this._location = ECal.system_timezone_get_location();

    this._zone = this._location
      ? ICalGLib.Timezone.get_builtin_timezone(this._location)
      : ICalGLib.Timezone.get_utc_timezone();

    this._events = [];

    const promises = this._sources.map((source) => {
      if (source.has_extension("Calendar")) {
        const promise = new Promise((resolve, _) => {
          ECal.Client.connect(
            source,
            ECal.ClientSourceType.EVENTS,
            20,
            null,
            (_, res) => {
              const client = ECal.Client.connect_finish(res);

              if (client) {
                resolve(client);
              } else {
                resolve();
                return;
              }
            },
          );
        });
        return promise;
      }
    });

    Promise.all(promises).then((results) => {
      print("got clients");
      this._gotClients = true;
      this.clients = results.flat().filter((item) => item);
      this.changed("got-clients", this._gotClients);
    });
  }

  getEvents(y, m, d) {
    return new Promise((res, _) => {
      // print("teste");
      // print(this.clients);

      const promises = this.clients.map(
        (client) =>
          new Promise((resolve, _) => {
            const start_date = GLib.DateTime.new_local(y, m, d, 0, 0, 0);
            const end_date = start_date.add_days(1);

            const start = ECal.isodate_from_time_t(start_date.to_unix());
            const end = ECal.isodate_from_time_t(end_date.to_unix());

            const tz_location = this._zone.get_location();

            const sexp = `(occur-in-time-range? (make-time "${start}") (make-time "${end}") "${tz_location}")`;

            client.get_object_list_as_comps(sexp, null, (_, res) => {
              const [ok, events] = client.get_object_list_as_comps_finish(res);

              if (!ok) {
                resolve();
                return;
              }

              resolve(events);
            });
          }),
      );

      Promise.all(promises).then((results) => {
        res(results.flat().filter((item) => item));
        // results.flat().filter((item) => item);
      });
    });
  }

  setDate(y, m, d) {
    const update = () => {
      this.getEvents(y, m, d)
        .then((e) => {
          this._events = e;
          this.changed("events", this._events);
        })
        .catch((e) => print(e));
    };

    if (!this._gotClients) {
      print("não tem clients");
      new Promise((resolve) => {
        let id;
        id = this.connect("notify::got-clients", () => {
          print("teve clients");
          this.disconnect(id);
          update();
          resolve();
        });
      })
        .then(() => {
          print("terminou clientes");
        })
        .catch((e) => print(e));
      return;
    }
    // print("teste");

    update();
  }

  get events() {
    return this._events;
  }
}

const service = new CalendarServer();

export default service;

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
