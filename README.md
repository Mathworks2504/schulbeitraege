# Bilal-Schule Verwaltung

Schulverwaltung mit Node.js, lokal auf dem Mac/Windows/Linux oder online auf Vercel mit PostgreSQL.

**Vercel-Einrichtung:** [VERCEL_EINRICHTEN.md](VERCEL_EINRICHTEN.md). Benötigt werden eine PostgreSQL-Verbindung (`DATABASE_URL`) und für die erste Einrichtung `BILAL_ADMIN_USERNAME` sowie `BILAL_ADMIN_PASSWORD`. Geheimnisse ausschließlich in Vercel speichern.

Start: `node server.js`, danach http://localhost:3001 öffnen.
Bei einer leeren Installation wird ein eigenes Administratorkonto eingerichtet.
Lokale Adminwiederherstellung: `node admin-neu.js`.
Ausführliche Anleitung: README_STARTEN.txt.

Dieses Repository enthält Programmcode und eine leere Ausgangsdatei.
Schülerlisten, Excel-Dateien, Datenbanken, Sicherungen und Zugangsdaten gehören nicht ins Repository.
Bestehende lokale Daten bleiben im separaten Anwendungsdatenordner auf dem Servercomputer. Die Online-Ausgabe speichert Konten, Sitzungen und Schuldaten dauerhaft in PostgreSQL.

Die lokale Anwendung benötigt einen laufenden Node.js-Server. Auf Vercel übernimmt eine Serverfunktion die Verarbeitung; GitHub Pages allein führt die App nicht aus.
Für eine frische Installation enthält das Repository keine Schüler; vorhandene lokale Daten bleiben erhalten.
