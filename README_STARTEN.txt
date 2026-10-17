BILAL-SCHULE VERWALTUNG
Neu gestaltete Anwendung – ein fester Name, ein gemeinsamer Datenstand.

AUF DEM MAC STARTEN
1. Vorher in der bisherigen App eine Sicherung herunterladen.
2. Alte App im Terminal mit Ctrl+C beenden. ZIP entpacken.
3. START_BILAL_SCHULE.command öffnen. Falls das nicht klappt:
   bash und ein Leerzeichen ins Terminal schreiben, die Datei hineinziehen, Enter.
4. Der Starter aktualisiert die Programmdateien am festen Ort und öffnet die App.
5. Mit dem vorhandenen Administratorkonto anmelden.
Vorhandene Konten und Schuldaten im zentralen Datenordner bleiben bestehen.

NEUE INSTALLATION
Ohne vorhandene Daten beginnt diese Ausgabe leer. Beim ersten Öffnen ein
Administratorkonto anlegen. Die App enthält keine fremden Schüler- oder Demodaten.
Vorhandene Bilal-JSON-Sicherungen können unter Import & Sicherung übernommen werden.
Der Import ersetzt Schuldaten und setzt Konto-Zuordnungen zurück; Konten bleiben erhalten.
Excel-/CSV-Importe ergänzen Schüler erst nach Vorschau und Bestätigung.

NEU UND VERBESSERT
- Neues Dashboard, mobile Navigation und Bilal-Grün/Gold.
- Schüler vollständig bearbeiten, mehrere Elternkontakte gemeinsam speichern.
- Mehrere Schüler auswählen, Klassen wechseln, Kontakte ergänzen oder löschen.
- Kontaktzuordnungen gemeinsam ändern; leere Felder bleiben unverändert.
- Klassenkarten mit Auslastung; Schüler aus dem Bestand mehrfach zuordnen.
- Raum-/Lehrerplanung mit Konfliktprüfung und bestätigtem Zuteilungsvorschlag.
- Monatsbeiträge und Zahlungen einzeln oder gesammelt erfassen.
- Kalender mit Terminliste, ICS-Import/Export und Vorschau.
- Anwesenheit, Noten, Notfallhinweise, Rechnungen und Mahnungen.
- Aufgaben, Projekte, Notizen, Vorlagen mit Druckfunktion und Bücherei.
- Benutzerkonten, Rollen und Schüler-/Klassenzuordnungen.
- Logo und Farben bearbeiten; das Original-Logo bleibt wiederherstellbar.
- Speichern wird erst nach Serverbestätigung als erfolgreich angezeigt.
  Bei einem Konflikt bleiben Formular und Entwurf erhalten. Entwurf sichern,
  bevor du den aktuellen Serverstand über den Aktualisieren-Knopf lädst.

ADMINZUGANG WIEDERHERSTELLEN
Auf dem Servercomputer ADMIN_NEU_ERSTELLEN.command öffnen.
Der Starter sichert den bisherigen lokalen Gesamtstand und erzeugt einen
zusätzlichen Administrator. Benutzername und Passwort erscheinen im Terminal.
Diese Daten notieren und Enter drücken. Bestehende Konten bleiben erhalten.
Der lokale Admin-Starter verändert keine Online-Konten in Vercel.

FESTE ORTE AUF DEM MAC
Programm: ~/Applications/Bilal-Schule-Verwaltung
Daten: ~/Library/Application Support/Bilal-Schule-Verwaltung
Den Datenordner bei beendetem Server regelmäßig vollständig sichern.
Die App-Sicherung enthält keine Konten oder Passwort-Hashes.

VERCEL / ONLINE
VERCEL_EINRICHTEN.md beschreibt die Einrichtung. DATABASE_URL sowie die
Variablen für den ersten Online-Admin müssen in Vercel gesetzt sein.
Online werden Daten und Sitzungen in PostgreSQL gespeichert.
Danach gelten deine Online-Konten und deren gespeicherte Passwörter weiter.
Die Vercel-Konfiguration ist enthalten, eine echte Bereitstellung erfordert
Zugriff auf dein Vercel-Projekt und eine verbundene Datenbank.

WINDOWS / LINUX / IPHONE
Windows: START_BILAL_SCHULE.bat, Linux: START_BILAL_SCHULE.sh.
Node.js 24 verwenden. Lokal sind keine npm-Pakete zum Starten erforderlich.
Auf dem iPhone die eingerichtete HTTPS-Adresse der Online-App öffnen.
Für lokalen WLAN-Zugriff kann der Server mit BILAL_LAN=1 node server.js
gestartet werden; der Servercomputer muss dabei eingeschaltet bleiben.

PRÜFUNG
Automatisierte Tests für Navigation, Formulare, Mehrfachaktionen, Erhalt von
Zahlungen und Kontakten, Speicherkonflikte, Importformate und Planung.
Zusätzliche Datenbanktests prüfen Rollen, Sitzungen und Rückabwicklung.
Direkte Sichtprüfung auf deinem Mac und iPhone sowie Live-Vercel-Test stehen aus.
