import GWeather from "gi://GWeather";
import Geoclue from "gi://Geoclue";
import { App } from "astal/gtk4";
import { GObject, property, register, signal } from "astal/gobject";

@register({
  GTypeName: "Weather",
})
export default class Weather extends GObject.Object {
  declare _available: boolean;
  declare _latitude: number;
  declare _longitude: number;
  declare _city_name: string | null;

  declare _is_daytime: boolean;
  declare _wind: string;
  declare _sky: string;
  declare _last_updated: string;
  declare _temp: string;
  declare _temp_summary: string;
  declare _temp_min: string;
  declare _temp_max: string;
  declare _sunrise: string;
  declare _sunset: string;
  declare _icon_name: string;
  declare _humidity: string;
  declare _pressure: string;

  declare _info: GWeather.Info;
  declare _simple: Geoclue.Simple;
  declare _location: Geoclue.Location | null;

  @property(String) get available() {
    return this._available;
  }
  @property(Number) get longitude() {
    return this._longitude;
  }

  @property(Number) get latitude() {
    return this._latitude;
  }

  @property(String) get city_name() {
    return this._city_name;
  }

  @property(Boolean) get is_daytime() {
    return this._is_daytime;
  }

  @property(String) get wind() {
    return this._wind;
  }

  @property(String) get sky() {
    return this._sky;
  }

  @property(String) get last_updated() {
    return this._last_updated;
  }

  @property(String) get temp() {
    return this._temp;
  }

  @property(String) get temp_summary() {
    return this._temp_summary;
  }

  @property(String) get temp_min() {
    return this._temp_min;
  }

  @property(String) get temp_max() {
    return this._temp_max;
  }

  @property(String) get sunrise() {
    return this._sunrise;
  }

  @property(String) get sunset() {
    return this._sunset;
  }

  @property(String) get icon_name() {
    return this._icon_name;
  }

  @property(String) get humidity() {
    return this._humidity;
  }

  @property(String) get pressure() {
    return this._pressure;
  }

  @signal(Number, Number) declare location_updated: (
    a: number,
    b: number,
  ) => void;
  @signal() declare weather_updated: () => void;

  _onLocationUpdate(location: Geoclue.Location | null) {
    if (!location) return;
    this.emit("location-updated", location.latitude, location.longitude);

    this._latitude = location.latitude;
    this.notify("latitude");
    this._longitude = location.longitude;
    this.notify("longitude");

    const world = GWeather.Location.get_world();
    if (!world) return;
    const city = world.find_nearest_city(location.latitude, location.longitude);

    if (city != null) {
      this._city_name = city.get_name();
      this.notify("city-name");

      this._info.set_location(city);
      this._info.update();
    }
  }

  _onWeatherUpdate(info: GWeather.Info) {
    const network_error = info.network_error();
    this._available = !network_error;
    this.notify("available");

    if (network_error) return;

    this._is_daytime = info.is_daytime();
    this.notify("is-daytime");

    this._wind = info.get_wind();
    this.notify("wind");

    this._sky = info.get_sky();
    this.notify("sky");

    this._last_updated = info.get_update();
    this.notify("last-updated");

    this._temp = info.get_temp();
    this.notify("temp");

    this._temp_summary = info.get_temp_summary();
    this.notify("temp-summary");

    this._temp_min = info.get_temp_min();
    this.notify("temp-min");

    this._temp_max = info.get_temp_max();
    this.notify("temp-max");

    this._sunrise = info.get_sunrise();
    this.notify("sunrise");

    this._sunset = info.get_sunset();
    this.notify("sunset");

    this._icon_name = info.get_icon_name();
    this.notify("icon-name");

    this._humidity = info.get_humidity();
    this.notify("humidity");

    this._pressure = info.get_pressure();
    this.notify("pressure");

    this.emit("weather-updated");
  }

  constructor() {
    super();

    this._available = false;
    this.notify("available");

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
    this._pressure = "";

    this._info = new GWeather.Info({
      application_id: App.application_id,
      contact_info: "joao.aac@disroot.org",
      enabled_providers:
        GWeather.Provider.METAR |
        GWeather.Provider.MET_NO |
        GWeather.Provider.OWM,
    });

    this._info.connect("updated", this._onWeatherUpdate.bind(this));

    Geoclue.Simple.new(
      App.application_id,
      Geoclue.AccuracyLevel.EXACT,
      null,
      (_, res) => {
        this._simple = Geoclue.Simple.new_finish(res);
        this._location = this._simple.get_location();

        if (!this._location) return;

        this._location.connect("notify", this._onLocationUpdate.bind(this));
        this._onLocationUpdate(this._location);
      },
    );
  }
}
