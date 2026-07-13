const INITIAL_TIME = 90 * 60;
const PENALTY_SECONDS = 60;
const HINT_COST_SECONDS = 2 * 60;
const MUSIC_VOLUME = 0.62;
const CROSSFADE_DURATION = 1800;

/*
  Le chronomètre repose sur une heure de fin (deadline) au lieu de retirer
  une seconde à chaque intervalle. Il reste donc exact après une pause,
  une actualisation ou un ralentissement du navigateur.
*/
let timeLeft = readNumber("timeLeft", INITIAL_TIME);
let gameStarted = localStorage.getItem("gameStarted") === "true";
let gamePaused = localStorage.getItem("gamePaused") !== "false";
let deadline = readNumber("deadline", 0);

let lastValidCode = localStorage.getItem("lastValidCode") || "";
let selectedHintCard = localStorage.getItem("selectedHintCard") || "";
let revealedHints = readJSON("revealedHints", {});
let audioEnabled = localStorage.getItem("audioEnabled") === "true";
let currentSoundtrackKey = localStorage.getItem("currentSoundtrackKey") || "intro";
let tensionTriggered = localStorage.getItem("tensionTriggered") === "true";

const timer = document.getElementById("timer");
const codeInput = document.getElementById("codeInput");
const message = document.getElementById("message");
const audioIcon = document.getElementById("audioIcon");
const currentSoundtrackLabel = document.getElementById("currentSoundtrack");
const hintModal = document.getElementById("hintModal");
const hintCardInput = document.getElementById("hintCardInput");
const hintCardError = document.getElementById("hintCardError");
const startPauseButton = document.getElementById("startPauseButton");
const gameStatus = document.getElementById("gameStatus");

const audioA = document.getElementById("audioA");
const audioB = document.getElementById("audioB");
let activePlayer = audioA;
let standbyPlayer = audioB;
let fadeInterval = null;
let timerInterval = null;

audioA.volume = 0;
audioB.volume = 0;

function readNumber(key, fallback) {
  const raw = localStorage.getItem(key);
  if (raw === null || raw === "") return fallback;

  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem("timeLeft", String(timeLeft));
  localStorage.setItem("gameStarted", String(gameStarted));
  localStorage.setItem("gamePaused", String(gamePaused));
  localStorage.setItem("deadline", String(deadline));

  localStorage.setItem("lastValidCode", lastValidCode);
  localStorage.setItem("selectedHintCard", selectedHintCard);
  localStorage.setItem("revealedHints", JSON.stringify(revealedHints));
  localStorage.setItem("audioEnabled", String(audioEnabled));
  localStorage.setItem("currentSoundtrackKey", currentSoundtrackKey);
  localStorage.setItem("tensionTriggered", String(tensionTriggered));
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function calculateRemainingTime() {
  if (!gameStarted || gamePaused || deadline <= 0) {
    return Math.max(0, timeLeft);
  }

  return Math.max(0, (deadline - Date.now()) / 1000);
}

function syncTimeFromDeadline() {
  timeLeft = calculateRemainingTime();

  if (gameStarted && !gamePaused && timeLeft <= 0) {
    timeLeft = 0;
    gamePaused = true;
    deadline = 0;
    stopTimerLoop();
    pauseAllAudio();
    setMessage("Temps écoulé !");
  }

  renderTimer();
}

function renderTimer() {
  timer.textContent = formatTime(timeLeft);
  timer.classList.toggle("timer-warning", timeLeft <= 10 * 60);
  saveState();
}

function startTimerLoop() {
  stopTimerLoop();
  syncTimeFromDeadline();

  timerInterval = window.setInterval(() => {
    syncTimeFromDeadline();

  }, 250);
}

function stopTimerLoop() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function setMessage(text, success = false) {
  message.textContent = text;
  message.classList.toggle("success", success);
}

function updateStartPauseButton() {
  startPauseButton.classList.remove("paused", "running");

  if (!gameStarted) {
    startPauseButton.textContent = "▶ START";
    gameStatus.textContent = "Prêt à commencer";
    startPauseButton.classList.add("paused");
    return;
  }

  if (gamePaused) {
    startPauseButton.textContent = timeLeft <= 0 ? "TEMPS ÉCOULÉ" : "▶ REPRENDRE";
    gameStatus.textContent = timeLeft <= 0 ? "Aventure terminée" : "Aventure en pause";
    startPauseButton.classList.add("paused");
    startPauseButton.disabled = timeLeft <= 0;
    return;
  }

  startPauseButton.disabled = false;
  startPauseButton.textContent = "⏸ PAUSE";
  gameStatus.textContent = "Aventure en cours";
  startPauseButton.classList.add("running");
}

function beginOrResumeTimer() {
  if (timeLeft <= 0) return;

  deadline = Date.now() + timeLeft * 1000;
  gameStarted = true;
  gamePaused = false;

  saveState();
  updateStartPauseButton();
  startTimerLoop();
}

function pauseTimer() {
  timeLeft = calculateRemainingTime();
  gamePaused = true;
  deadline = 0;

  stopTimerLoop();
  renderTimer();
  saveState();
}

function toggleStartPause() {
  if (timeLeft <= 0) {
    setMessage("Le temps est écoulé. Réinitialisez la partie.");
    return;
  }

  if (!gameStarted || gamePaused) {
    beginOrResumeTimer();
    setMessage(gameStarted ? "Aventure reprise." : "L'aventure commence !", true);

    // L'audio est volontairement séparé du chrono.
    if (!audioEnabled) {
      audioEnabled = true;
      updateAudioButton();
    }

    startCurrentSoundtrack().catch(() => {});
  } else {
    pauseTimer();
    pauseAllAudio();
    updateStartPauseButton();
    setMessage("Aventure en pause.");
  }

  saveState();
}

function pauseAllAudio() {
  audioA.pause();
  audioB.pause();
}

function playEffect(key, volume = 0.8) {
  if (!audioEnabled) return;

  const file = soundEffects[key];
  if (!file) return;

  const effect = new Audio(file);
  effect.volume = volume;
  effect.play().catch(() => {});
}

function subtractTime(seconds) {
  if (gameStarted && !gamePaused && deadline > 0) {
    deadline -= seconds * 1000;
    timeLeft = calculateRemainingTime();
  } else {
    timeLeft = Math.max(0, timeLeft - seconds);
  }

  if (timeLeft <= 0) {
    timeLeft = 0;
    gamePaused = true;
    deadline = 0;
    stopTimerLoop();
    pauseAllAudio();
  }

  renderTimer();
  updateStartPauseButton();
  saveState();
}

function applyPenalty(seconds = PENALTY_SECONDS, reason = "Pénalité") {
  subtractTime(seconds);
  playEffect("penalty");
  setMessage(`${reason} : -${Math.floor(seconds / 60)} minute(s).`);
}

function validateCode() {
  const code = codeInput.value.trim().toUpperCase();

  if (!code) {
    setMessage("Saisissez d'abord un code.");
    codeInput.focus();
    return;
  }

  const destination = codes[code];
  const soundtrackKey = soundtrackByCode[code];
  const hasHints = Boolean(indices[code]);

  /*
    Un numéro de carte peut désormais servir uniquement à changer
    l'ambiance. Il est alors accepté sans pénalité, même s'il n'ouvre
    aucun fichier ou aucune page.
  */
  if (destination || soundtrackKey || hasHints) {
    lastValidCode = code;

    if (hasHints) {
      selectedHintCard = code;

      if (revealedHints[code] === undefined) {
        revealedHints[code] = 0;
      }
    }

    if (soundtrackKey) {
      changeSoundtrack(soundtrackKey);
    }

    saveState();
    playEffect("correct");

    if (destination) {
      setMessage(`Carte ${code} validée.`, true);
      window.open(destination, "_blank", "noopener");
    } else if (soundtrackKey) {
      const label = soundtracks[soundtrackKey]?.label || soundtrackKey;
      setMessage(`Carte ${code} : ambiance « ${label} » activée.`, true);
    } else {
      setMessage(`Carte ${code} sélectionnée pour les indices.`, true);
    }
  } else {
    playEffect("incorrect");
    applyPenalty(PENALTY_SECONDS, `Code ${code} incorrect`);
  }

  codeInput.value = "";
  codeInput.focus();
}

function updateAudioButton() {
  audioIcon.textContent = audioEnabled ? "🔇" : "🔊";
  document.getElementById("audioToggle").title =
    audioEnabled ? "Couper l'ambiance sonore" : "Activer l'ambiance sonore";
}

function updateSoundtrackLabel() {
  const config = soundtracks[currentSoundtrackKey];
  currentSoundtrackLabel.textContent = config ? config.label : "Aucune";
}

function crossfade(outgoing, incoming, duration = CROSSFADE_DURATION) {
  if (fadeInterval) {
    clearInterval(fadeInterval);
  }

  const steps = 36;
  const stepDuration = duration / steps;
  const outgoingStart = outgoing.volume;
  let step = 0;

  fadeInterval = setInterval(() => {
    step += 1;
    const ratio = step / steps;

    incoming.volume = Math.min(MUSIC_VOLUME, ratio * MUSIC_VOLUME);
    outgoing.volume = Math.max(0, outgoingStart * (1 - ratio));

    if (step >= steps) {
      clearInterval(fadeInterval);
      fadeInterval = null;

      outgoing.pause();
      outgoing.currentTime = 0;
      outgoing.volume = 0;
      incoming.volume = MUSIC_VOLUME;
    }
  }, stepDuration);
}

async function changeSoundtrack(key) {
  const config = soundtracks[key];

  if (!config) return;

  if (currentSoundtrackKey === key) {
    updateSoundtrackLabel();
    return;
  }

  currentSoundtrackKey = key;
  updateSoundtrackLabel();
  saveState();

  standbyPlayer.src = config.file;
  standbyPlayer.currentTime = 0;
  standbyPlayer.volume = 0;

  const oldActive = activePlayer;
  activePlayer = standbyPlayer;
  standbyPlayer = oldActive;

  if (!audioEnabled || gamePaused) return;

  try {
    await activePlayer.play();
    crossfade(standbyPlayer, activePlayer);
  } catch {
    setMessage("Le navigateur a bloqué le son. Appuyez sur le bouton audio.");
  }
}

async function startCurrentSoundtrack() {
  if (!audioEnabled || gamePaused) return;

  const config = soundtracks[currentSoundtrackKey];
  if (!config) return;

  if (!activePlayer.src || !activePlayer.src.endsWith(config.file)) {
    activePlayer.src = config.file;
    activePlayer.currentTime = 0;
  }

  activePlayer.volume = MUSIC_VOLUME;

  try {
    await activePlayer.play();
  } catch {
    // Le chrono ne dépend jamais de l'audio.
    setMessage("Le chrono fonctionne, mais la bande-son n'a pas pu démarrer.");
  }
}

async function toggleAudio() {
  if (audioEnabled) {
    pauseAllAudio();
    audioEnabled = false;
  } else {
    audioEnabled = true;

    if (gameStarted && !gamePaused) {
      await startCurrentSoundtrack();
    }
  }

  updateAudioButton();
  saveState();
}

async function restartCurrentTrack() {
  if (!audioEnabled) {
    setMessage("Activez d'abord la bande-son.");
    return;
  }

  if (gamePaused) {
    setMessage("Reprenez d'abord l'aventure.");
    return;
  }

  activePlayer.currentTime = 0;
  await startCurrentSoundtrack();
  setMessage("Piste relancée.", true);
}

function normalizeCardNumber(value) {
  return String(value || "").trim().toUpperCase();
}

function selectHintCard(value, showError = true) {
  const card = normalizeCardNumber(value);

  if (!card) {
    if (showError) hintCardError.textContent = "Saisissez un numéro ou une lettre de carte.";
    return false;
  }

  if (!indices[card]) {
    if (showError) hintCardError.textContent = `Aucun indice n'est prévu pour la carte ${card}.`;
    return false;
  }

  selectedHintCard = card;
  hintCardInput.value = card;
  hintCardError.textContent = "";

  if (revealedHints[card] === undefined) {
    revealedHints[card] = 0;
  }

  saveState();
  refreshHintModal();
  return true;
}

function showConsultedHint(index) {
  if (!selectedHintCard || !indices[selectedHintCard]) return;

  const revealed = revealedHints[selectedHintCard] || 0;
  if (index < 0 || index >= revealed) return;

  const hintText = document.getElementById("hintText");
  hintText.innerHTML =
    `<strong>Indice ${index + 1} déjà consulté</strong><br><br>${indices[selectedHintCard][index]}`;
  hintText.classList.remove("hidden");
}

function renderHintProgress(total, revealed) {
  const container = document.getElementById("hintProgress");
  container.innerHTML = "";

  for (let i = 0; i < total; i += 1) {
    const row = document.createElement(i < revealed ? "button" : "div");
    row.className = "hint-row";

    if (i < revealed) {
      row.classList.add("done", "reviewable");
      row.type = "button";
      row.innerHTML =
        `<span>✓ Indice ${i + 1} consulté</span><span class="review-label">Revoir</span>`;
      row.addEventListener("click", () => showConsultedHint(i));
    } else if (i === revealed) {
      row.classList.add("next");
      row.textContent = `● Indice ${i + 1} disponible`;
    } else {
      row.classList.add("locked");
      row.textContent = `○ Indice ${i + 1}`;
    }

    container.appendChild(row);
  }
}

function refreshHintModal(options = {}) {
  const { keepDisplayedHint = false } = options;
  const cardNumber = document.getElementById("hintCardNumber");
  const summary = document.getElementById("hintSummary");
  const hintText = document.getElementById("hintText");
  const hintCost = document.getElementById("hintCost");
  const revealButton = document.getElementById("revealHintButton");

  if (!keepDisplayedHint) {
    hintText.classList.add("hidden");
    hintText.textContent = "";
  }

  if (!selectedHintCard || !indices[selectedHintCard]) {
    cardNumber.textContent = "Sélectionnez une carte";
    document.getElementById("hintProgress").innerHTML = "";
    summary.innerHTML =
      "Saisissez ci-dessus le numéro ou la lettre de la carte pour laquelle vous souhaitez un indice.";
    hintCost.classList.add("hidden");
    revealButton.classList.add("hidden");
    return;
  }

  hintCardInput.value = selectedHintCard;
  cardNumber.textContent = `Carte ${selectedHintCard}`;

  const list = indices[selectedHintCard];
  const revealed = revealedHints[selectedHintCard] || 0;
  const remaining = list.length - revealed;

  renderHintProgress(list.length, revealed);

  if (revealed >= list.length) {
    summary.innerHTML =
      "<strong>Tous les indices ont été consultés.</strong><br>" +
      "Cliquez sur un indice coché pour le relire gratuitement.";
    hintCost.classList.add("hidden");
    revealButton.classList.add("hidden");
  } else {
    summary.innerHTML =
      `Indice suivant : <strong>${revealed + 1} / ${list.length}</strong><br>` +
      `Indices encore disponibles : <strong>${remaining}</strong><br>` +
      `Après consultation, il restera <strong>${remaining - 1}</strong> indice(s).`;

    hintCost.classList.remove("hidden");
    revealButton.classList.remove("hidden");
    revealButton.textContent =
      revealed === 0 ? "CONSULTER L'INDICE 1" : `CONSULTER L'INDICE ${revealed + 1}`;
  }
}

function openHintModal() {
  hintCardError.textContent = "";

  // Priorité au contenu actuellement saisi, même si ce n'est pas un code de destination.
  const typedCard = normalizeCardNumber(codeInput.value);
  if (typedCard && indices[typedCard]) {
    selectedHintCard = typedCard;
  } else if (!selectedHintCard && lastValidCode && indices[lastValidCode]) {
    selectedHintCard = lastValidCode;
  }

  hintCardInput.value = selectedHintCard || typedCard;
  refreshHintModal();
  hintModal.classList.remove("hidden");

  if (!selectedHintCard) {
    window.setTimeout(() => hintCardInput.focus(), 50);
  }
}

function revealHint() {
  if (!selectedHintCard || !indices[selectedHintCard]) return;

  const list = indices[selectedHintCard];
  const revealed = revealedHints[selectedHintCard] || 0;
  if (revealed >= list.length) return;

  subtractTime(HINT_COST_SECONDS);
  revealedHints[selectedHintCard] = revealed + 1;
  saveState();
  playEffect("hint", 0.55);

  const hintText = document.getElementById("hintText");
  hintText.innerHTML =
    `<strong>Indice ${revealed + 1}</strong><br><br>${list[revealed]}`;
  hintText.classList.remove("hidden");

  refreshHintModal({ keepDisplayedHint: true });
  setMessage(`Indice de la carte ${selectedHintCard} consulté : -2 minutes.`);
}

function closeHintModal() {
  hintModal.classList.add("hidden");
}

function resetGame() {
  const confirmed = confirm(
    "Réinitialiser le chrono, les indices, le dernier code et l'ambiance sonore ?"
  );

  if (!confirmed) return;

  stopTimerLoop();

  timeLeft = INITIAL_TIME;
  gameStarted = false;
  gamePaused = true;
  deadline = 0;

  lastValidCode = "";
  selectedHintCard = "";
  revealedHints = {};
  audioEnabled = false;
  currentSoundtrackKey = "intro";
  tensionTriggered = false;

  pauseAllAudio();
  audioA.currentTime = 0;
  audioB.currentTime = 0;

  localStorage.clear();

  renderTimer();
  updateAudioButton();
  updateSoundtrackLabel();
  updateStartPauseButton();
  setMessage("Partie réinitialisée.", true);

  codeInput.value = "";
  codeInput.focus();
}

startPauseButton.addEventListener("click", toggleStartPause);
document.getElementById("validateButton").addEventListener("click", validateCode);
document.getElementById("penaltyButton").addEventListener("click", () => applyPenalty());
document.getElementById("hintButton").addEventListener("click", openHintModal);
document.getElementById("audioToggle").addEventListener("click", toggleAudio);
document.getElementById("restartTrackButton").addEventListener("click", restartCurrentTrack);
document.getElementById("resetButton").addEventListener("click", resetGame);

document.getElementById("closeHintButton").addEventListener("click", closeHintModal);
document.getElementById("cancelHintButton").addEventListener("click", closeHintModal);
document.getElementById("revealHintButton").addEventListener("click", revealHint);

document.getElementById("loadHintCardButton").addEventListener("click", () => {
  selectHintCard(hintCardInput.value);
});

hintCardInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    selectHintCard(hintCardInput.value);
  }
});

codeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    validateCode();
  }
});

hintModal.addEventListener("click", (event) => {
  if (event.target === hintModal) {
    closeHintModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeHintModal();
  }
});

/*
  Restauration cohérente après actualisation :
  - partie en cours : calcul depuis la deadline ;
  - partie en pause : temps figé ;
  - ancienne sauvegarde sans deadline : mise en pause par sécurité.
*/
if (gameStarted && !gamePaused) {
  if (deadline > Date.now()) {
    syncTimeFromDeadline();
    startTimerLoop();
  } else if (deadline > 0) {
    timeLeft = 0;
    gamePaused = true;
    deadline = 0;
  } else {
    gamePaused = true;
  }
}

renderTimer();
updateAudioButton();
updateSoundtrackLabel();
updateStartPauseButton();

if (audioEnabled && gameStarted && !gamePaused) {
  startCurrentSoundtrack().catch(() => {});
}
