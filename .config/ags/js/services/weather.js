import GWeather from "gi://GWeather";
import Geoclue from "gi://Geoclue";

function onWeatherUpdated(info) {
  let [ok, temperature] = info.get_value_apparent(
    GWeather.TemperatureUnit.DEFAULT,
  );

  // while (!ok) {
  //   info.update();
  // }

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
}

function main() {
  let simple = Geoclue.Simple.new_sync(
    "com.github.alvsz",
    Geoclue.AccuracyLevel.EXACT,
    null,
  );

  let location = simple.get_location();
  // simple.get_location_async(null, (src, res) => {
  //   let location = simple.get_location_finish(res);

  let latitude = location.latitude;
  let longitude = location.longitude;

  print(`Latitude: ${latitude}`);
  print(`Longitude: ${longitude}`);

  let world = GWeather.Location.get_world();
  let city = world.find_nearest_city(latitude, longitude);

  print(`City: ${city.get_name()}`);

  let info = GWeather.Info.new(city);

  info.set_application_id("com.github.alvsz");
  info.set_enabled_providers(GWeather.Provider.ALL);

  info.update();
  onWeatherUpdated(info);
}

export default main;
