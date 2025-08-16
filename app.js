// ---------- helpers ----------
const $ = (sel) => document.querySelector(sel);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shuffle = (arr) => { const a = arr.slice(); for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const makeSessionId = () => "S-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8);
const cssVar = (name, fallback) => (getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback);

// =========================================================
// PRACTICE TRIALS (NOT RECORDED)
// =========================================================
window.PRACTICE_TRIALS = [
  {
    id: "P1",
    type: "neutral",
    lines: [
      "You are waiting at a bus stop.",
      "A person nearby checks their watch.",
      "A bus approaches from a distance.",
      "You wonder if it’s the one you need."
    ],
    options: [
      { label: "It’s arriving soon", valence: "neutral" },
      { label: "It’s going elsewhere", valence: "neutral" }
    ],
    record: false
  },
  {
    id: "P2",
    type: "neutral",
    lines: [
      "You and your partner plan dinner.",
      "A friend texts about meeting tomorrow.",
      "You check the fridge for ingredients.",
      "You think about what to cook tonight."
    ],
    options: [
      { label: "Pasta tonight", valence: "neutral" },
      { label: "Salad tonight", valence: "neutral" }
    ],
    record: false
  }
];

// ---------- cache DOM ----------
const screens = { instructions: $("#screen-instructions"), task: $("#screen-task"), results: $("#screen-results") };
const fixation = $("#fixation"); fixation.style.display = 'none';
const scenarioBox = $("#scenario");
const lines = [$("#line1"), $("#line2"), $("#line3"), $("#line4")];
const answersBox = $("#answers");
const btns = [$("#opt1"), $("#opt2")];
const confBox = $("#confidence");
const confBtns = Array.from(document.querySelectorAll(".conf"));

// results page elements
const metaLine = $("#metaLine");
const m_n = $("#m_n");
const m_benign = $("#m_benign");
const m_threat = $("#m_threat");
const m_prop_benign = $("#m_prop_benign");
const m_prop_threat = $("#m_prop_threat");
const m_rt_b_m = $("#m_rt_b_m");
const m_rt_b_sd = $("#m_rt_b_sd");
const m_rt_t_m = $("#m_rt_t_m");
const m_rt_t_sd = $("#m_rt_t_sd");
const m_conf_b_m = $("#m_conf_b_m");
const m_conf_t_m = $("#m_conf_t_m");
const m_pattern = $("#m_pattern");
const apaText = $("#apaText");
const dlCsv = $("#dlCsv");
const dlJson = $("#dlJson");
const copyApa = $("#copyApa");
const again = $("#again");

// chart canvases (optional; fine if null)
const ctxChoices = document.getElementById("chartChoices");
const ctxRT = document.getElementById("chartRT");
const ctxConf = document.getElementById("chartConf");
const ctxSeq = document.getElementById("chartSeq");

// ---------- trials ----------
const trials = (window.SCENARIOS || []).map((s) => ({
  id: `S${s.id}`,
  lines: s.lines,
  options: [
    { label: s.lines[3].replace("____", s.benign), valence: "benign" },
    { label: s.lines[3].replace("____", s.threat), valence: "threat" },
  ],
  record: true
}));

// ---------- state ----------
let participantId = "anon"; // <- FIX: no pidInput
let sessionId = makeSessionId();
let fullscreenOK = 0;
let deviceInfo = { userAgent: navigator.userAgent, width: window.innerWidth, height: window.innerHeight };
let results = [];
let choiceIdx = null;
let confidenceVal = null;
let rtChoiceStart = 0;
let rtConfStart = 0;

// ---------- UI helpers ----------
function showScreen(name){
  ["instructions", "task", "results"].forEach(n=>{
    const el = screens[n]; if(!el) return;
    if(n===name){ el.classList.add("show"); el.classList.remove("hidden"); }
    else { el.classList.remove("show"); el.classList.add("hidden"); }
  });
}

async function showFixation(ms = 700){ fixation.style.display='flex'; await sleep(ms); fixation.style.display='none'; }
async function showScenarioLines(textLines){
  lines.forEach((el)=>{ el.textContent=""; });
  lines[0].textContent = textLines[0]; await sleep(800);
  lines[1].textContent = textLines[1]; await sleep(800);
  lines[2].textContent = textLines[2]; await sleep(800);
  lines[3].textContent = textLines[3];
}
function showAnswers(opts){
  btns.forEach((b,i)=>{ b.disabled=false; b.textContent=opts[i].label; b.dataset.index=i; });
  answersBox.style.display="grid";
}
function hideAnswers(){ answersBox.style.display="none"; }
function showConfidence(){ confBox.classList.add("is-open"); }
function hideConfidence(){ confBox.classList.remove("is-open"); }

// ---------- trial flow ----------
function runTrial(trial, indexInBlock){
  return new Promise(async (resolve) => {
    scenarioBox.style.display = "none";
    hideAnswers();
    await showFixation(700);

    scenarioBox.style.display = "block";
    await showScenarioLines(trial.lines);

    showAnswers(trial.options);
    choiceIdx = null; confidenceVal = null;
    rtChoiceStart = performance.now();

    const onClickChoice = (e) => {
      const btn = e.target.closest(".answer-btn");
      if(!btn) return;
      commitChoice(Number(btn.dataset.index));
    };
    const onKeyChoice = (e) => { if (e.key === "1") commitChoice(0); if (e.key === "2") commitChoice(1); };
    answersBox.addEventListener("click", onClickChoice);
    window.addEventListener("keydown", onKeyChoice);

    async function commitChoice(idx){
      choiceIdx = idx;
      btns.forEach(b=> b.disabled = true);
      hideAnswers();

      rtConfStart = performance.now();
      showConfidence();

      const onClickConf = (e) => { const v = Number(e.currentTarget.dataset.val); if (v>=1 && v<=5) commitConfidence(v); };
      const onKeyConf = (e) => { if (["1","2","3","4","5"].includes(e.key)) commitConfidence(Number(e.key)); };
      confBtns.forEach(btn => btn.addEventListener("click", onClickConf));
      window.addEventListener("keydown", onKeyConf);

      function commitConfidence(v){
        confidenceVal = v;
        confBtns.forEach(btn => btn.removeEventListener("click", onClickConf));
        window.removeEventListener("keydown", onKeyConf);
        hideConfidence();
        answersBox.removeEventListener("click", onClickChoice);
        window.removeEventListener("keydown", onKeyChoice);

        scenarioBox.style.display = "none";
        answersBox.style.display = "none";

        if(trial.record){
          const chosen = trial.options[choiceIdx];
          const rec = {
            timestamp_iso: new Date().toISOString(),
            participant_id: participantId,
            session_id: sessionId,
            device_useragent: deviceInfo.userAgent,
            device_screen: `${deviceInfo.width}x${deviceInfo.height}`,
            fullscreen_ok: fullscreenOK ? 1 : 0,
            trial_order_index: indexInBlock,
            trial_id: trial.id,
            line1: trial.lines[0], line2: trial.lines[1], line3: trial.lines[2], line4: trial.lines[3],
            chosen_index: choiceIdx, chosen_label: chosen.label, chosen_valence: chosen.valence,
            rt_choice_ms: Math.round(performance.now() - rtChoiceStart),
            rt_conf_ms: Math.round(performance.now() - rtConfStart),
            confidence: Number(confidenceVal),
          };
          resolve(rec);
        } else {
          resolve(null); // practice trial not recorded
        }
      }
    }
  });
}

// ---------- start / finish ----------
async function startTask(){
  try {
    if (document.fullscreenElement == null) {
      await document.documentElement.requestFullscreen();
      fullscreenOK = 1;
    }
  } catch {
    fullscreenOK = 0;
  }

  showScreen("task");
  results = [];

  // Practice first
  for(let i=0;i<window.PRACTICE_TRIALS.length;i++){
    await runTrial(window.PRACTICE_TRIALS[i], i+1);
  }

  // Main block
  const order = shuffle(trials);
  for(let j=0;j<order.length;j++){
    const rec = await runTrial(order[j], j+1);
    if(rec) results.push(rec);
  }

  generateAndShowResults();
}

// ---------- CSV/JSON ----------
function resultsToCSV(rows){
  const header = [
    "timestamp_iso","participant_id","session_id","device_useragent","device_screen","fullscreen_ok",
    "trial_order_index","trial_id","line1","line2","line3","line4","chosen_index","chosen_label",
    "chosen_valence","rt_choice_ms","rt_conf_ms","confidence"
  ];
  const data = rows.map(r => header.map(h => (r[h] ?? "")));
  const csv = [header.join(","), ...data.map(row => row.map(escapeCSV).join(","))].join("\n");
  return csv;
}
function escapeCSV(val){
  const s = String(val);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
}

// ---------- summary / APA ----------
const mean = (xs) => xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : 0;
const sd = (xs) => { if (xs.length < 2) return 0; const m = mean(xs); const v = xs.reduce((s,x)=>s+(x-m)*(x-m),0)/(xs.length-1); return Math.sqrt(v); };
const round2 = (x) => (Math.round(x*100)/100).toFixed(2);

function computeSummary(rows){
  const n = rows.length;
  const benign = rows.filter(r=> r.chosen_valence==="benign");
  const threat = rows.filter(r=> r.chosen_valence==="threat");
  const nb = benign.length, nt = threat.length;
  const pb = n ? nb/n : 0, pt = n ? nt/n : 0;
  const rt_b = benign.map(r=>r.rt_choice_ms);
  const rt_t = threat.map(r=>r.rt_choice_ms);
  const conf_b = benign.map(r=>r.confidence);
  const conf_t = threat.map(r=>r.confidence);

  const pattern = pb > 0.55 ? "positive (benign-leaning)"
                 : pb < 0.45 ? "negative (threat-leaning)"
                 : "mixed / neutral";

  return {
    n, nb, nt, pb, pt,
    rt_b_m: mean(rt_b), rt_b_sd: sd(rt_b),
    rt_t_m: mean(rt_t), rt_t_sd: sd(rt_t),
    conf_b_m: mean(conf_b), conf_t_m: mean(conf_t),
    pattern
  };
}

function buildApaParagraph(s){
  return `In an online interpretation task with ${s.n} ambiguous partner-related health scenarios, 
  the participant selected benign completions on ${s.nb} trials (p = ${round2(s.pb)}), 
  and threat completions on ${s.nt} trials (p = ${round2(s.pt)}). 
  Reaction times are reported separately for benign and threat trials. 
  Mean confidence (1–5) was ${round2(s.conf_b_m)} for benign choices and ${round2(s.conf_t_m)} for threat choices. 
  Overall, the pattern suggests a ${s.pattern} interpretation tendency.`;
}

function renderResults(summary){
  metaLine.textContent = `Session ${sessionId}`;
  m_n.textContent = summary.n;
  m_benign.textContent = summary.nb;
  m_threat.textContent = summary.nt;
  m_prop_benign.textContent = round2(summary.pb);
  m_prop_threat.textContent = round2(summary.pt);
  m_rt_b_m.textContent = Math.round(summary.rt_b_m);
  m_rt_b_sd.textContent = Math.round(summary.rt_b_sd);
  m_rt_t_m.textContent = Math.round(summary.rt_t_m);
  m_rt_t_sd.textContent = Math.round(summary.rt_t_sd);
  m_conf_b_m.textContent = round2(summary.conf_b_m);
  m_conf_t_m.textContent = round2(summary.conf_t_m);
  m_pattern.textContent = summary.pattern;
  apaText.innerHTML = buildApaParagraph(summary);
}

// ---------- APA render + show ----------
function generateAndShowResults(){
  const summary = computeSummary(results);
  renderResults(summary);
  showScreen("results");
}

// ---------- downloads & actions ----------
dlCsv.addEventListener("click", () => {
  const csv = resultsToCSV(results);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `ib_task_${sessionId}.csv`; a.click();
  URL.revokeObjectURL(url);
});
dlJson.addEventListener("click", () => {
  const payload = { session_id: sessionId, device: deviceInfo, summary: computeSummary(results), trials: results };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `ib_task_${sessionId}.json`; a.click();
  URL.revokeObjectURL(url);
});
copyApa.addEventListener("click", async () => {
  const tmp = document.createElement("div");
  tmp.innerHTML = apaText.innerHTML.replace(/<[^>]+>/g, "");
  const text = tmp.textContent || tmp.innerText || "";
  await navigator.clipboard.writeText(text);
  alert("APA paragraph copied to clipboard.");
});
again.addEventListener("click", () => location.reload());

// ---------- begin button ----------
const btnBegin = $("#btn-begin");
if (btnBegin) {
  btnBegin.addEventListener("click", () => {
    showScreen("task");
    startTask();
  });
}
