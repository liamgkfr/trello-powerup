/* global TrelloPowerUp */
'use strict';

/*
 * Zentrale Konfiguration aus config.js laden.
 * Wichtig: Nicht mit Object.freeze() sperren.
 */
const CONFIG = window.POWER_UP_CONFIG;

if (!CONFIG || !CONFIG.appKey || !CONFIG.appName) {
  console.error(
    'Power-Up-Konfiguration fehlt. Prüfe, ob config.js vor powerup.js geladen wird.'
  );
}

/**
 * Öffnet das Eingabeformular als Trello-Modal.
 *
 * @param {object} t Trello Power-Up Client
 * @returns {Promise|object}
 */
function openInputModal(t) {
  return t.modal({
    url: './modal.html',
    title: 'ERLEDIGT',
    text: '✅ ERLEDIGT',
    color: 'green',
    height: 720,
    fullscreen: false
  });
}

/**
 * Liest die letzte bestätigte Eingabe aus den Kartendaten.
 *
 * @param {object} t Trello Power-Up Client
 * @returns {Promise<object|null>}
 */
function getLastEntry(t) {
  return t.get('card', 'shared', 'lastEntry', null);
}

/**
 * Initialisiert das Trello Power-Up.
 *
 * Die Konfiguration wird als veränderbare Kopie übergeben, weil die
 * Trello-Bibliothek intern zusätzliche Eigenschaften ergänzt.
 */
window.TrelloPowerUp.initialize(
  {
    /**
     * Sichtbarer, anklickbarer Eintrag oben auf der geöffneten Karte.
     */
    'card-detail-badges': function cardDetailBadges(t) {
      return [
        {
          title: 'Eingabe',
          text: 'Eingabe',
          color: 'blue',
          callback: function onInputClick() {
            return openInputModal(t);
          }
        }
      ];
    },

    /**
     * Kleines Badge auf der Vorderseite der Karte.
     * Es zeigt den Namen der letzten bestätigten Eingabe.
     */
    'card-badges': function cardBadges(t) {
      return getLastEntry(t).then(function buildBadges(lastEntry) {
        if (!lastEntry || !lastEntry.name) {
          return [];
        }

        return [
          {
            text: lastEntry.name,
            color: 'green'
          }
        ];
      });
    },

    /**
     * Optionaler zusätzlicher Button im Power-Ups-Bereich.
     *
     * Entferne diesen gesamten Abschnitt, wenn ausschließlich der
     * sichtbare Detail-Button oben auf der Karte erscheinen soll.
     */
    'card-buttons': function cardButtons(t) {
      return [
        {
          icon: new URL('./icon.svg', window.location.href).href,
          text: 'Eingabe',
          condition: 'always',
          callback: function onCardButtonClick() {
            return openInputModal(t);
          }
        }
      ];
    }
  },

  Object.assign({}, CONFIG)
);
