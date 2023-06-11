(cat ~/.cache/wal/sequences &)

# Enable colors and change prompt:
autoload -U colors && colors
PS1="%B%{$fg[red]%}[%{$fg[yellow]%}%n%{$fg[green]%}@%{$fg[blue]%}%M %{$fg[magenta]%}%~%{$fg[red]%}]%{$reset_color%}$%b "

# fortune brasil | cowsay | lolcat -ft
neofetch

# History in cache directory:
setopt autocd
ZSH_THEME="eastwood"
HISTSIZE=10000
SAVEHIST=10000
setopt APPEND_HISTORY
setopt HIST_IGNORE_DUPS
setopt hist_ignore_space

# Basic auto/tab complete:
autoload -U compinit
zstyle ':completion:*' menu select
zmodload zsh/complist
compinit
_comp_options+=(globdots)		# Include hidden files.

# Use lf to switch directories and bind it to ctrl-o
# lfcd () {
#     tmp="$(mktemp)"
#     lf -last-dir-path="$tmp" "$@"
#     if [ -f "$tmp" ]; then
#         dir="$(cat "$tmp")"
#         rm -f "$tmp"
#         [ -d "$dir" ] && [ "$dir" != "$(pwd)" ] && cd "$dir"
#     fi
# }
# bindkey -s '^o' 'lfcd\n'
bindkey -e

source "$ZDOTDIR/aliasrc"
source "$ZDOTDIR/zsh-window-title.zsh"
# source "$ZDOTDIR/nix-zsh-completions/nix-zsh-completions.plugin.zsh"

#source /usr/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.plugin.zsh 2>/dev/null
source /usr/share/fzf/completion.zsh
#source /usr/share/fzf/key-bindings.zsh
export fpath=(${XDG_DATA_HOME}/zsh/site-functions $fpath)
autoload -U compinit && compinit

#source "$ZDOTDIR/zsh-syntax-highlighting.zsh"

