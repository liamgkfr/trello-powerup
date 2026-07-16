/* global TrelloPowerUp */
'use strict';

const t = TrelloPowerUp.iframe();
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

let pendingEntry = null;

function showStep(step) {
  entryStep.hidden = step !== 'entry';
  confirmStep.hidden = step !== 'confirm';
  successStep.hidden = step !== 'success';
  return t.sizeTo('body');
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

async function addCardComment(entry) {
  const restApi = t.getRestApi();
  let authorized = await restApi.isAuthorized();
  if (!authorized) {
    await restApi.authorize({ scope: { write: true, read: true } });
    authorized = await restApi.isAuthorized();
  }
  if (!authorized) throw new Error('Trello-Autorisierung wurde nicht erteilt.');

  const [token, apiKey, card] = await Promise.all([
    restApi.getToken(),
    restApi.getApiKey(),
    t.card('id')
  ]);

  const endpoint = 'https://api.trello.com/1/cards/' + encodeURIComponent(card.id) +
    '/actions/comments?key=' + encodeURIComponent(apiKey) +
    '&token=' + encodeURIComponent(token);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: buildComment(entry) })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error('Kommentar konnte nicht erstellt werden: ' + response.status + ' ' + message);
  }
}

async function saveEntry(entry) {
  const existing = await t.get('card', 'shared', 'entries', []);
  const entries = Array.isArray(existing) ? existing : [];
  entries.push(entry);

  await Promise.all([
    t.set('card', 'shared', 'entries', entries),
    t.set('card', 'shared', 'lastEntry', entry)
  ]);

  try {
    await addCardComment(entry);
    return { commentCreated: true };
  } catch (error) {
    console.warn(error);
    return { commentCreated: false, warning: error.message };
  }
}

remarkInput.addEventListener('input', function () {
  remarkCount.textContent = String(remarkInput.value.length);
});

form.addEventListener('submit', function (event) {
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
  confirmButton.disabled = true;
  saveStatus.textContent = '';
  showStep('confirm');
});

confirmCheckbox.addEventListener('change', function () {
  confirmButton.disabled = !confirmCheckbox.checked;
});

document.getElementById('back-entry').addEventListener('click', function () {
  showStep('entry').then(function () { nameInput.focus(); });
});

document.getElementById('cancel-entry').addEventListener('click', function () {
  t.closeModal();
});

document.getElementById('close-modal').addEventListener('click', function () {
  t.closeModal();
});

confirmButton.addEventListener('click', async function () {
  if (!pendingEntry || !confirmCheckbox.checked) return;

  confirmButton.disabled = true;
  document.getElementById('back-entry').disabled = true;
  saveStatus.textContent = 'Eingabe wird gespeichert …';

  const now = new Date();
  const entry = {
    id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    name: pendingEntry.name,
    remark: pendingEntry.remark,
    confirmedAt: now.toISOString(),
    confirmedAtDisplay: formatTimestamp(now)
  };

  try {
    const result = await saveEntry(entry);
    if (!result.commentCreated) {
      console.warn('Eintrag gespeichert, aber ohne Kartenkommentar:', result.warning);
    }
    await showStep('success');
  } catch (error) {
    console.error(error);
    saveStatus.textContent = 'Speichern fehlgeschlagen: ' + error.message;
    confirmButton.disabled = false;
    document.getElementById('back-entry').disabled = false;
  }
});

showStep('entry').then(function () { nameInput.focus(); });
