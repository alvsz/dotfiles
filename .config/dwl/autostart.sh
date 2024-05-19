#!/bin/env sh

/usr/lib/polkit-gnome/polkit-gnome-authentication-agent-1 &
/usr/lib/gsd-xsettings &

ags &

systemctl --user start gammastep-indicator

org.gnome.Geary --gapplication-service &

swayidle timeout 420 'dpms off' resume 'dpms on' &

swww init

/usr/lib/kdeconnectd &

spotify_player -d

sleep 5
kdeconnect-indicator &

if [ "${HOSTNAME}" = "archlinux" ]; then
	polychromatic-tray-applet &
	openrgb --startminimized &
	# openrgb -p 'padrao'
	# openrgb -c 800080
fi
