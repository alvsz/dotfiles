import Widget from "resource:///com/github/Aylur/ags/widget.js";

import revealer from "./Revealer.js";

const revealOnHover = ({ shown, hidden, ...rest }) => {
  let reveal = revealer(hidden);

  return Widget.EventBox({
    child: Widget.Box({
      children: [reveal, shown],
    }),
    onHover: () => {
      reveal.revealChild = true;
    },
    onHoverLost: () => {
      reveal.revealChild = false;
    },
    ...rest,
  });
};

export default revealOnHover;
