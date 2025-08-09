document.addEventListener("DOMContentLoaded", () => {
  const laps = JSON.parse(localStorage.getItem("laps") || "[]");
  const athletes = JSON.parse(localStorage.getItem("athletes") || "[]");

  const downloadBtn = document.getElementById("downloadCsvBtn");

  if (!laps.length || !athletes.length) {
    downloadBtn.disabled = true;
    downloadBtn.textContent = "No lap data available";
    return;
  }

  downloadBtn.addEventListener("click", () => {
    const csvRows = [
      "Athlete Number,Athlete Name,Total Laps,Lap Number,Time,Split"
    ];

    laps.forEach(lap => {
      const athlete = athletes.find(a => a.number === lap.athleteNumber);
      const row = [
        lap.athleteNumber || "",
        lap.athleteName || athlete?.name || "",
        athlete?.laps || "",
        lap.lapNumber || "",
        formatTime(lap.time),
        formatTime(lap.split)
      ].join(",");
      csvRows.push(row);
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "race_lap_times.csv";
    a.click();
    URL.revokeObjectURL(url);
  });

  function formatTime(ms) {
    if (!ms || ms <= 0) return "0:00.00";
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2).padStart(5, "0");
    return `${minutes}:${seconds}`;
  }
});

//Leaderboard Attempts

document.addEventListener("DOMContentLoaded", () => {
  const laps = JSON.parse(localStorage.getItem("laps") || "[]");
  const athletes = JSON.parse(localStorage.getItem("athletes") || "[]");
  const leaderboardsDiv = document.getElementById("leaderboards");

  if (!laps.length || !athletes.length) {
    leaderboardsDiv.textContent = "No leaderboard data available.";
    return;
  }

  const athleteLapMap = {};
  laps.forEach(lap => {
    if (!lap.athleteNumber) return;
    if (!athleteLapMap[lap.athleteNumber]) athleteLapMap[lap.athleteNumber] = [];
    athleteLapMap[lap.athleteNumber].push(lap);
  });

  const athleteResults = [];
  for (const athlete of athletes) {
    const lapList = athleteLapMap[athlete.number] || [];
    lapList.sort((a, b) => a.lapNumber - b.lapNumber);

    const splits = lapList.map(lap => lap.split);
    const totalMs = splits.reduce((sum, split) => sum + split, 0);
    const isComplete = lapList.length >= athlete.laps;

    athleteResults.push({
      number: athlete.number,
      name: athlete.name,
      laps: athlete.laps,
      splits,
      totalMs,
      totalTime: formatTime(totalMs),
      isComplete
    });
  }

  const grouped = {};
  athleteResults.forEach(result => {
    const key = result.laps;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(result);
  });

  const allExportData = [];

  const exportAllBtn = document.createElement("button");
  exportAllBtn.textContent = "Export All Leaderboards";
  exportAllBtn.addEventListener("click", () => {
    if (!allExportData.length) return;

    const headers = ["Lap Count", "Rank", "Name", "Number", "Total Time", "Splits"];
    const rows = allExportData.map(row => {
      return [
        row.lapCount,
        row.rank || "",
        row.name,
        row.number,
        row.totalTime,
        row.splits.join(" | ")
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${val}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `all_leaderboards.csv`;
    link.click();
    URL.revokeObjectURL(url);
  });

  leaderboardsDiv.appendChild(exportAllBtn);

  for (const [lapCount, group] of Object.entries(grouped)) {
    const complete = group.filter(a => a.isComplete).sort((a, b) => a.totalMs - b.totalMs);
    const incomplete = group.filter(a => !a.isComplete);
    const fullGroup = [...complete, ...incomplete];
    renderLeaderboard(lapCount, fullGroup);
    renderExportButton(lapCount, fullGroup);

    fullGroup.forEach((athlete, index) => {
      allExportData.push({
        lapCount,
        rank: athlete.isComplete ? index + 1 : "",
        name: athlete.name,
        number: athlete.number,
        totalTime: athlete.totalTime,
        splits: Array.from({ length: athlete.laps }, (_, i) => formatTime(athlete.splits[i]))
      });
    });
  }

  function renderLeaderboard(lapCount, group) {
    const section = document.createElement("section");
    const heading = document.createElement("h2");
    heading.textContent = `${lapCount}-Lap Leaderboard`;
    section.appendChild(heading);

    const table = document.createElement("table");
    const headerRow = document.createElement("tr");
    ["Rank", "Name", "Number", "Total Time", ...Array.from({ length: lapCount }, (_, i) => `Split ${i + 1}`)].forEach(text => {
      const th = document.createElement("th");
      th.textContent = text;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    group.forEach((athlete, index) => {
      const row = document.createElement("tr");
      const rank = athlete.isComplete ? index + 1 : "-";
      const splitCells = Array.from({ length: athlete.laps }, (_, i) => formatTime(athlete.splits[i]));

      [rank, athlete.name, athlete.number, athlete.totalTime, ...splitCells].forEach(value => {
        const td = document.createElement("td");
        td.textContent = value || "-";
        row.appendChild(td);
      });

      if (!athlete.isComplete) row.classList.add("incomplete");
      table.appendChild(row);
    });

    section.appendChild(table);
    leaderboardsDiv.appendChild(section);
  }

  function renderExportButton(lapCount, group) {
    const button = document.createElement("button");
    button.textContent = `Export ${lapCount}-Lap Leaderboard`;
    button.addEventListener("click", () => {
      const headers = ["Rank", "Name", "Number", "Total Time", ...Array.from({ length: lapCount }, (_, i) => `Split ${i + 1}`)];
      const rows = group.map((athlete, index) => {
        const rank = athlete.isComplete ? index + 1 : "";
        const splits = Array.from({ length: athlete.laps }, (_, i) => formatTime(athlete.splits[i]));
        return [rank, athlete.name, athlete.number, athlete.totalTime, ...splits];
      });

      const csvContent = [headers, ...rows]
        .map(row => row.map(val => `"${val}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `leaderboard_${lapCount}_laps.csv`;
      link.click();
      URL.revokeObjectURL(url);
    });

    leaderboardsDiv.appendChild(button);
  }

  function formatTime(ms) {
    if (!ms || ms <= 0) return "-";
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2).padStart(5, "0");
    return `${minutes}:${seconds}`;
  }
});