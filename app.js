const PROPS = [
  { key: "gaduwa", name: "Gaduwa", units: ["Bronze", "Diamond", "Silver"] },
  {
    key: "garki_samthia",
    name: "Garki (Samthia)",
    units: [
      "101", "102", "103", "201", "202", "203", "301", "302", "303",
      "401", "402", "403", "501", "502", "503", "601", "602", "603"
    ]
  },
  {
    key: "gudu",
    name: "Gudu (Allybella)",
    units: ["101 (1 bed)", "102 (studio)", "104", "Big studio 103"]
  },
  { key: "ibeto", name: "Ibeto", units: ["France", "Ireland", "Italy", "Milan", "Spain"] },
  {
    key: "jahi",
    name: "Jahi",
    units: [
      "101", "102", "103", "104", "105",
      "201", "202", "203", "204", "205", "206"
    ]
  },
  {
    key: "mabushi",
    name: "Mabushi",
    units: [
      "101", "102", "103", "104", "105", "106",
      "201", "202", "203", "204",
      "301", "302", "303", "304",
      "401", "402", "403", "404", "405", "406"
    ]
  },
  {
    key: "wuye",
    name: "Wuye Block",
    units: [
      "101", "102", "103", "201", "202", "203", "301", "302", "303",
      "401", "402", "403", "501", "502", "503", "601", "602", "603"
    ]
  }
];

const STORAGE_KEY = "room_checklist_v1";
let state = {};
let activeFilter = "all";

function defaultState() {
  const s = {};
  PROPS.forEach(p => {
    p.units.forEach(u => {
      s[p.key + "||" + u] = {
        guest: "",
        avail: false,
        cin: false,
        cout: false,
        ext: false,
        notes: ""
      };
    });
  });
  return s;
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state = defaultState();
      Object.keys(parsed.state || {}).forEach(k => {
        if (state[k]) state[k] = { ...state[k], ...parsed.state[k] };
      });
      // Do NOT restore saved date — always use today's date (handled after load)
    } else {
      state = defaultState();
    }
  } catch (e) {
    state = defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state }));
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    document.getElementById("save-label").textContent = "Saved " + timeStr;
  } catch (e) {}
}

function toggle(key, field) {
  const s = state[key];
  if (!s) return;
  s[field] = !s[field];
  saveState();
  renderMain();
  updateStats();
}

function setGuest(key, val) {
  if (state[key]) {
    state[key].guest = val;
    saveState();
    updateStats();
  }
}

function setNotes(key, val) {
  if (state[key]) {
    state[key].notes = val;
    saveState();
  }
}

function tickAll(propKey, field) {
  const p = PROPS.find(x => x.key === propKey);
  if (!p) return;
  p.units.forEach(u => {
    const s = state[propKey + "||" + u];
    s.avail = false;
    s.cin = false;
    s.cout = false;
    s.ext = false;
    s[field] = true;
  });
  saveState();
  renderMain();
  updateStats();
}

function clearProp(propKey) {
  const p = PROPS.find(x => x.key === propKey);
  if (!p) return;
  p.units.forEach(u => {
    const s = state[propKey + "||" + u];
    s.avail = false;
    s.cin = false;
    s.cout = false;
    s.ext = false;
    s.guest = "";
    s.notes = "";
  });
  saveState();
  renderMain();
  updateStats();
}

function resetAll() {
  if (!confirm("Reset everything? All ticks, guest names and notes will be cleared.")) return;
  Object.values(state).forEach(s => {
    s.avail = false;
    s.cin = false;
    s.cout = false;
    s.ext = false;
    s.guest = "";
    s.notes = "";
  });
  saveState();
  renderMain();
  updateStats();
  document.getElementById("preview-panel").style.display = "none";
}

function chipClass(field) {
  return { avail: "on-avail", cin: "on-cin", cout: "on-cout", ext: "on-ext" }[field] || "";
}

function buildUnitRow(p, u) {
  const key = p.key + "||" + u;
  const s = state[key];
  const ac = s.avail ? " on-avail" : "";
  const cc = s.cin ? " on-cin" : "";
  const oc = s.cout ? " on-cout" : "";
  const ec = s.ext ? " on-ext" : "";
  return `<div class="unit-row">
    <span class="unit-label">${u}</span>
    <input class="guest-input" type="text" placeholder="Guest name" value="${s.guest.replace(/"/g, '&quot;')}"
      onchange="setGuest('${key}',this.value)">
    <div class="chips">
      <button class="chip${ac}" onclick="toggle('${key}','avail')">Available</button>
      <button class="chip${cc}" onclick="toggle('${key}','cin')">Check-in</button>
      <button class="chip${oc}" onclick="toggle('${key}','cout')">Check-out</button>
      <button class="chip${ec}" onclick="toggle('${key}','ext')">Extending</button>
    </div>
    <input class="notes-input" type="text" placeholder="Notes..." value="${s.notes.replace(/"/g, '&quot;')}"
      onchange="setNotes('${key}',this.value)" style="width:130px">
  </div>`;
}

function renderMain() {
  const props = activeFilter === "all" ? PROPS : PROPS.filter(p => p.key === activeFilter);
  document.getElementById("main").innerHTML = props.map(p => `
    <div class="prop-block">
      <div class="prop-header">
        <span class="prop-name">&#127970; ${p.name}</span>
        <div class="prop-actions">
          <button class="mini-btn mb-avail" onclick="tickAll('${p.key}','avail')">✓ All available</button>
          <button class="mini-btn mb-cin"   onclick="tickAll('${p.key}','cin')">✓ All check-in</button>
          <button class="mini-btn mb-cout"  onclick="tickAll('${p.key}','cout')">✓ All check-out</button>
          <button class="mini-btn mb-ext"   onclick="tickAll('${p.key}','ext')">✓ All extending</button>
          <button class="mini-btn mb-clear" onclick="clearProp('${p.key}')">✕ Clear</button>
        </div>
      </div>
      ${p.units.map(u => buildUnitRow(p, u)).join("")}
    </div>
  `).join("");
}

function renderFilterBar() {
  const btns = [`<button class="pf-btn active" onclick="setFilter('all',this)">All properties</button>`];
  PROPS.forEach(p => btns.push(`<button class="pf-btn" onclick="setFilter('${p.key}',this)">${p.name}</button>`));
  document.getElementById("filter-bar").innerHTML = btns.join("");
}

function setFilter(key, btn) {
  activeFilter = key;
  document.querySelectorAll(".pf-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderMain();
}

function updateStats() {
  const vals = Object.values(state);
  const a = vals.filter(s => s.avail).length;
  const ci = vals.filter(s => s.cin).length;
  const co = vals.filter(s => s.cout).length;
  const ex = vals.filter(s => s.ext).length;
  document.getElementById("stats-bar").innerHTML = `
    <div class="stat-pill"><span>${a}</span>available</div>
    <div class="stat-pill"><span>${ci}</span>check-in</div>
    <div class="stat-pill"><span>${co}</span>check-out</div>
    <div class="stat-pill"><span>${ex}</span>extending</div>
  `;
}

function generatePreview() {
  const date = document.getElementById("rep-date").value ||
    new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  let lines = ["*HOOLIO APARTMENTS — ROOM STATUS REPORT*", "Date: " + date];

  PROPS.forEach(p => {
    const avail = [], cin = [], cout = [], ext = [];
    p.units.forEach(u => {
      const s = state[p.key + "||" + u];
      const label = u + (s.guest ? " — " + s.guest : "") + (s.notes ? " (" + s.notes + ")" : "");
      if (s.avail) avail.push(label);
      if (s.cin) cin.push(label);
      if (s.cout) cout.push(label);
      if (s.ext) ext.push(label);
    });
    if (!avail.length && !cin.length && !cout.length && !ext.length) return;
    lines.push("", "📍 *" + p.name + "*");
    if (avail.length) { lines.push("🟢 Available"); avail.forEach(x => lines.push("  • " + x)); }
    if (cin.length) { lines.push("🔵 Check-in"); cin.forEach(x => lines.push("  • " + x)); }
    if (cout.length) { lines.push("🟡 Check-out"); cout.forEach(x => lines.push("  • " + x)); }
    if (ext.length) { lines.push("🟣 Extending"); ext.forEach(x => lines.push("  • " + x)); }
  });

  document.getElementById("preview-body").textContent = lines.join("\n");
  const panel = document.getElementById("preview-panel");
  panel.style.display = "block";
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
  document.getElementById("copied-msg").style.display = "none";
}

function copyText() {
  const text = document.getElementById("preview-body").textContent;
  navigator.clipboard.writeText(text).then(() => {
    const m = document.getElementById("copied-msg");
    m.style.display = "inline";
    setTimeout(() => { m.style.display = "none"; }, 3000);
  });
}

document.getElementById("rep-date").addEventListener("change", saveState);
document.getElementById("rep-date").addEventListener("input", saveState);

// Initialization
loadState();
// Always show today's date when the app is opened
document.getElementById("rep-date").value =
  new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
renderFilterBar();
renderMain();
updateStats();

// PWA Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        console.log("Service Worker registered successfully with scope:", reg.scope);
      })
      .catch((err) => {
        console.warn("Service Worker registration failed:", err);
      });
  });
}

// PWA Install Prompt Handling
let deferredPrompt = null;
const installBtn = document.getElementById("btn-install");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) {
    installBtn.style.display = "inline-flex";
  }
});

if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      installBtn.style.display = "none";
    }
    deferredPrompt = null;
  });
}

window.addEventListener("appinstalled", () => {
  if (installBtn) {
    installBtn.style.display = "none";
  }
  deferredPrompt = null;
  console.log("PWA installed successfully");
});

