import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import App from "resource:///com/github/Aylur/ags/app.js";
import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";

import Bar from "./js/windows/bar.js";
import AppMenu from "./js/windows/appmenu.js";
import Calendar from "./js/windows/calendar.js";
import Dashboard from "./js/windows/dashboard.js";
import Polkit from "./js/windows/polkit.js";
import NetworkAgentDialog from "./js/windows/networkSecretDialog.js";

import polkitAgent from "./js/services/polkitAgent.js";
import networkAgent from "./js/services/networkAgent.js";

import { cssPath, forMonitors, scssWatcher } from "./js/utils.js";

import calendarServer from "./js/services/ecal.js";
globalThis.calendarserver = calendarServer;
globalThis.polkit = polkitAgent;
globalThis.utils = Utils;

Notifications.popupTimeout = 3000;
Notifications.cacheActions = true;

scssWatcher();

polkitAgent.connect("initiate", () => {
  App.addWindow(Polkit(polkitAgent._currentDialog));
});

networkAgent.connect("initiate", (_, dialog) => {
  App.addWindow(NetworkAgentDialog(dialog));
});

const windows = [
  // Bar(0),
  ...forMonitors(Bar),
  AppMenu(),
  Calendar(),
  Dashboard(),
];

App.config({
  style: cssPath,
  windows: windows,
});
