#!/bin/bash
cd "$(dirname "$0")" || exit 1
node admin-reset.js
if [ "$?" -eq 0 ]; then node install.js; else read -r -p 'Hinweis oben lesen. Enter zum Beenden'; fi
