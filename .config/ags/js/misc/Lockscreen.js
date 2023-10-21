// import { App, Service, Utils } from "../imports.js";
import App from "resource:///com/github/Aylur/ags/app.js";
import Service from "resource:///com/github/Aylur/ags/service/service.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";

const authpy = App.configDir + "/scripts/auth.py";

class Lockscreen extends Service {
  static {
    Service.register(this, {
      lock: ["boolean"],
      authenticating: ["boolean"],
    });
  }

  lockscreen() {
    this.emit("lock", true);
  }

  auth(password) {
    this.emit("authenticating", true);
    Utils.execAsync([authpy, password])
      .then((out) => {
        this.emit("lock", out !== "True");
        this.emit("authenticating", false);
      })
      .catch(console.error);
  }
}

export default new Lockscreen();
