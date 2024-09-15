import Widget from "resource:///com/github/Aylur/ags/widget.js";

const overlay = (slider, icon) =>
  Widget.Overlay({
    child: Widget.Slider(slider),
    overlays: icon,
  });

export default overlay;
