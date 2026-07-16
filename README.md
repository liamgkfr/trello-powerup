# SG Trello Eingabe Power-Up

Flache GitHub-Pages-Version für das Repository `liamgkfr/trello-powerup`.

## Dateien im Repository

Alle Dateien müssen direkt im Branch `main` liegen:

- `index.html`
- `powerup.js`
- `modal.html`
- `modal.js`
- `style.css`
- `icon.svg`

## GitHub Pages

1. Repository `trello-powerup` öffnen.
2. `Settings` > `Pages`.
3. Unter `Build and deployment` die Quelle `Deploy from a branch` wählen.
4. Branch `main` und Ordner `/ (root)` wählen.
5. Speichern.

Die Website lautet anschließend:

`https://liamgkfr.github.io/trello-powerup/`

Connector URL für Trello:

`https://liamgkfr.github.io/trello-powerup/index.html`

## Trello-Konfiguration

In der Power-Up-Verwaltung:

- Iframe Connector URL: `https://liamgkfr.github.io/trello-powerup/index.html`
- Allowed Origin/Domain, falls abgefragt: `https://liamgkfr.github.io`
- Capability `card-buttons` aktivieren, falls die Verwaltung dies separat verlangt.

Anschließend das Board mit `Strg + F5` neu laden und eine Karte öffnen.

## Funktion

- Kartenbutton `Eingabe erfassen`
- Pflichtfeld `Name`
- optionales Feld `Bemerkung`
- gesonderte Prüfseite
- verbindliche Bestätigung per Checkbox
- Speicherung in den Shared-Daten der Karte
- Versuch, zusätzlich einen Kartenkommentar anzulegen

Beim ersten Erstellen eines Kartenkommentars kann Trello eine Autorisierung anzeigen. Wird diese nicht erteilt, bleibt der Eintrag trotzdem in den Power-Up-Daten der Karte gespeichert.
