const STORAGE_KEY = "my-gym-profile-v1";
const HISTORY_KEY = "my-gym-history-v1";
const CYCLE_START_KEY = "my-gym-cycle-start-v1";
const WORKOUT_LOG_KEY = "my-gym-workout-log-v1";
if (!localStorage.getItem(CYCLE_START_KEY)) localStorage.setItem(CYCLE_START_KEY, new Date().toISOString().slice(0,10));
const days = [
  {number:"01",title:"Day 1 — Chest + Triceps",si:"පපුව සහ Triceps",desc:"පපුව සහ අත් පිටුපස මාංශපේශි",exercises:[["Barbell Bench Press","3 × 8–12"],["Incline Dumbbell Press","3 × 8–12"],["Dumbbell Floor Press","2 × 10–12"],["Lying Dumbbell Triceps Extension","2 × 10–12"],["Close Grip Push-up","2 × 8–12"]]},
  {number:"02",title:"Day 2 — Legs + Core",si:"කකුල් සහ උදරය",desc:"කකුල් සහ මධ්‍ය ශරීර මාංශපේශි",exercises:[["Goblet Squat","3 × 10–12"],["Dumbbell Romanian Deadlift","3 × 10–12"],["Reverse Lunge","2 × 10 / leg"],["Standing Calf Raise","3 × 15"],["Reverse Crunch","3 × 12"]]},
  {number:"03",title:"Day 3 — Back + Biceps",si:"පිට සහ Biceps",desc:"පිට සහ අත් ඉදිරිපස මාංශපේශි",exercises:[["One Arm Dumbbell Row","3 × 10 / side"],["Bent Over Barbell Row","3 × 8–12"],["EZ Bar Curl","3 × 10"],["Alternating Dumbbell Curl","2 × 10"],["Hammer Curl","2 × 10"]]},
  {number:"04",title:"Day 4 — Rest",si:"විවේක දිනය",desc:"සම්පූර්ණ විවේකය. ඉන්පසු Day 1 නැවත ආරම්භ කරන්න.",exercises:[]}
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
  $("recordsStat").textContent = workoutLogs.length;
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
  $("dayList").innerHTML = days.map(d => `<button type="button" class="day-card" data-day="${d.number}"><span class="day-number">${d.number}</span><span class="day-copy"><strong>${d.title}</strong><small>${d.si}</small></span><span class="chevron">›</span></button>`).join("");
  document.querySelectorAll("[data-day]").forEach(button => button.addEventListener("click", () => showDayDetail(button.dataset.day)));

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
  $("calculatedWeight").textContent = getWorkoutWeight(form).toFixed(1).replace(/\.0$/, "") + " kg";
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

function showDayDetail(number) {
  const day = days.find(item => item.number === number);
  if (!day) return;
  $("detailEyebrow").textContent = "DAY " + Number(day.number);
  $("detailTitle").textContent = day.title.split(" — ")[1];
  $("detailDescription").textContent = day.desc;
  $("exerciseList").innerHTML = day.exercises.length
    ? day.exercises.map((exercise, index) => `<div class="exercise-item"><span class="exercise-index">${index + 1}</span><span class="exercise-name">${escapeHtml(exercise[0])}</span><strong>${escapeHtml(exercise[1])}</strong></div>`).join("")
    : '<div class="rest-message">😴 අද සම්පූර්ණ විවේක දිනයක්. ශරීරයට යථා තත්ත්වයට පත්වීමට කාලය දෙන්න.</div>';
  $("dayDetail").hidden = false;
  $("dayDetail").scrollIntoView({behavior:"smooth",block:"start"});
}
$("closeDayDetail").addEventListener("click", () => { $("dayDetail").hidden = true; });
