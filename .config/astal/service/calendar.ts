import EDataServer from "gi://EDataServer";
import ECal from "gi://ECal";
import ICalGLib from "gi://ICalGLib";
import {
  CollectionTypeService,
  Collection,
  CollectionObject,
} from "./evolutionDataServer.js";
import { register } from "astal/gobject";

async function _createObject(
  client: ECal.Client,
  icalcomp: ICalGLib.Component,
  flags: ECal.OperationFlags,
) {
  return new Promise((resolve, reject) => {
    client.create_object(icalcomp, flags, null, (client, res) => {
      try {
        // @ts-ignore
        resolve(client.create_object_finish(res));
      } catch (e) {
        reject(e);
      }
    });
  });
}

@register({
  GTypeName: "Event",
})
class Event extends CollectionObject {
  constructor(source: ECal.Component, client: ECal.Client) {
    super(source, client);
  }
}

interface newEvent {
  summary: string;
  description: string;
  location: string;
  dtstart: Date;
  dtend: Date;
  priority: number;
}

@register({
  GTypeName: "EventList",
})
class EventList extends Collection {
  constructor(source: EDataServer.Source) {
    super(source, ECal.ClientSourceType.EVENTS);
  }

  // TODO: handle recurrence
  async getEventsInRange(start: Date, end: Date) {
    return this.queryObjects(
      `(occur-in-time-range? 
            (make-time "${ECal.isodate_from_time_t(start.getTime() / 1000)}")
            (make-time "${ECal.isodate_from_time_t(end.getTime() / 1000)}"))`,
    ).then((events) => events.map((ecal) => new Event(ecal, this._client)));
  }

  createEvent({
    summary,
    description,
    location,
    dtstart,
    dtend,
    priority,
  }: newEvent) {
    //there is most likely a better way, but I'm currently too stupid to see it.
    const icalcomp = ICalGLib.Component.new_vtodo();
    const timezone =
      ECal.util_get_system_timezone() || ICalGLib.Timezone.get_utc_timezone();
    if (summary) icalcomp.add_property(ICalGLib.Property.new_summary(summary));
    if (description)
      icalcomp.add_property(ICalGLib.Property.new_description(description));
    if (location)
      icalcomp.add_property(ICalGLib.Property.new_location(location));
    if (priority)
      icalcomp.add_property(ICalGLib.Property.new_priority(priority));
    if (dtend) {
      const dtend_time = ICalGLib.Time.new_from_timet_with_zone(
        // @ts-ignore
        dtend.getTime() / 1000,
        0,
        timezone,
      );
      dtend_time.set_timezone(timezone);
      icalcomp.add_property(ICalGLib.Property.new_dtend(dtend_time));
    }
    if (dtstart) {
      const dtstart_time = ICalGLib.Time.new_from_timet_with_zone(
        // @ts-ignore
        dtstart.getTime() / 1000,
        0,
        timezone,
      );
      dtstart_time.set_timezone(timezone);
      icalcomp.add_property(ICalGLib.Property.new_dtstart(dtstart_time));
    }
    return _createObject(this._client, icalcomp, ECal.OperationFlags.NONE);
  }
}

@register({
  GTypeName: "CalendarService",
})
export class CalendarService extends CollectionTypeService {
  constructor() {
    super("calendar", EventList);
  }

  get calendars() {
    return this.collections as EventList[];
  }
}

const calendarService = new CalendarService();
export default calendarService;
