#!/bin/zsh

# init background wallpaper
feh --bg-scale ~/.wallpaper/`ls ~/.wallpaper | shuf -n1`

#start polybar
~/.scripts/polybar.sh

#setup language
setxkbmap -option grp:alt_shift_toggle us,il

#welcome home
notify-send "Welcome home, Captain!"

#enable zplug
source ~/.zplug/init.zsh

#enable zsh matching
setopt extendedglob
