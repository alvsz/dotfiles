import Widget from "resource:///com/github/Aylur/ags/widget.js";

import revealer from "./Revealer.js";

const revealOnClick = ({ shown, hidden, ...rest }) => {
  let reveal = revealer(hidden);

  return Widget.Box({
    children: [
      reveal,
      Widget.EventBox({
        child: shown,

        onPrimaryClick: () => {
          reveal.revealChild = !reveal.revealChild;
        },
      }),
    ],
    ...rest,
  });
};

export default revealOnClick;
