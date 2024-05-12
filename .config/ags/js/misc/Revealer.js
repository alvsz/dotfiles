import Widget from "resource:///com/github/Aylur/ags/widget.js";

const revealer = (hidden) =>
  Widget.Revealer({
    revealChild: false,
    transitionDuration: 500,
    transition: "slide_right",
    child: hidden,
  });

export default revealer;
