const numberInput = document.getElementById("athlete-number");
const nameInput = document.getElementById("athlete-name");
const lapInput = document.getElementById("lap-count");
const addBtn = document.getElementById("add-athlete");
const list = document.getElementById("athlete-list");
const proceedBtn = document.getElementById("proceed-btn");
const csvInput = document.getElementById("csv-input");
const clearBtn = document.getElementById("clear-all");

let athletes = JSON.parse(localStorage.getItem("athletes")) || [];

function saveAthletes() {
    localStorage.setItem("athletes", JSON.stringify(athletes));
}

function renderList() {
    list.innerHTML = "";
    athletes.forEach((athlete, index) => {
    const li = document.createElement("li");

    const info = document.createElement("span");
    info.textContent = `${athlete.number}, ${athlete.name || ""}, ${athlete.laps} laps`;

    const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "✕";
        deleteBtn.className = "delete-btn";
        deleteBtn.dataset.index = index;
        deleteBtn.addEventListener("click", () => {
        athletes.splice(index, 1);
        saveAthletes();
        renderList();
    });

    li.appendChild(info);
    li.appendChild(deleteBtn);
    list.appendChild(li);
    });
}

addBtn.addEventListener("click", () => {
    const number = numberInput.value.trim();
    const name = nameInput.value.trim();
    const laps = parseInt(lapInput.value, 10);

    if (!number || isNaN(laps) || laps < 1) {
    alert("Please enter a valid athlete number and lap count.");
    return;
    }

    const duplicate = athletes.find(a => a.number === number);
    if (duplicate) {
    alert(`Athlete #${number} is already registered.`);
    return;
    }

    athletes.push({ number, name, laps });
    saveAthletes();
    renderList();

    numberInput.value = "";
    nameInput.value = "";
    lapInput.value = "";
});

proceedBtn.addEventListener("click", () => {
    if (athletes.length === 0) {
    alert("Add at least one athlete before proceeding.");
    return;
    }
    window.location.href = "timer.html";
});

csvInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const lines = e.target.result.split("\n").map(line => line.trim()).filter(Boolean);

        lines.forEach(line => {
        const [number, name = "", laps] = line.split(",").map(s => s.trim());
        const lapCount = parseInt(laps, 10);

        if (!number || isNaN(lapCount) || lapCount < 1) return;

        const duplicate = athletes.find(a => a.number === number);
        if (duplicate) return;

        athletes.push({ number, name, laps: lapCount });
        });

        saveAthletes();
        renderList();
    };
    reader.readAsText(file);
    });


clearBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all athletes? This will remove all athlete data. This cannot be undone.")) {
    athletes = [];
    saveAthletes();
    renderList();
    }
});

renderList();