// ---------- helpers ----------
const $ = (sel) => {
  const el = document.querySelector(sel);
  if (!el) console.error("Missing element:", sel);
  return el;
};
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
const startBtn = $("#start-btn");
const restartBtn = $("#restart");

// ---------- state ----------
let trials = [];
let trialIndex = -1;
let results = [];
let sessionId = makeSessionId();
let chartInstance = null;

// Safety guard: stop early if HTML is missing pieces
(function sanityCheck() {
  const required = [
    startBtn, screens.instructions, screens.task, screens.results,
    fixation, scenarioBox, answersBox, btns[0], btns[1],
    confidenceBox, confidenceInput, confidenceValue, resultsBox
  ];
  if (required.some((x) => !x)) {
    alert("Some required HTML elements are missing. Use the provided index.html structure.");
  }
})();

// ---------- trial runner ----------
async function runTrial(trial) {
  // Show fixation
  fixation.style.display = "block";
  scenarioBox.style.display = "none";
  answersBox.style.display = "none";
  confidenceBox.style.display = "none";
  await sleep(1000);
  fixation.style.display = "none";

  // Show scenario lines
  scenarioBox.style.display = "block";
  for (let i = 0; i < 4; i++) {
    lines[i].textContent = trial.lines[i];
    lines[i].style.visibility = "visible"; // keep fixed block height
    await sleep(1000);
  }

  // Prepare answers in random order (KEY FIX)
  let options = shuffle([
    { text: trial.positive, type: "positive" },
    { text: trial.threat, type: "threat" },
  ]);
  btns.forEach((btn, i) => {
    btn.textContent = options[i].text;
    btn.dataset.type = options[i].type;
  });

  // Show answers
  answersBox.style.display = "block";
  const startTime = performance.now();

  return new Promise((resolve) => {
    // Clear old handlers then bind fresh ones
    btns.forEach((b) => (b.onclick = null));
    btns.forEach((btn) => {
      btn.onclick = () => {
        const rt = performance.now() - startTime;
        const choice = btn.dataset.type;

        // Hide answers, show confidence
        answersBox.style.display = "none";
        confidenceBox.style.display = "flex";
        confidenceInput.value = 3;
        confidenceValue.textContent = "3";
        confidenceInput.oninput = () => (confidenceValue.textContent = confidenceInput.value);

        $("#confidence-submit").onclick = () => {
          const conf = Number(confidenceInput.value);
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
    const trial = trials[trialIndex];
    const res = await runTrial(trial);
    results.push({
      sessionId,
      trialId: trial.id,
      choice: res.choice,    // "positive" or "threat"
      rt: res.rt,            // ms
      confidence: res.conf,  // 1..5
    });
    await sleep(400);
  }
  showResults();
}

// ---------- results ----------
function showResults() {
  screens.task.style.display = "none";
  screens.results.style.display = "grid";

  const positives = results.filter((r) => r.choice === "positive").length;
  const negatives = results.filter((r) => r.choice === "threat").length;
  const avgRT = results.length ? results.reduce((a, r) => a + r.rt, 0) / results.length : 0;
  const avgConf = results.length ? results.reduce((a, r) => a + r.confidence, 0) / results.length : 0;

  resultsBox.innerHTML = `
    <h2>Results</h2>
    <p><b>Positive interpretations:</b> ${positives}</p>
    <p><b>Negative interpretations:</b> ${negatives}</p>
    <p><b>Average reaction time:</b> ${avgRT.toFixed(0)} ms</p>
    <p><b>Average confidence:</b> ${avgConf.toFixed(1)}/5</p>
    <canvas id="resultsChart" height="160"></canvas>
  `;

  // Destroy prior chart if any (prevents “expanding bars” crash)
  if (chartInstance && typeof chartInstance.destroy === "function") {
    chartInstance.destroy();
    chartInstance = null;
  }

  const canvas = document.getElementById("resultsChart");
  if (window.Chart && canvas) {
    const ctx = canvas.getContext("2d");
    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Positive", "Negative", "Avg RT (ms)", "Avg Confidence"],
        datasets: [{
          label: "Task Performance",
          data: [positives, negatives, avgRT, avgConf],
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 300 },
        plugins: {
          legend: { display: false },
          title: { display: true, text: "Performance Summary" },
          tooltip: { intersect: false, mode: "index" }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  if (restartBtn) {
    restartBtn.onclick = () => {
      // shuffle and rerun
      trials = shuffle(trials);
      screens.results.style.display = "none";
      screens.task.style.display = "block";
      runTask();
    };
  }
}

// ---------- init ----------
function start() {
  screens.instructions.style.display = "none";
  screens.task.style.display = "block";
  trials = shuffle(trials); // new order each run
  runTask();
}
if (startBtn) startBtn.onclick = start;

// ---------- demo scenarios (replace with your full set) ----------
trials = [
  {
    id: "T1",
    lines: [
      "You call your partner, but they don’t answer.",
      "You wonder why they are not picking up.",
      "They usually answer quickly.",
      "This time, it’s different..."
    ],
    positive: "They are busy in a meeting.",
    threat: "They are ignoring you intentionally."
  },
  {
    id: "T2",
    lines: [
      "Your partner is late coming home.",
      "It’s getting dark outside.",
      "They normally text you.",
      "You start to think..."
    ],
    positive: "They got stuck in traffic.",
    threat: "They are in an accident."
  }
];
