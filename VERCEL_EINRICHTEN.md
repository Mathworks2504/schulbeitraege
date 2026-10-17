# Bilal-Schule Verwaltung auf Vercel

Die Vercel-Ausgabe verwendet PostgreSQL für Konten, Anmeldesitzungen und Schuldaten.
Die lokale Ausgabe startet weiterhin mit `node server.js` und behält ihren Datenordner.

1. Vercel-Projekt öffnen. Das Repository `Mathworks2504/schulbeitraege` muss verbunden sein.
2. Unter **Storage → Create Database** über den Marketplace eine PostgreSQL-Datenbank (z. B. Neon) erstellen und mit diesem Projekt verbinden. Für die Schuldaten eine passende EU-Region wählen. Preise und Vertragsbedingungen beim Anbieter prüfen.
3. Unter **Settings → Environment Variables** die Verbindung als `DATABASE_URL` bereitstellen. `POSTGRES_URL` wird alternativ unterstützt. Die Verbindung enthält ein Geheimnis und gehört ausschließlich in Vercel.
4. Für **Production** zwei weitere Variablen anlegen:

   | Name | Wert |
   | --- | --- |
   | `BILAL_ADMIN_USERNAME` | Dein neuer Admin-Benutzername, z. B. `admin` |
   | `BILAL_ADMIN_PASSWORD` | Dein eigenes zufälliges Passwort mit mindestens 12 Zeichen |

5. Unter **Deployments** den neuesten GitHub-Stand mit **Redeploy** bereitstellen. Falls bisher ein Framework manuell ausgewählt war: **Other** verwenden, Root Directory auf dem Repository-Hauptordner belassen. Die Routing- und Funktionskonfiguration steht in `vercel.json`.
6. Die Projektadresse öffnen und mit diesen Zugangsdaten anmelden. Der erste Administrator wird nur in einer noch leeren Datenbank angelegt. Bestehende Konten werden bei späteren Deployments nicht überschrieben. Nach erfolgreicher Einrichtung kann `BILAL_ADMIN_PASSWORD` aus den Umgebungsvariablen entfernt werden; das Konto besteht in PostgreSQL weiter. Passwortänderungen erfolgen in der App.

## Bestehende Schuldaten übernehmen

Auf dem Mac in der bisherigen App **Import und Export → Vollständige Sicherung** herunterladen. In der Online-App als Administrator unter **Import & Sicherung → Sicherung übernehmen** die Sicherung importieren. Dabei werden Schülerdaten und Module übernommen; Benutzerkonten und Passwort-Hashes aus der lokalen Datenbank werden nicht über diesen Import übertragen. Online-Benutzer müssen neu eingerichtet und zugeordnet werden. Die Quelldatei gehört nicht ins öffentliche GitHub-Repository.

Der Import erstellt vorher eine Datenbank-Sicherung; die letzten 30 Import-Sicherungen bleiben gespeichert. Unter **Import & Sicherung** sind die zentralen Datenexporte verfügbar. Regelmäßige vollständige Exporte und die Sicherungsfunktionen des Datenbankanbieters verwenden.

## Fehler und Grenzen

- Eine verständliche Einrichtungsseite statt eines Startabsturzes erscheint bei fehlender Konfiguration. Bei Verbindungsfehlern die Vercel-Runtime-Logs prüfen.
- Eine lokale `ADMIN_NEU_ERSTELLEN.command` verändert nur die lokale Installation. Für Online-Passwörter einen zweiten Administrator vorhalten und die Benutzerverwaltung verwenden.
- Bei eigener Domain deren Hostname ohne `https://` zusätzlich als `BILAL_PUBLIC_HOST` setzen.
- GitHub-Deployments enthalten keine Schülerdaten. Die App liest und schreibt dauerhaft in PostgreSQL.
- Der gesamte Verwaltungsstand wird für diese Schul-App als JSON-Dokument gespeichert; Datenbanktransaktionen verhindern verlorene gleichzeitige Änderungen. Für sehr viele gleichzeitige Nutzer wäre eine weiter aufgeteilte Datenstruktur nötig.
- Die Vercel-Funktionsgrenze für Anfragegrößen gilt auch für Sicherungsimporte; große Sicherungen benötigen einen gesonderten Uploadweg.

## Prüfung

`npm ci` und `npm test`. Mit `TEST_DATABASE_URL` laufen zusätzlich echte PostgreSQL-Tests für Speicherung, Anmeldesitzungen über neue Funktionsinstanzen, Rollenabgrenzung, gleichzeitiges Speichern, Rollback und Passwortwechsel. Ohne diese Variable wird der Datenbanktest übersprungen.
