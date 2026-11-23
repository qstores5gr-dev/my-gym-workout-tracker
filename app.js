const STORAGE_KEY = "my-gym-profile-v1";
const HISTORY_KEY = "my-gym-history-v1";
const CYCLE_START_KEY = "my-gym-cycle-start-v1";
const WORKOUT_LOG_KEY = "my-gym-workout-log-v1";
if (!localStorage.getItem(CYCLE_START_KEY)) localStorage.setItem(CYCLE_START_KEY, new Date().toISOString().slice(0,10));
const days = [
  {number:"01",title:"Day 1 — Chest + Triceps",si:"පපුව සහ Triceps",desc:"Chest & Triceps workout"},
  {number:"02",title:"Day 2 — Legs",si:"කකුල්",desc:"Legs workout"},
  {number:"03",title:"Day 3 — Back + Biceps",si:"පිට සහ Biceps",desc:"Back & Biceps workout"},
  {number:"04",title:"Day 4 — Rest",si:"විවේක දිනය",desc:"Recovery, sleep & mobility"}
];
const $ = (id) => document.getElementById(id);
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
const profile = () => read(STORAGE_KEY, {});
function showTab(tab) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  const screen = $(tab + "Screen");
  if (screen) screen.classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});
  if (tab === "profile") fillForm();
  render();
}
document.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));
document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => showTab(b.dataset.go)));
$("profileShortcut").addEventListener("click", () => showTab("profile"));
function render() {
  const p = profile();
  const history = read(HISTORY_KEY, []);
  const workoutLogs = read(WORKOUT_LOG_KEY, []);
  $("weightStat").textContent = p.weight ? p.weight : "—";
  $("waistStat").textContent = p.waist ? p.waist : "—";
  $("sessionsStat").textContent = new Set(workoutLogs.map(x => x.date)).size + history.length;
  $("recordsStat").textContent = history.length;
  $("pWeight").textContent = p.weight ? p.weight + " kg" : "—";
  $("pWaist").textContent = p.waist ? p.waist + " in" : "—";
  $("pChest").textContent = p.chest ? p.chest + " in" : "—";
  $("pArm").textContent = p.arm ? p.arm + " in" : "—";
  const now = new Date();
  const start = new Date(localStorage.getItem(CYCLE_START_KEY) + "T00:00:00");
  const cycle = Math.floor((new Date(now.getFullYear(),now.getMonth(),now.getDate()) - start) / 86400000) % 4;
  const today = days[cycle];
  $("todayTitle").textContent = today.si;
  $("todayDescription").textContent = today.desc;
  $("todayTag").textContent = today.title.split(" — ")[0];
  $("dayList").innerHTML = days.map(d => `<article class="day-card"><div class="day-number">${d.number}</div><div class="day-copy"><strong>${d.title}</strong><small>${d.si}</small></div><span class="chevron">›</span></article>`).join("");
  const recentLogs = workoutLogs.slice().reverse().slice(0,8);
  $("historyEmpty").style.display = (history.length || workoutLogs.length) ? "none" : "block";
  $("historyList").innerHTML = recentLogs.map(item => `<div class="measure-row log-row"><label><strong>${escapeHtml(item.exercise)}</strong><small>${escapeHtml(item.day)} · ${escapeHtml(item.date)}</small></label><strong>${item.weight} kg · ${item.sets}×${item.reps}</strong></div>`).join("") + history.slice(0,5).map(item => `<div class="measure-row"><label>${escapeHtml(item.title)} · ${escapeHtml(item.date)}</label><strong>✓</strong></div>`).join("");
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function fillForm() {
  const p = profile();
  ["weight","waist","chest","arm"].forEach(k => { const field = document.querySelector(`[name="${k}"]`); if (field) field.value = p[k] || ""; });
}
$("measureForm").addEventListener("submit", e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.currentTarget).entries());
  const clean = {};
  Object.entries(data).forEach(([k,v]) => { if (v !== "") clean[k] = Number(v); });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  $("formMessage").textContent = "ඔබේ මිනුම් සාර්ථකව සුරැකුණා ✓";
  render();
});
render();
function getWorkoutWeight(form) {
  const mode = form.elements.loadMode.value;
  if (mode === "barbell") {
    const bar = Number(form.elements.barWeight.value || 0);
    const side = Number(form.elements.plateSide.value || 0);
    return bar + side * 2;
  }
  return Number(form.elements.totalWeight.value || 0);
}
function updateLoadDisplay() {
  const form = $("workoutForm");
  const mode = form.elements.loadMode.value;
  $("plateFields").hidden = mode !== "barbell";
  $("totalField").hidden = mode !== "total";
  $("calculatedWeight").textContent = getWorkoutWeight(form).toFixed(1).replace(/\\.0$/, "") + " kg";
}
function updatePreviousWorkout() {
  const name = $("workoutForm").elements.exercise.value.trim().toLowerCase();
  const match = read(WORKOUT_LOG_KEY, []).slice().reverse().find(x => x.exercise.toLowerCase() === name);
  $("previousWorkout").textContent = match
    ? `කලින් වාර්තාව: ${match.date} · ${match.weight} kg · ${match.sets} Sets × ${match.reps} Reps`
    : "මෙම ව්‍යායාමයට තවම කලින් වාර්තාවක් නැහැ.";
}
$("workoutForm").elements.loadMode.addEventListener("change", updateLoadDisplay);
["barWeight","plateSide"].forEach(name => $("workoutForm").elements[name].addEventListener("input", () => {
  updateLoadDisplay();
}));
$("workoutForm").elements.exercise.addEventListener("input", updatePreviousWorkout);
$("workoutForm").addEventListener("submit", e => {
  e.preventDefault();
  const form = e.currentTarget;
  const weight = getWorkoutWeight(form);
  if (!Number.isFinite(weight) || weight < 0 || (form.elements.loadMode.value === "total" && !form.elements.totalWeight.value)) {
    $("workoutMessage").textContent = "කරුණාකර නිවැරදි බර ඇතුළත් කරන්න.";
    return;
  }
  const logs = read(WORKOUT_LOG_KEY, []);
  logs.push({
    date: new Date().toLocaleDateString("en-CA"),
    day: form.elements.day.value,
    exercise: form.elements.exercise.value.trim(),
    weight: Number(weight.toFixed(1)),
    sets: Number(form.elements.sets.value),
    reps: Number(form.elements.reps.value)
  });
  localStorage.setItem(WORKOUT_LOG_KEY, JSON.stringify(logs));
  $("workoutMessage").textContent = "ව්‍යායාම වාර්තාව සුරැකුණා ✓";
  updatePreviousWorkout();
  render();
});
updateLoadDisplay();
