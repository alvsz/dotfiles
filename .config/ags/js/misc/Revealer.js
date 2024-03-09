import Widget from "resource:///com/github/Aylur/ags/widget.js";

const revealer = (hidden) =>
  Widget.Revealer({
    revealChild: false,
    transitionDuration: 500,
    transition: "slide_right",
    child: hidden,
  });

export const revealOnClick = ({ shown, hidden, ...rest }) => {
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

export const revealOnHover = ({ shown, hidden, ...rest }) => {
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
