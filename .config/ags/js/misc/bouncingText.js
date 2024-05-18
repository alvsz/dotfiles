import Widget from "resource:///com/github/Aylur/ags/widget.js";

const scrollable = (widget, scrollSpeed) => {
  let running = true;
  let scrollDirection = 1;

  if (!scrollSpeed) {
    scrollSpeed = 200;
  }

  return (
    Widget.Scrollable({
      hscroll: "always",
      vscroll: "never",
      hscrollbar_policy: 3,
      hexpand: true,
      hpack: "fill",
      className: "bouncingText",
      child: widget,
    })
      .poll(50, (self) => {
        const hAdjustment = self.get_hadjustment();
        const currentValue = hAdjustment.get_value();

        let newValue = currentValue + scrollDirection * (scrollSpeed / 200); // Adjust the scroll speed by changing this value
        hAdjustment.set_value(newValue);
      })
      // .on("draw", (self) => {
      // setTimeout(() => {
      //
      //   // self.queue_draw();
      // }, 100);
      // })
      .on("edge-reached", () => {
        scrollDirection *= -1;
      })
      .on("destroy", () => {
        running = false;
      })
  );
};

export default scrollable;
