import GWeather from "gi://GWeather";
import Geoclue from "gi://Geoclue";
import Gtk from "gi://Gtk";
import Service from "resource:///com/github/Aylur/ags/service.js";

const app = Gtk.Application.get_default();

class Weather extends Service {
  static {
    Service.register(
      this,
      {
        // signals
        ["location-updated"]: ["float", "float"],
        ["weather-updated"]: [],
      },
      {
        // properties
        ["available"]: ["boolean", "r"],
        ["latitude"]: ["float", "r"],
        ["longitude"]: ["float", "r"],
        ["city-name"]: ["string", "r"],

        ["is-daytime"]: ["boolean", "r"],
        ["wind"]: ["string", "r"],
        ["sky"]: ["string", "r"],
        ["last-updated"]: ["string", "r"],
        ["temp"]: ["string", "r"],
        ["temp-summary"]: ["string", "r"],
        ["temp-min"]: ["string", "r"],
        ["temp-max"]: ["string", "r"],
        ["sunrise"]: ["string", "r"],
        ["sunset"]: ["string", "r"],
        ["icon-name"]: ["string", "r"],
        ["humidity"]: ["string", "r"],
      },
    );
  }

  _onLocationUpdate(location) {
    // print("location mudou");
    this.emit("location-updated", location.latitude, location.longitude);

    this._latitude = location.latitude;
    this.changed("latitude");
    this._longitude = location.longitude;
    this.changed("longitude");

    const world = GWeather.Location.get_world();
    const city = world.find_nearest_city(location.latitude, location.longitude);

    if (city != null) {
      this._city_name = city.get_name();
      this.changed("city-name");

      this._info.set_location(city);
      this._info.update();
    }
  }

  _onWeatherUpdate(info) {
    // print("weather mudou");
    const network_error = info.network_error();
    this._available = !network_error;
    this.changed("available");

    if (network_error) return;

    this.emit("weather-updated");

    this._is_daytime = info.is_daytime();
    this.changed("is-daytime");

    this._wind = info.get_wind();
    this.changed("wind");

    this._sky = info.get_sky();
    this.changed("sky");

    this._last_updated = info.get_update();
    this.changed("last-updated");

    this._temp = info.get_temp();
    this.changed("temp");

    this._temp_summary = info.get_temp_summary();
    this.changed("temp-summary");

    this._temp_min = info.get_temp_min();
    this.changed("temp-min");

    this._temp_max = info.get_temp_max();
    this.changed("temp-max");

    this._sunrise = info.get_sunrise();
    this.changed("sunrise");

    this._sunset = info.get_sunset();
    this.changed("sunset");

    this._icon_name = info.get_icon_name();
    this.changed("icon-name");

    this._humidity = info.get_humidity();
    this.changed("humidity");
  }

  constructor() {
    super();

    this._available = false;
    this.changed("available");

    this._latitude = 0;
    this._longitude = 0;
    this._city_name = "";
    this._is_daytime = false;
    this._wind = "";
    this._sky = "";
    this._last_updated = "";
    this._temp = "";
    this._temp_summary = "";
    this._temp_min = "";
    this._temp_max = "";
    this._sunrise = "";
    this._sunset = "";
    this._icon_name = "";
    this._humidity = "";

    this._info = new GWeather.Info();
    this._info.set_contact_info("joao.aac@disroot.org");

    this._info.connect("updated", this._onWeatherUpdate.bind(this));

    Geoclue.Simple.new(
      app.application_id,
      Geoclue.AccuracyLevel.EXACT,
      null,
      (_, res) => {
        this._simple = Geoclue.Simple.new_finish(res);
        this._location = this._simple.get_location();

        this._location.connect("notify", this._onLocationUpdate.bind(this));

        this._onLocationUpdate(this._location);
      },
    );
  }

  get available() {
    return this._available;
  }

  get longitude() {
    return this._longitude;
  }

  get latitude() {
    return this._latitude;
  }

  get city_name() {
    return this._city_name;
  }

  get is_daytime() {
    return this._is_daytime;
  }

  get wind() {
    return this._wind;
  }

  get sky() {
    return this._sky;
  }

  get last_updated() {
    return this._last_updated;
  }

  get temp() {
    return this._temp;
  }

  get temp_summary() {
    return this._temp_summary;
  }

  get temp_min() {
    return this._temp_min;
  }

  get temp_max() {
    return this._temp_max;
  }

  get sunrise() {
    return this._sunrise;
  }

  get sunset() {
    return this._sunset;
  }

  get icon_name() {
    return this._icon_name;
  }

  get humidity() {
    return this._humidity;
  }
}

const service = new Weather();

export default service;
