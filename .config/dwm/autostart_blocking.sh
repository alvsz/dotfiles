#!/bin/bash

# xrandr --output eDP1 --primary --mode 1920x1080 --pos 0x0 --rotate normal --output HDMI1 --mode 1920x1080i --pos 1920x0 --rotate normal --output VIRTUAL1 --off
# dbus-update-activation-environment --systemd DBUS_SESSION_BUS_ADDRESS DISPLAY XAUTHORITY
feh --no-fehbg --bg-fill "$HOME/Imagens/EOS-SnowCappedMountain02.jpg"
# xwinwrap -nf -ov -fs -- mpv --wid=%WID "$HOME/Imagens/out.gif" --no-osc --osd-level=0 --no-config --loop=inf --hwdec=auto &
# eval $(gnome-keyring-daemon --start)
# export SSH_AUTH_SOCK
