let startTime = null;
let timerInterval = null;
let elapsed = 0;

let laps = JSON.parse(localStorage.getItem("laps")) || [];
let athletes = JSON.parse(localStorage.getItem("athletes")) || [];
let lapCount = {};

const resetBtn = document.getElementById("reset-btn");
const timerDisplay = document.getElementById("timer-display");
const startStopBtn = document.getElementById("start-stop");
const lapBtn = document.getElementById("lap-btn");
const athleteButtonsDiv = document.getElementById("athlete-buttons");
const lapTableBody = document.querySelector("#lap-table tbody");

timerDisplay.textContent = formatTime(0);

function formatTime(ms) {
  if (ms <= 0) return "0:00.00";
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(2).padStart(5, "0");
  return `${minutes}:${seconds}`;
}

function updateTimerDisplay() {
  if (startTime !== null) {
    elapsed = Date.now() - startTime;
    timerDisplay.textContent = formatTime(elapsed);
  }
}

function startTimer() {
    startStopBtn.textContent = "Stop";
  if (timerInterval) return;

  if (!startTime) {
    startTime = Date.now();
  }

  timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    timerDisplay.textContent = formatTime(elapsed);
  }, 100);

  saveTimerState();
}

function stopTimer() {
    startStopBtn.textContent = "Start";
  clearInterval(timerInterval);
  timerInterval = null;
  saveTimerState();
}

function confirmStopTimer() {
  if (!timerInterval) return;

  const confirmed = confirm("Are you sure you want to stop the timer?");
  if (confirmed) {
    stopTimer();
  }
}


function recordLap(athleteNumber = "") {
  if (startTime === null) return;

  const time = Date.now() - startTime;
  const lapNumber = athleteNumber ? (lapCount[athleteNumber] || 0) + 1 : null;
  const athlete = athletes.find(a => a.number === athleteNumber);
  const previousLap = laps.filter(l => l.athleteNumber === athleteNumber).slice(-1)[0];
  const split = previousLap ? time - previousLap.time : time;

  const lap = {
    id: Date.now(),
    time,
    split,
    athleteNumber,
    athleteName: athlete?.name || "",
    lapNumber
  };

  laps.unshift(lap); // Add to top
  if (athleteNumber) lapCount[athleteNumber] = lapNumber;
  saveData();
  renderLapTable();
  renderAthleteButtons();
  saveTimerState(); 
}

function renderAthleteButtons() {
  athleteButtonsDiv.innerHTML = "";
  athletes.forEach(a => {
    const done = lapCount[a.number] || 0;
    const total = a.laps || 0;

    const btn = document.createElement("button");
    btn.textContent = `#${a.number} ${done}/${total}`;

    if (done === total) {
      btn.classList.add("complete");
    } else if (done > total) {
      btn.classList.add("exceeded");
    }

    btn.onclick = () => recordLap(a.number);
    athleteButtonsDiv.appendChild(btn);
  });
}

function renderLapTable() {
  lapTableBody.innerHTML = "";
  laps.forEach((lap, index) => {
    const row = document.createElement("tr");
    const athlete = athletes.find(a => a.number === lap.athleteNumber);

    if (athlete) {
      const total = athlete.laps;
      const count = lapCount[athlete.number] || 0;

      if (count === total) {
        row.classList.add("completed");
      } else if (count > total) {
        row.classList.add("exceeded");
      }
    }

    const numberCell = document.createElement("td");
    const numberInput = document.createElement("input");
    numberInput.type = "text";
    numberInput.value = lap.athleteNumber || "";
    numberInput.size = 5;
    numberInput.onchange = () => updateLapNumber(index, numberInput.value.trim());
    numberCell.appendChild(numberInput);

    const nameCell = document.createElement("td");
    nameCell.textContent = lap.athleteName || "-";

    const lapCell = document.createElement("td");
    const total = lap.athleteNumber
      ? (athletes.find(a => a.number === lap.athleteNumber)?.laps || "")
      : "";
    lapCell.textContent = lap.lapNumber ? `${lap.lapNumber}/${total}` : "-";

    const timeCell = document.createElement("td");
    timeCell.textContent = formatTime(lap.time);

    const splitCell = document.createElement("td");
    splitCell.textContent = formatTime(lap.split);

    const deleteCell = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.textContent = "X";
    delBtn.onclick = () => deleteLap(index);
    deleteCell.appendChild(delBtn);

    row.append(numberCell, nameCell, lapCell, timeCell, splitCell, deleteCell);
    lapTableBody.appendChild(row);
  });
}

function updateLapNumber(index, newNumber) {
  laps[index].athleteNumber = newNumber || "";
  const athlete = athletes.find(a => a.number === newNumber);
  laps[index].athleteName = athlete?.name || "";

  recalculateLaps();
  saveData();
  renderLapTable();
  renderAthleteButtons();
}

function deleteLap(index) {
  laps.splice(index, 1);
  recalculateLaps();
  saveData();
  renderLapTable();
  renderAthleteButtons();
}

function recalculateLaps() {
  lapCount = {};
  const athleteLapGroups = {};

  laps.forEach(lap => {
    const num = lap.athleteNumber;
    if (!num) {
      lap.lapNumber = null;
      lap.split = lap.time;
      return;
    }

    if (!athleteLapGroups[num]) athleteLapGroups[num] = [];
    athleteLapGroups[num].push(lap);
  });

  Object.entries(athleteLapGroups).forEach(([number, group]) => {
    group.sort((a, b) => a.time - b.time);
    group.forEach((lap, i) => {
      lap.lapNumber = i + 1;
      lap.split = i === 0 ? lap.time : lap.time - group[i - 1].time;
    });
    lapCount[number] = group.length;
  });

  saveData();
  renderLapTable();
  renderAthleteButtons();
}

function saveData() {
  localStorage.setItem("laps", JSON.stringify(laps));
  localStorage.setItem("athletes", JSON.stringify(athletes));
}

function saveTimerState() {
  localStorage.setItem("timerState", JSON.stringify({
    startTime,
    running: !!timerInterval
  }));
}


function loadData() {
  const stored = localStorage.getItem("laps");
  laps = stored ? JSON.parse(stored) : [];
}

function loadTimerState() {
  const state = JSON.parse(localStorage.getItem("timerState"));
  if (!state || !state.startTime) return;

  startTime = state.startTime;

  if (state.running) {
    startTimer(); // resumes ticking
  } else {
    const elapsed = Date.now() - startTime;
    timerDisplay.textContent = formatTime(elapsed);
  }
}


startStopBtn.onclick = () => {
  if (timerInterval) confirmStopTimer();
  else startTimer();
};

lapBtn.onclick = () => recordLap("");

resetBtn.onclick = () => {
  if (!confirm("Reset all lap data and timer? This cannot be undone.")) return;

  laps = [];
  lapCount = {};
  elapsed = 0;
  startTime = null;
  stopTimer();
  timerDisplay.textContent = formatTime(0);

  localStorage.removeItem("laps");
  localStorage.removeItem("timerState");

  saveData();
  renderLapTable();
  renderAthleteButtons();
};

document.addEventListener("DOMContentLoaded", () => {
  loadTimerState();         // Restore timer
  loadData();               // Restore laps from localStorage
  recalculateLaps();        // Rebuild lapCount from laps
  renderLapTable();         // Show lap data
  renderAthleteButtons();   // Show athlete buttons with correct lap counts
});


renderAthleteButtons();
renderLapTable();
updateTimerDisplay();