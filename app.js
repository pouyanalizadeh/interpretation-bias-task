// ---------- helpers ----------
const $ = (sel) => document.querySelector(sel);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const makeSessionId = () =>
  "S-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);

// ---------- cache DOM ----------
const screens = {
  instructions: $("#screen-instructions"),
  task: $("#screen-task"),
  results: $("#screen-results"),
};
const fixation = $("#fixation");
const scenarioBox = $("#scenario");
const lines = [$("#line1"), $("#line2"), $("#line3"), $("#line4")];
const answersBox = $("#answers");
const btns = [$("#opt1"), $("#opt2")];
const confidenceBox = $("#confidence");
const confidenceInput = $("#confidence-range");
const confidenceValue = $("#confidence-value");
const resultsBox = $("#results");

// ---------- state ----------
let trials = []; // loaded scenarios
let currentTrial = null;
let trialIndex = -1;
let results = [];
let sessionId = makeSessionId();

// ---------- trial runner ----------
async function runTrial(trial) {
  // fixation
  fixation.style.display = "block";
  scenarioBox.style.display = "none";
  answersBox.style.display = "none";
  confidenceBox.style.display = "none";
  await sleep(1000);
  fixation.style.display = "none";

  // show scenario lines one by one
  scenarioBox.style.display = "block";
  for (let i = 0; i < 4; i++) {
    lines[i].textContent = trial.lines[i];
    lines[i].style.visibility = "visible";
    await sleep(1000);
  }

  // prepare answers in random order
  let options = shuffle([
    { text: trial.positive, type: "positive" },
    { text: trial.threat, type: "threat" },
  ]);
  btns.forEach((btn, i) => {
    btn.textContent = options[i].text;
    btn.dataset.type = options[i].type;
  });

  // show answers
  answersBox.style.display = "block";
  let startTime = performance.now();

  return new Promise((resolve) => {
    btns.forEach((btn) => {
      btn.onclick = () => {
        const rt = performance.now() - startTime;
        const choice = btn.dataset.type;

        // hide answers
        answersBox.style.display = "none";

        // confidence rating
        confidenceBox.style.display = "block";
        confidenceInput.value = 3;
        confidenceValue.textContent = "3";
        confidenceInput.oninput = () =>
          (confidenceValue.textContent = confidenceInput.value);

        $("#confidence-submit").onclick = () => {
          const conf = confidenceInput.value;
          confidenceBox.style.display = "none";
          resolve({ choice, rt, conf });
        };
      };
    });
  });
}

// ---------- main loop ----------
async function runTask() {
  results = [];
  for (trialIndex = 0; trialIndex < trials.length; trialIndex++) {
    currentTrial = trials[trialIndex];
    const res = await runTrial(currentTrial);
    results.push({
      trialId: currentTrial.id,
      choice: res.choice,
      rt: res.rt,
      confidence: res.conf,
    });
    await sleep(500);
  }
  showResults();
}

// ---------- results ----------
function showResults() {
  screens.task.style.display = "none";
  screens.results.style.display = "block";

  // aggregate
  const positives = results.filter((r) => r.choice === "positive").length;
  const negatives = results.filter((r) => r.choice === "threat").length;
  const avgRT =
    results.reduce((acc, r) => acc + r.rt, 0) / results.length || 0;
  const avgConf =
    results.reduce((acc, r) => acc + parseInt(r.conf), 0) / results.length || 0;

  resultsBox.innerHTML = `
    <h2>Results</h2>
    <p><b>Positive interpretations:</b> ${positives}</p>
    <p><b>Negative interpretations:</b> ${negatives}</p>
    <p><b>Average reaction time:</b> ${avgRT.toFixed(0)} ms</p>
    <p><b>Average confidence:</b> ${avgConf.toFixed(1)}/5</p>
    <canvas id="resultsChart"></canvas>
  `;

  // Chart.js visualization
  const ctx = $("#resultsChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Positive", "Negative", "Avg RT (ms)", "Avg Confidence"],
      datasets: [
        {
          label: "Results",
          data: [positives, negatives, avgRT, avgConf],
          backgroundColor: ["#4CAF50", "#F44336", "#2196F3", "#FFC107"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: "Task Performance" },
      },
      scales: { y: { beginAtZero: true } },
    },
  });
}

// ---------- init ----------
$("#start-btn").onclick = () => {
  screens.instructions.style.display = "none";
  screens.task.style.display = "block";
  runTask();
};

// ---------- dummy scenarios ----------
trials = shuffle([
  {
    id: "T1",
    lines: [
      "You call your partner, but they don’t answer.",
      "You wonder why they are not picking up.",
      "They usually answer quickly.",
      "This time, it’s different...",
    ],
    positive: "They are busy in a meeting.",
    threat: "They are ignoring you intentionally.",
  },
  {
    id: "T2",
    lines: [
      "Your partner is late coming home.",
      "It’s getting dark outside.",
      "They normally text you.",
      "You start to think...",
    ],
    positive: "They got stuck in traffic.",
    threat: "They are in an accident.",
  },
]);
