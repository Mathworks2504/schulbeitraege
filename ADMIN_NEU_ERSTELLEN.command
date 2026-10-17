#!/bin/bash
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then echo 'Node.js ist nicht verfügbar.'; read -r -p 'Enter zum Beenden'; exit 1; fi
node admin-neu.js
result=$?
if [ "$result" -ne 0 ]; then read -r -p 'Hinweis oben lesen. Enter zum Beenden'; exit "$result"; fi
read -r -p 'Zugangsdaten notiert? Enter startet die App. '
node install.js
