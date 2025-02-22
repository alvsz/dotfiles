#!/bin/env sh

launch() {
	# /usr/lib/gsd-xsettings &

	agsv1 &

	astal-notifd -d &

	ags run --gtk4 -d ~/.config/astal &

	systemctl --user start gammastep-indicator

	pgrep udiskie || udiskie --tray &

	org.gnome.Geary --gapplication-service &

	pgrep swayidle || swayidle timeout 600 "astal lock" lock "astal lock" timeout 420 'dpms off' resume 'dpms on' &

	pgrep swww-daemon || swww-daemon &

	pgrep kdeconnectd || kdeconnectd &

	sleep 5
	pgrep kdeconnect-indi || kdeconnect-indicator &

	if [ "${HOSTNAME}" = "archlinux" ]; then
		# pgrep openrgb ||
		openrgb --startminimized &
		openrgb -p 'padrao'
		# openrgb -c 800080
	fi
}

# if pgrep dwl; then
# 	echo "já tem um dwl rodando"
# else
launch
# fi

# if pgrep dwl
