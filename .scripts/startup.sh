#!/bin/sh

# init background wallpaper
feh --bg-scale ~/.wallpaper/`ls ~/.wallpaper | shuf -n1`

#start polybar
~/.scripts/polybar.sh
