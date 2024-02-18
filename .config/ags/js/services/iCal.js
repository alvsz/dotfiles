import goaClient from "./goaClient.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
// import Fetch from "resource:///com/github/Aylur/ags/utils.js";
// import teste from "./googleCalendar.js";

async function googleCalendar(account) {
  if (!account.auth.oauth2[0]) {
    return [];
  }

  let calendars = [];

  const calendarList = await Utils.fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    {
      headers: {
        Authorization: "Bearer " + account.auth.oauth2[1],
      },
    },
  );
  // .then((res) => res.text())
  // .then(print);

  print(calendarList);
  calendars.push(calendarList);

  return calendars;
}

const accounts = goaClient();

let iCal = [];

for (const account of accounts) {
  if (account.calendar.active) {
    let conta = {
      id: account.id,
      name: account.name,
      calendars: [],
    };

    if (account.type === "google") {
      conta.calendars = await googleCalendar(account);
      print(conta.calendars);
      // print("teste");
    }

    iCal.push(conta);

    // print(account.id);
  }
}

export default iCal;

// globalThis.ical = iCal;
//
// export default teste = "";
