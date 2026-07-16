/* global TrelloPowerUp */
'use strict';

const BASE_URL = new URL('./', window.location.href).href;
const CONFIG = window.POWER_UP_CONFIG;

TrelloPowerUp.initialize({
  'card-buttons': function cardButtons() {
    return [{
      icon: BASE_URL + 'icon.svg',
      text: 'Eingabe erfassen',
      condition: 'always',
      callback: function openEntryModal(t) {
        return t.modal({
          url: BASE_URL + 'modal.html',
          title: 'Eingabe erfassen',
          height: 680,
          fullscreen: false
        });
      }
    }];
  },

  'card-badges': function cardBadges(t) {
    return t.get('card', 'shared', 'lastEntry')
      .then(function renderBadge(lastEntry) {
        if (!lastEntry || !lastEntry.name) return [];
        return [{
          text: 'Bestätigt: ' + lastEntry.name,
          color: 'green'
        }];
      });
  }
}, CONFIG);
