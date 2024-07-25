import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { lookUpIcon } from "resource:///com/github/Aylur/ags/utils.js";

const notificationIcon = ({ appEntry, appIcon, image }) => {
  let icon = "dialog-information-symbolic";

  if (image) {
    icon = image;
  } else if (lookUpIcon(appIcon)) {
    icon = appIcon;
  } else if (lookUpIcon(appEntry)) {
    icon = appEntry;
  }

  return Widget.Box({
    vpack: "start",
    hexpand: false,
    className: "icon",
    // style: `
    //         min-width: 78px;
    //         min-height: 78px;
    //     `,
    children: [
      Widget.Icon({
        icon,
        // size: 58,
        hpack: "center",
        hexpand: true,
        vpack: "center",
        vexpand: true,
        className: "appIcon",
      }),
    ],
  });
};

export default notificationIcon;
