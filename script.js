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
};

let timerId = null;

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
  elements.phaseName.textContent = isWork ? "作業時間" : "休憩時間";
  elements.phaseHint.textContent = `次は${nextPhase}に切り替わります`;
  elements.timeDisplay.textContent = formatTime(state.remainingSeconds);
  elements.progressBar.style.width = `${Math.max(progress, 0)}%`;

  if (state.status === "idle") {
    elements.statusText.textContent =
      "開始すると、終了するまで作業と休憩を交互に続けます。";
  }
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

function startTimer() {
  if (timerId !== null) {
    return;
  }

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
elements.stopButton.addEventListener("click", () => {
  stopTimer();
  elements.statusText.textContent =
    "タイマーを終了しました。設定した作業時間からやり直せます。";
});

render();
