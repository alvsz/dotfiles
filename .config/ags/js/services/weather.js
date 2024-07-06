import GWeather from "gi://GWeather";
import Geoclue from "gi://Geoclue";
import Gtk from "gi://Gtk";

const app = Gtk.Application.get_default();

const onLocationUpdate = (latitude, longitude, info) => {
  let world = GWeather.Location.get_world();
  let city = world.find_nearest_city(latitude, longitude);

  if (city != null) {
    info.location = city;
    info.update();
  }
};

let simple = new Geoclue.Simple();
const info = new GWeather.Info();

Geoclue.Simple.new(
  app.application_id,
  Geoclue.AccuracyLevel.EXACT,
  null,
  (_, res) => {
    simple = Geoclue.Simple.new_finish(res);

    const location = simple.get_location();

    const latitude = location.latitude;
    const longitude = location.longitude;

    let world = GWeather.Location.get_world();
    let city = world.find_nearest_city(latitude, longitude);

    info.set_location(city);

    simple.location.connect("notify", (self) => {
      onLocationUpdate(self.latitude, self.longitude, info);
    });

    info.set_contact_info("joao.aac@disroot.org");

    info.update();
  },
);

export default info;
