#!/bin/sh
# Default programs:
export EDITOR="nvim"
export ALTERNATE_EDITOR="emacs"
export TERMINAL="alacritty"
export BROWSER="firefox"
export EXPLORER="nautilus -w"
export EMAIL="org.gnome.Geary"
export CALCULATOR="qalculate-qt"
export CALENDAR="gnome-calendar"
 
export XDG_CONFIG_HOME="$HOME/.config"
export XDG_DATA_HOME="$HOME/.local/share"
export XDG_CACHE_HOME="$HOME/.cache"
export XDG_STATE_HOME="$HOME/.local/state"
 
export QT_QPA_PLATFORMTHEME="qt6ct"
export ZDOTDIR="$XDG_CONFIG_HOME/zsh"
export HISTFILE="$XDG_DATA_HOME/history"
export PATH="$HOME/.local/bin:$PATH"
export SAL_USE_VCLPLUGIN=gtk3
# export GTK2_RC_FILES="/usr/share/themes/Graphite-purple-Dark/gtk-2.0/gtkrc"
 
# ~/ Clean-up:
export ANDROID_HOME="$XDG_DATA_HOME/android"
export CARGO_HOME="$XDG_DATA_HOME/cargo"
export CUDA_CACHE_PATH="$XDG_CACHE_HOME/nv"
export GNUPGHOME="$XDG_DATA_HOME/gnupg"
export _JAVA_OPTIONS="-Djava.util.prefs.userRoot=$XDG_CONFIG_HOME/java"
export RUSTUP_HOME="$XDG_DATA_HOME/rustup"
export WINEPREFIX="$XDG_DATA_HOME/wine/default"
export NPM_CONFIG_USERCONFIG="$XDG_CONFIG_HOME/npm/npmrc"
export XINITRC="$XDG_CONFIG_HOME/X11/xinitrc"
export PERL_CPANM_HOME="$XDG_CACHE_HOME/cpanm"

# export MOZ_DRM_DEVICE="/dev/dri/by-path/pci-0000:$(lspci | grep -E '(VGA|3D).*Intel' | awk '{print $1}')-render"
# export SDL_GAMECONTROLLERCONFIG="030000007e0500000920000000026803,Nintendo Switch Pro Controller,a:b1,b:b0,back:b4,dpdown:b12,dpleft:b13,dpright:b14,dpup:b11,guide:b5,leftshoulder:b9,leftstick:b7,lefttrigger:a4,leftx:a0,lefty:a1,rightshoulder:b10,rightstick:b8,righttrigger:a5,rightx:a2,righty:a3,start:b6,x:b3,y:b2,platform:Linux,
# 030000007e0500000920000011810000,Nintendo Switch Pro Controller,a:b0,b:b1,back:b9,dpdown:h0.4,dpleft:h0.8,dpright:h0.2,dpup:h0.1,guide:b11,leftshoulder:b5,leftstick:b12,lefttrigger:b7,leftx:a0,lefty:a1,misc1:b4,rightshoulder:b6,rightstick:b13,righttrigger:b8,rightx:a2,righty:a3,start:b10,x:b3,y:b2,platform:Linux,
# 050000007e0500000920000001000000,Nintendo Switch Pro Controller,a:b0,b:b1,back:b8,dpdown:h0.4,dpleft:h0.8,dpright:h0.2,dpup:h0.1,guide:b12,leftshoulder:b4,leftstick:b10,lefttrigger:b6,leftx:a0,lefty:a1,misc1:b13,rightshoulder:b5,rightstick:b11,righttrigger:b7,rightx:a2,righty:a3,start:b9,x:b2,y:b3,platform:Linux,
# 050000007e0500000920000001800000,Nintendo Switch Pro Controller,a:b0,b:b1,back:b9,dpdown:h0.4,dpleft:h0.8,dpright:h0.2,dpup:h0.1,guide:b11,leftshoulder:b5,leftstick:b12,lefttrigger:b7,leftx:a0,lefty:a1,misc1:b4,rightshoulder:b6,rightstick:b13,righttrigger:b8,rightx:a2,righty:a3,start:b10,x:b3,y:b2,platform:Linux,
# 0500b4d2ac0500002d0200001b010000,Gamesir-G3s,platform:Linux,a:b0,b:b1,x:b3,y:b4,dpleft:h0.8,dpright:h0.2,dpup:h0.1,dpdown:h0.4,leftx:a0,lefty:a1,leftstick:b13,rightx:a2,righty:a3,rightstick:b14,leftshoulder:b6,lefttrigger:a5,rightshoulder:b7,righttrigger:a4,back:b10,start:b11,guide:b33,
# 05000000ac0500002d0200001b010000,Gamesir-G3s,platform:Linux,a:b0,b:b1,x:b3,y:b4,dpleft:h0.8,dpright:h0.2,dpup:h0.1,dpdown:h0.4,leftx:a0,lefty:a1,leftstick:b13,rightx:a2,righty:a3,rightstick:b14,leftshoulder:b6,lefttrigger:a5,rightshoulder:b7,righttrigger:a4,back:b10,start:b11,guide:b33,
# 030086655e040000a10200000a060000,X360 Wireless Controller,platform:Linux,a:b0,b:b1,x:b2,y:b3,dpleft:h0.8,dpright:h0.2,dpup:h0.1,dpdown:h0.4,leftx:a0,lefty:a1,leftstick:b9,rightx:a3,righty:a4,rightstick:b10,leftshoulder:b4,lefttrigger:a2,rightshoulder:b5,righttrigger:a5,back:b6,start:b7,guide:b8,
# 030000005e040000a10200000a060000,X360 Wireless Controller,platform:Linux,a:b0,b:b1,x:b2,y:b3,dpleft:h0.8,dpright:h0.2,dpup:h0.1,dpdown:h0.4,leftx:a0,lefty:a1,leftstick:b9,rightx:a3,righty:a4,rightstick:b10,leftshoulder:b4,lefttrigger:a2,rightshoulder:b5,righttrigger:a5,back:b6,start:b7,guide:b8,"

# Other program settings:
export _JAVA_AWT_WM_NONREPARENTING=1

if [[ "$XDG_SESSION_TYPE" = "x11" ]]; then
    export MOZ_USE_XINPUT2=1
    numlockx on
    systemctl --user start clipmenud
    # dbus-update-activation-environment --systemd DBUS_SESSION_BUS_ADDRESS DISPLAY XAUTHORITY
elif [[ "$XDG_SESSION_TYPE" = "wayland" ]]; then
    export MOZ_ENABLE_WAYLAND=1
    export SDL_VIDEODRIVER=wayland
    export QT_QPA_PLATFORM=wayland
    xhost +si:localuser:root
fi

# (cat /home/mamba/.cache/wal/sequences &)

#pgrep light-locker || light-locker --no-lock-on-lid &
#pgrep xss-lock || xss-lock -- light-locker-command -l &
xrdb -merge ~/.cache/wal/colors.Xresources

eval "$(luarocks --tree "${XDG_DATA_HOME}/luarocks" path)"
