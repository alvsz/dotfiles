import Widget from "resource:///com/github/Aylur/ags/widget.js";

const revealOnClick = ({ shown, hidden, ...rest }) => {
  let reveal = Widget.Revealer({
    revealChild: false,
    transitionDuration: 500,
    transition: "slide_right",
    child: hidden,
  });

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
