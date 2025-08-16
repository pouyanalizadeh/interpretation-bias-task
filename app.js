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

// chart canvases
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

const btnBegin = $("#btn-begin");
if (btnBegin) {
  btnBegin.addEventListener("click", () => {
    showScreen("task");
    startTask();
  });
}
// ---------- state ----------
let participantId = "";
let sessionId = makeSessionId();
let fullscreenOK = 0;
let deviceInfo = { userAgent: navigator.userAgent, width: window.innerWidth, height: window.innerHeight };
let results = [];
let choiceIdx = null;
let confidenceVal = null;
let rtChoiceStart = 0;
let rtConfStart = 0;

// ---------- math helpers ----------
const mean = (xs) => xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : 0;
const sd = (xs) => { if (xs.length < 2) return 0; const m = mean(xs); const v = xs.reduce((s,x)=>s+(x-m)*(x-m),0)/(xs.length-1); return Math.sqrt(v); };
const percentile = (xs, p) => { if (!xs.length) return 0; const a = xs.slice().sort((x,y)=>x-y); const idx = Math.min(a.length-1, Math.max(0, Math.round((p/100)*(a.length-1)))); return a[idx]; };
const round2 = (x) => (Math.round(x*100)/100).toFixed(2);

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
function showAnswers(opts){ btns.forEach((b,i)=>{ b.disabled=false; b.textContent=opts[i].label; }); answersBox.style.display="grid"; }
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

        if(trial.record){ // ✅ only save if record==true
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
          resolve(null); // ✅ practice trial, no record
        }
      }
    }
  });
}

// ---------- start / finish ----------
async function startTask(){
  // No PID field on the page → default to "anon"
  participantId = (pidInput?.value || "anon");

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

  // 1) Run practice (not recorded)
  for(let i=0;i<window.PRACTICE_TRIALS.length;i++){
    await runTrial(window.PRACTICE_TRIALS[i], i+1);
  }

  // 2) Run main block
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
    pattern,
    arrays: { rt_b, rt_t, conf_b, conf_t }
  };
}

function buildApaParagraph(s){
  const faster = (s.rt_b_m && s.rt_t_m)
    ? (s.rt_b_m < s.rt_t_m ? "benign" : (s.rt_b_m > s.rt_t_m ? "threat" : "benign and threat at a similar speed"))
    : "benign and threat";
  const rtPart = (s.rt_b_m && s.rt_t_m)
    ? `Reaction time to choose was faster for ${faster} resolutions (<i>M</i> = ${Math.round(s.rt_b_m)} ms, <i>SD</i> = ${Math.round(s.rt_b_sd)}) compared to ${faster==="benign"?"threat":"benign"} (<i>M</i> = ${Math.round(s.rt_t_m)} ms, <i>SD</i> = ${Math.round(s.rt_t_sd)}).`
    : `Reaction times are summarized separately for benign and threat trials.`;

  return `In an online interpretation task with ${s.n} ambiguous partner-related health scenarios, the participant selected benign completions on ${s.nb} trials (p = ${round2(s.pb)}), and threat completions on ${s.nt} trials (p = ${round2(s.pt)}). ${rtPart} Mean confidence (1–5) was ${round2(s.conf_b_m)} for benign choices and ${round2(s.conf_t_m)} for threat choices. Overall, the pattern suggests a ${s.pattern} interpretation tendency based on the distribution of choices and response latencies.`;
}

function renderResults(summary){
  metaLine.textContent = `Participant ${participantId} • Session ${sessionId}`;
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

// ---------- charts ----------
let chartChoices, chartRT, chartConf, chartSeq;

function destroyCharts(){
  [chartChoices, chartRT, chartConf, chartSeq].forEach(ch => { try{ ch && ch.destroy(); }catch{} });
}

function renderCharts(summary){
  destroyCharts();
  if (!results.length) return;

  const GOOD = cssVar('--good', '#059669');
  const BAD  = cssVar('--bad',  '#e11d48');
  const ACC  = cssVar('--accent', '#111827');

  // 1) Choice composition — 100% stacked horizontal bar
  chartChoices = new Chart(ctxChoices, {
    type: 'bar',
    data: {
      labels: ['Choices (%)'],
      datasets: [
        { label: 'Benign', data: [summary.pb*100], backgroundColor: GOOD, borderWidth: 0, stack: 'comp' },
        { label: 'Threat', data: [summary.pt*100], backgroundColor: BAD,  borderWidth: 0, stack: 'comp' },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, indexAxis: 'y',
      scales: {
        x: { stacked: true, min: 0, max: 100, ticks: { callback: v => v + '%' } },
        y: { stacked: true }
      },
      plugins: {
        title: { display: true, text: 'Choice composition (100% stacked)' },
        legend: { position: 'bottom' }
      }
    }
  });

  // 2) RT distribution — stepped line histograms (benign vs threat)
  const allRT = results.map(r => r.rt_choice_ms).filter(v => Number.isFinite(v));
  const minRT = 0;
  const maxRT = Math.max(1200, Math.ceil(percentile(allRT, 95)/100)*100);
  const binW = 150;
  const bins = Math.max(3, Math.ceil((maxRT - minRT)/binW));
  const labels = Array.from({length: bins}, (_,i) => {
    const lo = minRT + i*binW, hi = lo + binW;
    return `${lo}–${hi} ms`;
  });
  const hist = (arr) => {
    const counts = new Array(bins).fill(0);
    arr.forEach(v => {
      let idx = Math.floor((v - minRT)/binW);
      if (idx < 0) idx = 0;
      if (idx >= bins) idx = bins - 1;
      counts[idx] += 1;
    });
    return counts;
  };
  const hB = hist(summary.arrays.rt_b);
  const hT = hist(summary.arrays.rt_t);

  chartRT = new Chart(ctxRT, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Benign', data: hB, borderColor: GOOD, backgroundColor: GOOD, fill: false, tension: 0, stepped: true },
        { label: 'Threat', data: hT, borderColor: BAD,  backgroundColor: BAD,  fill: false, tension: 0, stepped: true },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { title: { display: true, text: `RT distribution (bin ${binW} ms)` }, legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'Count' } } }
    }
  });

  // 3) Confidence by valence — means
  chartConf = new Chart(ctxConf, {
    type: 'bar',
    data: {
      labels: ['Benign', 'Threat'],
      datasets: [
        { label: 'Mean confidence', data: [summary.conf_b_m, summary.conf_t_m], backgroundColor: [GOOD, BAD] }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { title: { display: true, text: 'Mean confidence (1–5)' }, legend: { display: false } },
      scales: { y: { min: 1, max: 5, ticks: { stepSize: 1 } } }
    }
  });

  // 4) Trial sequence — scatter (benign=1, threat=0)
  const ptsB = results.filter(r=>r.chosen_valence==='benign').map(r => ({ x: r.trial_order_index, y: 1 }));
  const ptsT = results.filter(r=>r.chosen_valence==='threat').map(r => ({ x: r.trial_order_index, y: 0 }));
  chartSeq = new Chart(ctxSeq, {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'Benign', data: ptsB, pointRadius: 4, backgroundColor: GOOD },
        { label: 'Threat', data: ptsT, pointRadius: 4, backgroundColor: BAD  },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { title: { display: true, text: 'Choices over trials' }, legend: { position: 'bottom' } },
      scales: {
        x: { title: { display: true, text: 'Trial' }, ticks: { precision: 0 } },
        y: {
          min: -0.2, max: 1.2,
          ticks: {
            callback: (v) => (v === 1 ? 'Benign' : (v === 0 ? 'Threat' : ''))
          },
          grid: { drawBorder: false }
        }
      }
    }
  });
}

// ---------- APA render + show ----------
function generateAndShowResults(){
  const summary = computeSummary(results);
  renderResults(summary);
  renderCharts(summary);
  showScreen("results");
}

// ---------- downloads & actions ----------
function downloadCSV(){
  const csv = resultsToCSV(results);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `ib_task_${participantId}_${sessionId}.csv`; a.click();
  URL.revokeObjectURL(url);
}
function downloadJSON(){
  const payload = {
    participant_id: participantId,
    session_id: sessionId,
    device: deviceInfo,
    summary: computeSummary(results),
    trials: results,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `ib_task_${participantId}_${sessionId}.json`; a.click();
  URL.revokeObjectURL(url);
}
async function copyApaToClipboard(){
  const tmp = document.createElement("div");
  tmp.innerHTML = apaText.innerHTML.replace(/<[^>]+>/g, "");
  const text = tmp.textContent || tmp.innerText || "";
  await navigator.clipboard.writeText(text);
  alert("APA paragraph copied to clipboard.");
}
function printReport(){ window.print(); }

// ---------- events ----------
if (startBtn) startBtn.addEventListener("click", startTask);
if (pidInput) pidInput.addEventListener("keydown", (e) => { if (e.key === "Enter") startTask(); });
if (downloadBtn) downloadBtn.addEventListener("click", downloadCSV);
if (restartBtn) restartBtn.addEventListener("click", () => location.reload());
dlCsv.addEventListener("click", downloadCSV);
dlJson.addEventListener("click", downloadJSON);
copyApa.addEventListener("click", copyApaToClipboard);
printPdf.addEventListener("click", printReport);
again.addEventListener("click", () => location.reload());
