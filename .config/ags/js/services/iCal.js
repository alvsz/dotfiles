import goaClient from "./goaClient.js";
// import teste from "./googleCalendar.js";

const googleCalendar = (account) => {
  let calendars = [];

  if (!account.auth.oauth2[0]) {
    return [];
  }

  const calendarList = fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    {
      headers: {
        Authorization: "Bearer " + account.auth.oauth2[1],
      },
    },
  );
  print(calendarList.text());

  return calendars;
};

const accounts = goaClient();

export let iCal = [];

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

    iCal.push(conta);

    // print(account.id);
  }
}
