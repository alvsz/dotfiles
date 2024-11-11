#!/bin/env sh

# /usr/lib/gsd-xsettings &

ags &

systemctl --user start gammastep-indicator

pgrep udiskie || udiskie --tray &

org.gnome.Geary --gapplication-service &

pgrep swayidle || swayidle timeout 420 'dpms off' resume 'dpms on' &

pgrep swww-daemon || swww-daemon &

pgrep kdeconnectd || kdeconnectd &

sleep 5
pgrep kdeconnect-indi || kdeconnect-indicator &

if [ "${HOSTNAME}" = "archlinux" ]; then
	pgrep openrgb || openrgb --startminimized &
	# openrgb -p 'padrao'
	# openrgb -c 800080
fi
