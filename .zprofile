#!/bin/sh
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
 
export QT_QPA_PLATFORMTHEME="qt5ct"
export ZDOTDIR="$XDG_CONFIG_HOME/zsh"
export HISTFILE="$XDG_DATA_HOME/history"
export PATH="$HOME/.local/bin:$PATH"
export SAL_USE_VCLPLUGIN=gtk3
 
# ~/ Clean-up:
export ANDROID_HOME="$XDG_DATA_HOME/android"
export CARGO_HOME="$XDG_DATA_HOME/cargo"
export CUDA_CACHE_PATH="$XDG_CACHE_HOME/nv"
export GNUPGHOME="$XDG_DATA_HOME/gnupg"
export _JAVA_OPTIONS="-Djava.util.prefs.userRoot=$XDG_CONFIG_HOME/java"
export _JAVA_OPTIONS="-Dawt.useSystemAAFontSettings=on -Dswing.aatext=true -Dswing.defaultlaf=com.sun.java.swing.plaf.gtk.GTKLookAndFeel -Dswing.crossplatformlaf=com.sun.java.swing.plaf.gtk.GTKLookAndFeel ${_JAVA_OPTIONS}"
export RUSTUP_HOME="$XDG_DATA_HOME/rustup"
export WINEPREFIX="$XDG_DATA_HOME/wine/default"
export NPM_CONFIG_USERCONFIG="$XDG_CONFIG_HOME/npm/npmrc"
export XINITRC="$XDG_CONFIG_HOME/X11/xinitrc"
export PERL_CPANM_HOME="$XDG_CACHE_HOME/cpanm"

# export MOZ_DRM_DEVICE="/dev/dri/by-path/pci-0000:$(lspci | grep -E '(VGA|3D).*Intel' | awk '{print $1}')-render"
#
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
    # xhost +si:localuser:root
fi

xrdb -merge ~/.cache/wal/colors.Xresources

eval "$(luarocks --tree "${XDG_DATA_HOME}/luarocks" path)"
