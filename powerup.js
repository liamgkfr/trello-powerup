/* global TrelloPowerUp */
'use strict';

const BASE_URL = new URL('./', window.location.href).href;
const CONFIG = window.POWER_UP_CONFIG;

function openEntryModal(t) {
  return t.modal({
    url: BASE_URL + 'modal.html',
    title: 'Erledigt melden',
    height: 760,
    fullscreen: false
  });
}

TrelloPowerUp.initialize({
  'card-detail-badges': function cardDetailBadges() {
    return [{
      title: 'ERLEDIGT',
      text: 'ERLEDIGT',
      color: 'green',
      callback: openEntryModal
    }];
  },

  'card-badges': function cardBadges(t) {
    return t.get('card', 'shared', 'lastEntry')
      .then(function renderBadge(lastEntry) {
        if (!lastEntry || !lastEntry.name) return [];
        return [{
          text: 'Erledigt: ' + lastEntry.name,
          color: 'green'
        }];
      });
  }
}, Object.assign({}, CONFIG));
