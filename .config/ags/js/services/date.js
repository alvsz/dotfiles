import GLib from "gi://GLib";
import Service from "resource:///com/github/Aylur/ags/service.js";

class DateTime extends Service {
  static {
    Service.register(
      this,
      {
        year: [],
        month: [],
        day: [],
        hour: [],
        minute: [],
        second: [],
      },
      {
        ["time"]: ["number", "r"],
      },
    );
  }

  constructor() {}
}

const service = new DateTime();

export default service;
