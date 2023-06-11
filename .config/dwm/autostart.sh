#!/bin/env sh

pgrep polkit-gnome-au || /usr/lib/polkit-gnome/polkit-gnome-authentication-agent-1 &

#pgrep xss-lock || xss-lock -- xlock -username "Usuário: " -password "Senha: " -info "Digite a senha para desbloquar; clique no ícone para bloquear." -validate "Validando senha..." -invalid "Senha inválida." -startCmd "polychromatic-cli -o none; openrgb -p off" -endCmd "polychromatic-cli -o spectrum; openrgb -p normal" &

pgrep xss-lock || xss-lock -- bloquador &

# pgrep light-locker || light-locker no-lock-on-lid &

pgrep picom || picom -b --config ~/.config/picom/picom.conf &

# pgrep xsettingsd || xsettingsd -c ~/.config/xsettingsd/xsettingsd.conf &
pgrep gsd-xsettings || /usr/lib/gsd-xsettings &

pgrep wired || wired -r &

#pgrep dwmblocks || dwmblocks &

# pgrep kdeconnectd || flatpak run --branch=master --arch=x86_64 --command=/app/lib/libexec/kdeconnectd org.kde.kdeconnect &
# pgrep kdeconnect-indi || flatpak run --branch=master --arch=x86_64 --command=kdeconnect-indicator org.kde.kdeconnect &

# pgrep kdeconnectd || ~/.nix-profile/libexec/kdeconnectd &
#
pgrep kdeconnectd || /usr/lib/kdeconnectd &
pgrep kdeconnect-indi || kdeconnect-indicator &

# pgrep polychromatic-t || polychromatic-tray-applet &

pgrep geary || flatpak run --command=geary org.gnome.Geary --gapplication-service &

# pgrep eww || eww daemon

# pgrep notif-log || notif-log &

# pgrep notif-log.py ||
# notif-log.py | jq -c --unbuffered | while read line; do notif-log.lua $line; done &

systemctl --user start notif-log
systemctl --user start redshift

scratchpad vdirsyncer sync
