/* global TrelloPowerUp */
'use strict';

const CONFIG = window.POWER_UP_CONFIG;
const t = TrelloPowerUp.iframe(CONFIG);
const form = document.getElementById('entry-form');
const nameInput = document.getElementById('name');
const remarkInput = document.getElementById('remark');
const remarkCount = document.getElementById('remark-count');
const nameError = document.getElementById('name-error');
const entryStep = document.getElementById('step-entry');
const confirmStep = document.getElementById('step-confirm');
const successStep = document.getElementById('step-success');
const summaryName = document.getElementById('summary-name');
const summaryRemark = document.getElementById('summary-remark');
const confirmCheckbox = document.getElementById('confirm-checkbox');
const confirmButton = document.getElementById('confirm-entry');
const saveStatus = document.getElementById('save-status');
const authorizationBox = document.getElementById('authorization-box');
const authorizeButton = document.getElementById('authorize-trello');

let pendingEntry = null;
let authorized = false;

function validateConfiguration() {
  if (!CONFIG || !CONFIG.appKey || CONFIG.appKey.includes('HIER_DEINEN')) {
    throw new Error('In config.js wurde noch kein Trello API Key eingetragen.');
  }
}

function showStep(step) {
  entryStep.hidden = step !== 'entry';
  confirmStep.hidden = step !== 'confirm';
  successStep.hidden = step !== 'success';
  return t.sizeTo('body');
}

function updateConfirmButton() {
  confirmButton.disabled = !confirmCheckbox.checked || !authorized;
}

function formatTimestamp(date) {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function buildComment(entry) {
  return [
    '**Eingabe verbindlich bestätigt**',
    '',
    '**Name:** ' + entry.name,
    '**Bemerkung:** ' + (entry.remark || 'Keine Bemerkung'),
    '**Bestätigt am:** ' + entry.confirmedAtDisplay
  ].join('\n');
}

async function getAuthorizedClient() {
  validateConfiguration();
  const client = await t.getRestApi();
  const isAuthorized = await client.isAuthorized();
  if (!isAuthorized) throw new Error('Trello-Zugriff wurde noch nicht erlaubt.');
  return client;
}

async function authorizeTrello() {
  validateConfiguration();
  const client = await t.getRestApi();
  await client.authorize({ scope: 'read,write', expiration: 'never' });
  authorized = await client.isAuthorized();
  authorizationBox.hidden = authorized;
  saveStatus.textContent = authorized ? 'Trello-Zugriff wurde erfolgreich erlaubt.' : 'Autorisierung fehlgeschlagen.';
  updateConfirmButton();
  await t.sizeTo('body');
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
    headers: { 'Accept': 'application/json' }
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

  // Kommentar erstellen und die Karte als erledigt markieren.
  await trelloRequest(client, 'cards/' + encodeURIComponent(card.id) + '/actions/comments', 'POST', {
    text: buildComment(entry)
  });
  await trelloRequest(client, 'cards/' + encodeURIComponent(card.id), 'PUT', {
    dueComplete: true
  });

  // Zusätzlich den letzten Eintrag als Power-Up-Daten speichern.
  const existing = await t.get('card', 'shared', 'entries', []);
  const entries = Array.isArray(existing) ? existing.slice(-19) : [];
  entries.push(entry);
  await t.set('card', 'shared', { entries: entries, lastEntry: entry });
}

async function refreshAuthorizationState() {
  try {
    validateConfiguration();
    const client = await t.getRestApi();
    authorized = await client.isAuthorized();
    authorizationBox.hidden = authorized;
    if (!authorized) saveStatus.textContent = 'Bitte erlaube zuerst den Trello-Zugriff.';
  } catch (error) {
    authorized = false;
    authorizationBox.hidden = false;
    saveStatus.textContent = error.message;
  }
  updateConfirmButton();
  await t.sizeTo('body');
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
  pendingEntry = { name: name, remark: remark };
  summaryName.textContent = name;
  summaryRemark.textContent = remark || 'Keine Bemerkung';
  confirmCheckbox.checked = false;
  saveStatus.textContent = '';
  await showStep('confirm');
  await refreshAuthorizationState();
});

confirmCheckbox.addEventListener('change', updateConfirmButton);
authorizeButton.addEventListener('click', function () {
  authorizeTrello().catch(function (error) {
    console.error(error);
    saveStatus.textContent = 'Autorisierung fehlgeschlagen: ' + error.message;
  });
});

document.getElementById('back-entry').addEventListener('click', function () {
  showStep('entry').then(function () { nameInput.focus(); });
});

document.getElementById('cancel-entry').addEventListener('click', function () { t.closeModal(); });
document.getElementById('close-modal').addEventListener('click', function () { t.closeModal(); });

confirmButton.addEventListener('click', async function () {
  if (!pendingEntry || !confirmCheckbox.checked || !authorized) return;

  confirmButton.disabled = true;
  document.getElementById('back-entry').disabled = true;
  saveStatus.textContent = 'Kommentar und Kartenstatus werden gespeichert …';

  const now = new Date();
  const entry = {
    id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    name: pendingEntry.name,
    remark: pendingEntry.remark,
    confirmedAt: now.toISOString(),
    confirmedAtDisplay: formatTimestamp(now)
  };

  try {
    await saveEntry(entry);
    await showStep('success');
  } catch (error) {
    console.error(error);
    saveStatus.textContent = 'Speichern fehlgeschlagen: ' + error.message;
    confirmButton.disabled = false;
    document.getElementById('back-entry').disabled = false;
  }
});

showStep('entry').then(function () { nameInput.focus(); });
