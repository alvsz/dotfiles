import GWeather from "gi://GWeather";
import Geoclue from "gi://Geoclue";
import Gtk from "gi://Gtk";

const app = Gtk.Application.get_default();

const onWeatherUpdated = (info) => {
  let [ok, temperature] = info.get_value_apparent(
    GWeather.TemperatureUnit.DEFAULT,
  );

  let tempSummary = info.get_temp_summary();
  let weatherSummary = info.get_weather_summary();
  let conditions = info.get_conditions();
  let temp = info.get_temp();
  let humidity = info.get_humidity();

  print(`Temperature ok: ${ok}`);
  print(`Temperature: ${temperature}°C`);
  print(`Temperature Summary: ${tempSummary}`);
  print(`Weather Summary: ${weatherSummary}`);
  print(`Conditions: ${conditions}`);
  print(`Temperature: ${temp}°C`);
  print(`Humidity: ${humidity}%`);
};

const onLocationUpdate = (latitude, longitude, info) => {
  let world = GWeather.Location.get_world();
  let city = world.find_nearest_city(latitude, longitude);

  if (city != null) {
    info.location = city;
    info.update();
  }
};

function main() {
  let simple = Geoclue.Simple.new_sync(
    app.application_id,
    Geoclue.AccuracyLevel.EXACT,
    null,
  );

  let location = simple.get_location();

  let latitude = location.latitude;
  let longitude = location.longitude;

  print(`Latitude: ${latitude}`);
  print(`Longitude: ${longitude}`);

  let world = GWeather.Location.get_world();
  let city = world.find_nearest_city(latitude, longitude);

  print(`City: ${city.get_name()}`);

  let info = GWeather.Info.new(city);

  info.set_enabled_providers(GWeather.Provider.ALL);
  info.contact_info = "joao.aac@disroot.org";
  info.update();

  info.connect("updated", (self) => {
    onWeatherUpdated(self);
  });

  simple.location.connect("notify", (self) => {
    onLocationUpdate(self.latitude, self.longitude, info);
  });

  return info;
}

export default main();
