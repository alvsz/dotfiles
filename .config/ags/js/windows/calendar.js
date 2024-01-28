import Widget from "resource:///com/github/Aylur/ags/widget.js";

const Calendar = () => {
  Widget.Calendar({
    showDetails: false,
    showHeading: false,
  });
};

const controlCenter = () =>
  Widget.Window({
    name: "controlCenter",
    layer: "top",
    anchor: ["top"],
    exclusivity: "ignore",
    className: "controlcenter",
    child: Widget.Box({
      children: [Calendar(), Calendar()],
    }),
  });

export default controlCenter;
