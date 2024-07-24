import Widget from "resource:///com/github/Aylur/ags/widget.js";

const scrollable = ({ child, ...rest }) => {
  let scrollDirection = 1;

  const scrollSpeed = 500;

  return Widget.Scrollable({
    hscroll: "always",
    vscroll: "never",
    hscrollbar_policy: 3,
    hexpand: true,
    hpack: "fill",
    className: "bouncingText",
    child: child,
    ...rest,
  })
    .poll(50, (self) => {
      const hAdjustment = self.get_hadjustment();
      const currentValue = hAdjustment.get_value();

      let newValue = currentValue + scrollDirection * (scrollSpeed / 500);
      hAdjustment.set_value(newValue);
    })
    .on("edge-reached", () => {
      scrollDirection *= -1;
    });
};

export default scrollable;
