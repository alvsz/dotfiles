#!/bin/env sh

/usr/lib/polkit-gnome/polkit-gnome-authentication-agent-1 &
/usr/lib/gsd-xsettings &

# ags &

while true; do
	ags &
	inotifywait -rqe create,modify ~/.config/ags/js
	ags -q
	wait $!
done &

# / "sh", "-c", "eww daemon", NULL,
# / "eww", "open", "bar-wayland", NULL,

systemctl --user start gammastep-indicator
# / "systemctl", "--user", "start", "notif-log", NULL,

org.gnome.Geary --gapplication-service &

# / "sh", "-c", "xss-lock -- bloqueador", NULL,

# swayidle -w lock 'bloqueador' timeout 720 'bloqueador' timeout 420 'dpms off' resume 'dpms on'", NULL,

# sh", "-c", "scratchpad vdirsyncer sync", NULL,

swww init

# waypaper --restore

# / "sh", "-c", "swww img $HOME/Imagens/EOS-SnowCappedMountain02.jpg", NULL,

/usr/lib/kdeconnectd &

sleep 5
kdeconnect-indicator &

if [ "${HOSTNAME}" = "archlinux" ]; then
	polychromatic-tray-applet &
	openrgb --startminimized &
fi
