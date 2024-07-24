import Widget from "resource:///com/github/Aylur/ags/widget.js";

const revealOnHover = ({ shown, hidden, ...rest }) => {
  let reveal = Widget.Revealer({
    revealChild: false,
    transitionDuration: 500,
    transition: "slide_right",
    child: hidden,
  });

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
