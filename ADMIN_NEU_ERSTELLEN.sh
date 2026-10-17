#!/bin/sh
cd "$(dirname "$0")" || exit 1
node admin-neu.js || exit 1
printf 'Zugangsdaten notieren. Enter startet die App. '
read answer
node install.js
