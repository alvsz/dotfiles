import goa from "./goa.js";
import googleCalendar from "./googleCalendar.js";

const accounts = goa();

export let calendars = [];

for (const account of accounts) {
  if (account.calendar.active) {
    let conta = {
      id: account.id,
      name: account.name,
      calendars: [],
    };

    if (account.type === "google") {
      conta.calendars = googleCalendar(account);
    }

    calendars.push(conta);

    // print(account.id);
  }
}
