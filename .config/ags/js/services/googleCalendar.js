import fetch from "../misc/Fetch.js";

export default (account) => {
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
