#!/bin/sh
# Set brightness via xbrightness when redshift status changes

# Set brightness values for each status.
# Range from 1 to 100 is valid
brightness_day=80
brightness_transition=40
brightness_night=15
# Set fps for smoooooth transition
fps=1000
# Adjust this grep to filter only the backlights you want to adjust
# backlights=($(xbacklight -list | grep ddcci*))

set_brightness() {
	[ "$(xbacklight -get)" -gt "$1" ] && xbacklight -set "$1" -fps $fps &
}

set_bg() {
	if [ "$XDG_SESSION_TYPE" = "x11" ]; then
		feh --no-fehbg --bg-fill "${1}"
	else
		swww img "${1}"
	fi

}

if [ "$1" = period-changed ]; then
	case $3 in
	night)
		set_brightness $brightness_night
		# bg="$HOME/Imagens/EOS-SnowCappedMountain02.jpg"
		# set_bg "${bg}"

		#	    eww update nightlight=Ativado
		;;
	transition)
		set_brightness $brightness_transition
		#	    eww update nightlight=Ativado
		;;
	daytime)
		set_brightness $brightness_day
		# bg="$HOME/Imagens/EOS-SnowCappedMountain01.jpg"
		# set_bg "${bg}"
		#	    eww update nightlight=Desativado
		;;
	esac
fi
