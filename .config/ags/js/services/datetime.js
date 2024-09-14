import GLib from "gi://GLib";
import Service from "resource:///com/github/Aylur/ags/service.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";

class DateTime extends Service {
  static {
    Service.register(
      this,
      {
        year: ["int"],
        month: ["int"],
        day: ["int"],
        hour: ["int"],
        minute: ["int"],
        second: [],
      },
      {
        ["time"]: ["number", "r"],
      },
    );
  }

  constructor() {
    super();

    this._year = 0;
    this._month = 0;
    this._day = 0;
    this._hour = 0;
    this._minute = 0;

    this._old_year = 0;
    this._old_month = 0;
    this._old_day = 0;
    this._old_hour = 0;
    this._old_minute = 0;

    const update = () => {
      this._old_year = this._year;
      this._old_month = this._month;
      this._old_day = this._day;
      this._old_hour = this._hour;
      this._old_minute = this._minute;

      this._datetime = GLib.DateTime.new_now_local();

      [this._year, this._month, this._day] = this._datetime.get_ymd();

      this._hour = this._datetime.get_hour();
      this._minute = this._datetime.get_minute();

      if (this._old_year != this._year) this.emit("year", this._year);
      if (this._old_month != this._month) this.emit("month", this._month);
      if (this._old_day != this._day) this.emit("day", this._day);
      if (this._old_hour != this._hour) this.emit("hour", this._hour);
      if (this._old_minute != this._minute) this.emit("minute", this._minute);

      this.emit("second");
      this.changed("time");
    };

    update();

    const source = setInterval(update, 1000);
  }

  format(code) {
    return this._datetime.format(code);
  }

  get time() {
    return this._datetime.get_microsecond();
  }
}

const service = new DateTime();

export default service;
