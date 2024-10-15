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

    const promises = this._sources.flatMap((source) => {
      if (source.has_extension("Calendar")) {
        return [
          ECal.ClientSourceType.EVENTS,
          ECal.ClientSourceType.TASKS,
          ECal.ClientSourceType.MEMOS,
        ].map(
          (type) =>
            new Promise((resolve, _) => {
              ECal.Client.connect(source, type, 20, null, (_, res) => {
                try {
                  const client = ECal.Client.connect_finish(res);

                  if (client) {
                    resolve(client);
                  } else {
                    resolve();
                    return;
                  }
                } catch (e) {
                  logError(e);
                  resolve();
                }
              });
            }),
        );
      }
    });

    Promise.all(promises).then((results) => {
      this._gotClients = true;
      this.clients = results.flat().filter((item) => item);
      this.changed("got-clients", this._gotClients);
    });
  }

  eventToObject(event) {
    event.event.commit_sequence();

    const ical = event.event.get_icalcomponent();
    const source = event.client.get_source();
    const calendar = source.get_extension("Calendar");

    const summary = event.event.get_summary()?.get_value();
    const location = event.event.get_location();
    const dtstart = event.event.get_dtstart().get_value();
    const dtend = event.event.get_dtend().get_value();

    const start_y = dtstart.get_year();
    const start_m = dtstart.get_month();
    const start_d = dtstart.get_day();
    const start_h = dtstart.get_hour();
    const start_min = dtstart.get_minute();
    const start_sec = dtstart.get_second();

    const end_y = dtend.get_year();
    const end_m = dtend.get_month();
    const end_d = dtend.get_day();
    const end_h = dtend.get_hour();
    const end_min = dtend.get_minute();
    const end_sec = dtend.get_second();

    const start = dtstart.as_timet();
    const end = dtend.as_timet();

    const color = ical.get_first_property(118)?.get_value_as_string();
    const source_color = calendar.color;

    const whole_day =
      start_h === 0 &&
      end_h === 0 &&
      start_min === 0 &&
      end_min === 0 &&
      start_sec === 0 &&
      end_sec === 0;

    const single_day = whole_day
      ? end - start === 86400
      : start_y === end_y && start_m === end_m && start_d === end_d;

    return {
      summary: summary,
      location: location,
      start: start,
      end: end,
      single_day: single_day,
      whole_day: whole_day,
      color: color ? color : source_color,
      _event: event.event,
      _source: source,
      _calendar: calendar,
    };
  }

  getEvents(y, m, d) {
    return new Promise((res, _) => {
      const start_date = GLib.DateTime.new_utc(y, m, d, 0, 0, 0);
      const end_date = start_date.add_full(0, 0, 0, 23, 59, 59);

      const start = ECal.isodate_from_time_t(start_date.to_unix());
      const end = ECal.isodate_from_time_t(end_date.to_unix());

      const tz_location = this._zone.get_location();

      const sexp = `(occur-in-time-range? (make-time "${start}") (make-time "${end}") "${tz_location}")`;

      const promises = this.clients.map(
        (client) =>
          new Promise((resolve, _) => {
            client.get_object_list_as_comps(sexp, null, (_, res) => {
              const [ok, events] = client.get_object_list_as_comps_finish(res);

              if (!ok) {
                resolve();
                return;
              }

              resolve({ client: client, events: events });
            });
          }),
      );

      Promise.all(promises)
        .then((results) => {
          res(
            results
              .filter((item) => item)
              .flatMap((item) =>
                item.events
                  .filter((event) => event)
                  .map((event) => ({
                    event: event,
                    client: item.client,
                  })),
              ),
          );
        })
        .catch((e) => print(e));
    });
  }

  setDate(y, m, d) {
    const update = () => {
      this.getEvents(y, m, d)
        .then((e) => {
          this._events = e.map(this.eventToObject);
          this.changed("events");
        })
        .catch((e) => print(e));
    };

    if (!this._gotClients) {
      new Promise((resolve) => {
        let id;
        id = this.connect("notify::got-clients", () => {
          this.disconnect(id);
          update();
          resolve();
        });
      }).catch((e) => print(e));
      return;
    }

    update();
  }

  get events() {
    return this._events;
  }
}

const service = new CalendarServer();

export default service;
