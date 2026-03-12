const elements = {
  phasePanel: document.querySelector(".phase-panel"),
  phaseName: document.querySelector("#phaseName"),
  phaseHint: document.querySelector("#phaseHint"),
  timeDisplay: document.querySelector("#timeDisplay"),
  progressBar: document.querySelector("#progressBar"),
  statusText: document.querySelector("#statusText"),
  startButton: document.querySelector("#startButton"),
  pauseButton: document.querySelector("#pauseButton"),
  stopButton: document.querySelector("#stopButton"),
  workPreset: document.querySelector("#workPreset"),
  workMinutes: document.querySelector("#workMinutes"),
  breakPreset: document.querySelector("#breakPreset"),
  breakMinutes: document.querySelector("#breakMinutes"),
  notificationStatus: document.querySelector("#notificationStatus"),
  notificationButton: document.querySelector("#notificationButton"),
};

const state = {
  status: "idle",
  currentPhase: "work",
  remainingSeconds: 25 * 60,
  totalSeconds: 25 * 60,
  durations: {
    work: 25 * 60,
    break: 5 * 60,
  },
  notificationsEnabled: false,
};

let timerId = null;
let audioContext = null;

function getNotificationPermission() {
  if (!("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

function updateNotificationUI() {
  const permission = getNotificationPermission();

  if (permission === "unsupported") {
    elements.notificationStatus.textContent = "このブラウザではOS通知を利用できません";
    elements.notificationButton.textContent = "通知非対応";
    elements.notificationButton.disabled = true;
    return;
  }

  if (permission === "granted") {
    state.notificationsEnabled = true;
    elements.notificationStatus.textContent = "フェーズ切替時にOS通知と通知音を送ります";
    elements.notificationButton.textContent = "通知は有効です";
    elements.notificationButton.disabled = true;
    return;
  }

  if (permission === "denied") {
    state.notificationsEnabled = false;
    elements.notificationStatus.textContent =
      "OS通知は拒否されています。通知音のみ再生されます";
    elements.notificationButton.textContent = "通知は拒否中";
    elements.notificationButton.disabled = true;
    return;
  }

  state.notificationsEnabled = false;
  elements.notificationStatus.textContent =
    "フェーズ切替時に通知音を鳴らします。OS通知も有効化できます";
  elements.notificationButton.textContent = "通知を有効化";
  elements.notificationButton.disabled = false;
}

async function ensureAudioReady() {
  if (!window.AudioContext && !window.webkitAudioContext) {
    return null;
  }

  if (!audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioCtor();
  }

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  return audioContext;
}

async function playNotificationSound() {
  const context = await ensureAudioReady();
  if (!context) {
    return;
  }

  const now = context.currentTime;
  const notes = [
    { time: 0, frequency: 659.25, duration: 0.12, gain: 0.028 },
    { time: 0.09, frequency: 830.61, duration: 0.16, gain: 0.022 },
    { time: 0.2, frequency: 987.77, duration: 0.28, gain: 0.018 },
  ];

  notes.forEach((note) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(note.frequency, now + note.time);
    gainNode.gain.setValueAtTime(0.0001, now + note.time);
    gainNode.gain.exponentialRampToValueAtTime(note.gain, now + note.time + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      now + note.time + note.duration,
    );

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(now + note.time);
    oscillator.stop(now + note.time + note.duration);
  });
}

function sendNotification(nextPhase) {
  if (!state.notificationsEnabled || getNotificationPermission() !== "granted") {
    return;
  }

  const body =
    nextPhase === "work"
      ? "休憩が終わりました。次の作業セッションを始めましょう。"
      : "作業セッションが終わりました。少し休憩しましょう。";

  const notification = new Notification("Pomodoro Flow", {
    body,
    tag: "pomodoro-flow-phase-change",
    renotify: true,
  });

  window.setTimeout(() => notification.close(), 5000);
}

async function enableNotifications() {
  await ensureAudioReady();

  if (!("Notification" in window)) {
    updateNotificationUI();
    return;
  }

  const permission = await Notification.requestPermission();
  state.notificationsEnabled = permission === "granted";
  updateNotificationUI();

  if (permission === "granted") {
    elements.statusText.textContent =
      "通知を有効化しました。フェーズ切替時にOS通知と通知音を送ります。";
  }
}

function syncInputWithPreset(phase) {
  const preset = phase === "work" ? elements.workPreset : elements.breakPreset;
  const input = phase === "work" ? elements.workMinutes : elements.breakMinutes;
  input.value = preset.value;
}

function getMinutesValue(input) {
  const value = Number.parseInt(input.value, 10);
  return Number.isFinite(value) ? Math.min(Math.max(value, 1), 180) : 1;
}

function updateDurationsFromInputs() {
  state.durations.work = getMinutesValue(elements.workMinutes) * 60;
  state.durations.break = getMinutesValue(elements.breakMinutes) * 60;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function render() {
  const isWork = state.currentPhase === "work";
  const nextPhase = isWork ? "休憩" : "作業";
  const progress =
    state.totalSeconds === 0
      ? 0
      : ((state.totalSeconds - state.remainingSeconds) / state.totalSeconds) * 100;

  elements.phasePanel.dataset.phase = state.currentPhase;
  document.body.dataset.phase = state.currentPhase;
  elements.phaseName.textContent = isWork ? "作業時間" : "休憩時間";
  elements.phaseHint.textContent = `次は${nextPhase}に切り替わります`;
  elements.timeDisplay.textContent = formatTime(state.remainingSeconds);
  elements.progressBar.style.width = `${Math.max(progress, 0)}%`;

  if (state.status === "idle") {
    elements.statusText.textContent =
      "開始すると、終了するまで作業と休憩を交互に続けます。";
  }

  updateNotificationUI();
}

function resetPhase(phase) {
  state.currentPhase = phase;
  state.totalSeconds = state.durations[phase];
  state.remainingSeconds = state.durations[phase];
  render();
}

function applySettings() {
  updateDurationsFromInputs();
  if (state.status === "idle") {
    resetPhase(state.currentPhase);
  }
}

function stopTimer() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }

  state.status = "idle";
  resetPhase("work");
}

function advancePhase() {
  const nextPhase = state.currentPhase === "work" ? "break" : "work";
  state.currentPhase = nextPhase;
  state.totalSeconds = state.durations[nextPhase];
  state.remainingSeconds = state.durations[nextPhase];
  elements.statusText.textContent =
    nextPhase === "work"
      ? "休憩が終わりました。作業時間を再開します。"
      : "作業が終わりました。休憩に切り替わります。";
  playNotificationSound();
  sendNotification(nextPhase);
  render();
}

function tick() {
  if (state.remainingSeconds > 0) {
    state.remainingSeconds -= 1;
    render();
    return;
  }

  advancePhase();
}

async function startTimer() {
  if (timerId !== null) {
    return;
  }

  await ensureAudioReady();

  if (state.status === "idle") {
    applySettings();
  }

  state.status = "running";
  elements.statusText.textContent =
    "タイマーが動作中です。終了ボタンを押すまで、作業と休憩を繰り返します。";
  timerId = window.setInterval(tick, 1000);
}

function pauseTimer() {
  if (timerId === null) {
    return;
  }

  window.clearInterval(timerId);
  timerId = null;
  state.status = "paused";
  elements.statusText.textContent = "一時停止中です。再開すると現在のフェーズから続きます。";
}

elements.workPreset.addEventListener("change", () => {
  syncInputWithPreset("work");
  applySettings();
});

elements.breakPreset.addEventListener("change", () => {
  syncInputWithPreset("break");
  applySettings();
});

elements.workMinutes.addEventListener("change", applySettings);
elements.breakMinutes.addEventListener("change", applySettings);
elements.startButton.addEventListener("click", startTimer);
elements.pauseButton.addEventListener("click", pauseTimer);
elements.notificationButton.addEventListener("click", enableNotifications);
elements.stopButton.addEventListener("click", () => {
  stopTimer();
  elements.statusText.textContent =
    "タイマーを終了しました。設定した作業時間からやり直せます。";
});

render();
