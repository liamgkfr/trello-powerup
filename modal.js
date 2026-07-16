/* global TrelloPowerUp */
'use strict';

const CONFIG = window.POWER_UP_CONFIG;
const t = TrelloPowerUp.iframe(Object.assign({}, CONFIG));
const form = document.getElementById('entry-form');
const nameInput = document.getElementById('name');
const remarkInput = document.getElementById('remark');
const remarkCount = document.getElementById('remark-count');
const nameError = document.getElementById('name-error');
const entryStep = document.getElementById('step-entry');
const successStep = document.getElementById('step-success');
const submitButton = document.getElementById('submit-entry');
const cancelButton = document.getElementById('cancel-entry');
const saveStatus = document.getElementById('save-status');

function validateConfiguration() {
  if (!CONFIG || !CONFIG.appKey || CONFIG.appKey.includes('HIER_DEINEN')) {
    throw new Error('In config.js wurde noch kein Trello API Key eingetragen.');
  }
}

function formatTimestamp(date) {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function buildComment(entry) {
  return [
    '**Eingabe bestätigt**',
    '',
    '**Name:** ' + entry.name,
    '**Bemerkung:** ' + (entry.remark || 'Keine Bemerkung'),
    '**Eingegeben am:** ' + entry.confirmedAtDisplay
  ].join('\n');
}

async function getAuthorizedClient() {
  validateConfiguration();
  const client = await t.getRestApi();
  let isAuthorized = await client.isAuthorized();

  if (!isAuthorized) {
    saveStatus.textContent = 'Trello-Zugriff wird einmalig angefordert …';
    await client.authorize({ scope: 'read,write', expiration: 'never' });
    isAuthorized = await client.isAuthorized();
  }

  if (!isAuthorized) {
    throw new Error('Der Trello-Zugriff wurde nicht erlaubt.');
  }

  return client;
}

async function trelloRequest(client, path, method, parameters) {
  const token = await client.getToken();
  if (!token) throw new Error('Kein Trello-Zugriffstoken vorhanden.');

  const url = new URL('https://api.trello.com/1/' + path);
  url.searchParams.set('key', CONFIG.appKey);
  url.searchParams.set('token', token);
  Object.entries(parameters || {}).forEach(function ([key, value]) {
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    method: method,
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(response.status + ': ' + message);
  }

  return response.json();
}

async function saveEntry(entry) {
  const client = await getAuthorizedClient();
  const card = await t.card('id');

  saveStatus.textContent = 'Kommentar und Kartenstatus werden gespeichert …';

  await trelloRequest(client, 'cards/' + encodeURIComponent(card.id) + '/actions/comments', 'POST', {
    text: buildComment(entry)
  });
  await trelloRequest(client, 'cards/' + encodeURIComponent(card.id), 'PUT', {
    dueComplete: true
  });

  const existing = await t.get('card', 'shared', 'entries', []);
  const entries = Array.isArray(existing) ? existing.slice(-19) : [];
  entries.push(entry);
  await t.set('card', 'shared', { entries: entries, lastEntry: entry });
}

function setSaving(saving) {
  submitButton.disabled = saving;
  cancelButton.disabled = saving;
  nameInput.disabled = saving;
  remarkInput.disabled = saving;
}

remarkInput.addEventListener('input', function () {
  remarkCount.textContent = String(remarkInput.value.length);
});

form.addEventListener('submit', async function (event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const remark = remarkInput.value.trim();

  if (!name) {
    nameError.hidden = false;
    nameInput.focus();
    return;
  }

  nameError.hidden = true;
  saveStatus.textContent = '';
  setSaving(true);

  const now = new Date();
  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: name,
    remark: remark,
    confirmedAt: now.toISOString(),
    confirmedAtDisplay: formatTimestamp(now)
  };

  try {
    await saveEntry(entry);
    entryStep.hidden = true;
    successStep.hidden = false;
    await t.sizeTo('body');
  } catch (error) {
    console.error(error);
    saveStatus.textContent = 'Speichern fehlgeschlagen: ' + error.message;
    setSaving(false);
  }
});

document.getElementById('cancel-entry').addEventListener('click', function () {
  t.closeModal();
});

document.getElementById('close-modal').addEventListener('click', function () {
  t.closeModal();
});

t.sizeTo('body').then(function () {
  nameInput.focus();
});
