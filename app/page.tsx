"use client";

import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, CalendarDays,
  Check, CheckCircle2, ChevronDown, CircleHelp, Dumbbell, Flame,
  History, Pencil, Plus, Save, Search, Settings2, Sparkles, Target, Trash2, X,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import HomeIntroduction from "./Home/page";

type SetEntry = { weight: number | ""; reps: number | ""; completed: boolean };
type Exercise = { id: string; name: string; muscle: string; sets: SetEntry[] };
type Workout = {
  _id?: string;
  title: string;
  date: string;
  durationMinutes: number;
  volume: number;
  notes?: string;
  exercises: { name: string; muscle: string; sets: SetEntry[] }[];
};
type Plan = {
  _id?: string;
  name: string;
  focus: string;
  exercises: { name: string; muscle: string; sets: number; targetReps: string; restSeconds: number }[];
};
type View = "workout" | "plans" | "history" | "progress";

const navigation: { id: View; label: string; icon: typeof Dumbbell }[] = [
  { id: "workout", label: "Workout", icon: Dumbbell },
  { id: "plans", label: "Plans", icon: CalendarDays },
  { id: "history", label: "History", icon: History },
  { id: "progress", label: "Progress", icon: BarChart3 },
];

function currentTimestamp() {
  return Date.now();
}

export default function Home() {
  const [view, setView] = useState<View>("workout");
  const [showIntroduction, setShowIntroduction] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Workout | "all" | null>(null);
  const [deletingHistory, setDeletingHistory] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [title, setTitle] = useState("Untitled workout");
  const [draftTitle, setDraftTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [note, setNote] = useState("");
  const [exerciseName, setExerciseName] = useState("");
  const [planName, setPlanName] = useState("");
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [dbReady, setDbReady] = useState<boolean | null>(null);
  const [today, setToday] = useState("");
  const [clock, setClock] = useState<number | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState(4);
  const [weeklyGoalDraft, setWeeklyGoalDraft] = useState("4");
  const [editingWeeklyGoal, setEditingWeeklyGoal] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (window.location.hash === "#workout") setShowIntroduction(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!startedAt) return;
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 60000)), 30000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  async function loadData() {
    try {
      const [workoutResponse, planResponse] = await Promise.all([
        fetch("/api/workouts", { cache: "no-store" }), fetch("/api/plans", { cache: "no-store" }),
      ]);
      if (!workoutResponse.ok || !planResponse.ok) throw new Error("Database unavailable");
      const [workoutData, planData] = await Promise.all([workoutResponse.json(), planResponse.json()]);
      setWorkouts(workoutData.workouts ?? []);
      setPlans(planData.plans ?? []);
      setDbReady(true);
    } catch { setDbReady(false); }
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const savedGoal = window.localStorage.getItem("fitlog-weekly-goal");
      const parsedGoal = Number(savedGoal);
      if (savedGoal && Number.isInteger(parsedGoal) && parsedGoal >= 1 && parsedGoal < 8) {
        setWeeklyGoal(parsedGoal);
        setWeeklyGoalDraft(String(parsedGoal));
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const updateDeviceTime = () => {
      const currentTime = Date.now();
      setClock(currentTime);
      setToday(new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(currentTime));
    };
    const frame = window.requestAnimationFrame(updateDeviceTime);
    const clockTimer = window.setInterval(updateDeviceTime, 60000);
    window.addEventListener("focus", updateDeviceTime);
    const loadTimer = window.setTimeout(() => void loadData(), 0);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(clockTimer);
      window.removeEventListener("focus", updateDeviceTime);
      window.clearTimeout(loadTimer);
    };
  }, []);

  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const volume = exercises.reduce((sum, exercise) => sum + exercise.sets.reduce((subtotal, set) => subtotal + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0), 0);
  const weekSessions = clock === null ? 0 : workouts.filter((workout) => clock - new Date(workout.date).getTime() < 7 * 86400000).length;
  const allTimeVolume = workouts.reduce((sum, workout) => sum + workout.volume, 0);

  function saveWeeklyGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextGoal = Number(weeklyGoalDraft);
    if (!Number.isInteger(nextGoal) || nextGoal < 1 || nextGoal >= 8) {
      setWeeklyGoalDraft(String(weeklyGoal));
      return;
    }
    setWeeklyGoal(nextGoal);
    setWeeklyGoalDraft(String(nextGoal));
    window.localStorage.setItem("fitlog-weekly-goal", String(nextGoal));
    setEditingWeeklyGoal(false);
  }

  function beginSession() {
    if (!startedAt) setStartedAt(currentTimestamp());
  }

  function updateSet(exerciseId: string, setIndex: number, field: "weight" | "reps", value: string) {
    beginSession();
    setExercises((current) => current.map((exercise) => exercise.id !== exerciseId ? exercise : {
      ...exercise, sets: exercise.sets.map((set, index) => index !== setIndex ? set : { ...set, [field]: value === "" ? "" : Number(value) }),
    }));
  }

  function toggleSet(exerciseId: string, setIndex: number) {
    beginSession();
    setExercises((current) => current.map((exercise) => exercise.id !== exerciseId ? exercise : {
      ...exercise, sets: exercise.sets.map((set, index) => index !== setIndex ? set : { ...set, completed: !set.completed }),
    }));
  }

  function addSet(exerciseId: string) {
    setExercises((current) => current.map((exercise) => {
      if (exercise.id !== exerciseId) return exercise;
      const last = exercise.sets.at(-1);
      return { ...exercise, sets: [...exercise.sets, { weight: last?.weight ?? "", reps: last?.reps ?? "", completed: false }] };
    }));
  }

  function addExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = exerciseName.trim();
    if (!name) return;
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
    setExercises((current) => [...current, { id, name, muscle: "Custom exercise", sets: [{ weight: "", reps: "", completed: false }] }]);
    setExerciseName("");
    setShowExerciseModal(false);
  }

  function saveSessionTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = draftTitle.trim();
    if (!nextTitle) return;
    setTitle(nextTitle);
    setEditingTitle(false);
  }

  async function finishWorkout() {
    if (!exercises.length) return;
    setSaving(true);
    const workout: Workout = {
      title, date: new Date().toISOString(), durationMinutes: elapsed, volume: Math.round(volume), notes: note,
      exercises: exercises.map(({ name, muscle, sets }) => ({ name, muscle, sets })),
    };
    try {
      const response = await fetch("/api/workouts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(workout) });
      if (!response.ok) throw new Error("Save failed");
      const result = await response.json();
      setWorkouts((current) => [result.workout, ...current]);
      setNotice("Workout saved to your history.");
      setDbReady(true);
      setExercises([]);
      setTitle("Untitled workout");
      setNote("");
      setStartedAt(null);
      setElapsed(0);
    } catch { setNotice("Could not reach MongoDB. Your workout is still on this screen."); }
    finally {
      setSaving(false);
      window.setTimeout(() => setNotice(""), 4500);
    }
  }

  async function deleteConfirmedHistory() {
    if (!deleteTarget || deletingHistory) return;
    const deletingAll = deleteTarget === "all";
    const workoutId = deletingAll ? null : deleteTarget._id;
    if (!deletingAll && !workoutId) return;

    setDeletingHistory(true);
    setDeleteError("");
    try {
      const endpoint = deletingAll ? "/api/workouts?all=true" : `/api/workouts?id=${encodeURIComponent(workoutId ?? "")}`;
      const response = await fetch(endpoint, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");

      if (deletingAll) {
        setWorkouts([]);
        setExpandedWorkout(null);
      } else {
        setWorkouts((current) => current.filter((workout) => workout._id !== workoutId));
        setExpandedWorkout((current) => current === workoutId ? null : current);
      }
      setDeleteTarget(null);
      setNotice(deletingAll ? "All workout history deleted." : "Workout deleted.");
      window.setTimeout(() => setNotice(""), 4500);
    } catch {
      setDeleteError("Could not delete workout history. Please try again.");
    } finally {
      setDeletingHistory(false);
    }
  }

  async function savePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const plan: Plan = {
      name: planName.trim(), focus: "Strength · Upper body",
      exercises: exercises.map((exercise) => ({ name: exercise.name, muscle: exercise.muscle, sets: exercise.sets.length, targetReps: "8-12", restSeconds: 90 })),
    };
    if (!plan.name) return;
    try {
      const response = await fetch("/api/plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(plan) });
      if (!response.ok) throw new Error("Save failed");
      const result = await response.json();
      setPlans((current) => [result.plan, ...current.filter((item) => item.name !== result.plan.name)]);
      setShowPlanModal(false);
      setPlanName("");
      setNotice("Routine saved for next time.");
    } catch { setNotice("Could not reach MongoDB. Check your connection and try again."); }
    window.setTimeout(() => setNotice(""), 4500);
  }

  function startPlan(plan: Plan) {
    setTitle(plan.name);
    setExercises(plan.exercises.map((exercise, index) => ({
      id: `${exercise.name}-${index}-${Date.now()}`, name: exercise.name, muscle: exercise.muscle,
      sets: Array.from({ length: exercise.sets }, () => ({ weight: "" as const, reps: "" as const, completed: false })),
    })));
    setStartedAt(null);
    setElapsed(0);
    setView("workout");
  }

  function openWorkout() {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#workout`);
    setShowIntroduction(false);
  }

  if (showIntroduction) return <HomeIntroduction onOpenLog={openWorkout} />;

  return <main className="app-shell" id="workout">
    <aside className="sidebar">
      <a className="brand" href="#workout" onClick={() => setView("workout")} aria-label="FitLog home"><span className="brand-mark"><Activity size={19} /></span><span>fit<span>log</span></span></a>
      <div className="sidebar-label">TRAINING</div>
      <nav className="side-nav" aria-label="Main navigation">{navigation.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-link ${view === id ? "is-active" : ""}`} onClick={() => setView(id)}><Icon size={18} /><span>{label}</span>{id === view ? <span className="nav-live" /> : null}</button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-quote"><Sparkles size={16} /><p>Small lifts. Stronger days.</p><span>One set at a time.</span></div><button className="profile-button"><span className="avatar">A</span><span className="profile-copy"><strong>My training</strong><small>Personal log</small></span><Settings2 size={17} /></button></div>
    </aside>

    <div className="workspace">
      <header className="topbar"><div className="breadcrumb"><span>Training</span><span className="crumb-slash">/</span><strong>{navigation.find((item) => item.id === view)?.label}</strong></div><div className="topbar-right"><span className={`connection-dot ${dbReady === false ? "is-offline" : ""}`} /><span className="connection-label">{dbReady === null ? "Connecting" : dbReady ? "Synced" : "Offline mode"}</span><button className="icon-button" aria-label="Go to workout" title="Go to workout" onClick={() => setView("workout")}><Search size={18} /></button><button className="avatar avatar-small" aria-label="Profile">A</button></div></header>
      <div className="page-content">
        {view === "workout" && <>
          <section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />{today || "YOUR TRAINING, YOUR PACE"}</div><h1>Make today <span>count.</span></h1><p className="heading-subtitle">A little stronger than last time.</p></div><button className="button button-secondary" onClick={() => setShowPlanModal(true)}><Save size={16} /> Save as plan</button></section>
          <section className="stats-strip weekly-summary" aria-label="Weekly training goal">
            <div className="stat-cell weekly-summary-cell"><span className="stat-icon stat-icon-green"><Flame size={17} /></span><div><span className="stat-label">THIS WEEK</span><strong>{weekSessions}<small> sessions</small></strong></div>{editingWeeklyGoal ? <form className="weekly-goal-control" onSubmit={saveWeeklyGoal}><label><span>Sessions per week</span><input aria-label="Sessions per week" required type="number" min="1" max="7" step="1" autoFocus value={weeklyGoalDraft} onChange={(event) => setWeeklyGoalDraft(event.target.value)} /></label><button className="icon-button subtle-icon weekly-goal-action" type="submit" title="Save weekly goal" aria-label="Save weekly goal"><Save size={15} /></button><button className="icon-button subtle-icon weekly-goal-action" type="button" title="Cancel editing weekly goal" aria-label="Cancel editing weekly goal" onClick={() => { setWeeklyGoalDraft(String(weeklyGoal)); setEditingWeeklyGoal(false); }}><X size={15} /></button></form> : <div className="weekly-goal-control"><span>Sessions per week</span><strong>{weeklyGoal}</strong><button className="icon-button subtle-icon weekly-goal-action" type="button" title="Edit weekly goal" aria-label="Edit weekly goal" onClick={() => { setWeeklyGoalDraft(String(weeklyGoal)); setEditingWeeklyGoal(true); }}><Pencil size={15} /></button></div>}<div className="weekly-goal-progress" role="progressbar" aria-label="Weekly session goal progress" aria-valuemin={0} aria-valuemax={weeklyGoal} aria-valuenow={Math.min(weekSessions, weeklyGoal)}><i style={{ width: `${Math.min(weekSessions / weeklyGoal * 100, 100)}%` }} /></div></div>
          </section>
          <section className="training-layout"><div className="workout-column">
            <div className="workout-section-heading"><div><span className="section-kicker">YOUR SESSION</span>{editingTitle ? <form className="session-title-form" onSubmit={saveSessionTitle}><input aria-label="Session name" autoFocus maxLength={80} value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} /><button className="icon-button subtle-icon session-title-action" type="submit" title="Save session name" aria-label="Save session name"><Save size={15} /></button><button className="icon-button subtle-icon session-title-action" type="button" title="Cancel editing session name" aria-label="Cancel editing session name" onClick={() => setEditingTitle(false)}><X size={15} /></button></form> : <h2>{title}</h2>}</div>{!editingTitle && <button className="icon-button subtle-icon session-title-action" type="button" title="Edit session name" aria-label="Edit session name" onClick={() => { setDraftTitle(title); setEditingTitle(true); }}><Pencil size={15} /></button>}</div>
            <div className="workout-meta"><span><Dumbbell size={15} /> {exercises.length} exercises</span><span><Target size={15} /> {totalSets} sets planned</span></div>
            {exercises.length === 0 && <p className="exercise-empty">No exercises yet. Add one to start your session.</p>}
            <div className="exercise-list">{exercises.map((exercise, exerciseIndex) => <article className="exercise-card" key={exercise.id}>
              <div className="exercise-title-row"><span className="exercise-index">{String(exerciseIndex + 1).padStart(2, "0")}</span><div className="exercise-name-button"><strong>{exercise.name}</strong><span>{exercise.muscle}</span></div><button className="more-button" title="Remove exercise" aria-label={`Remove ${exercise.name}`} onClick={() => setExercises((current) => current.filter((item) => item.id !== exercise.id))}><Trash2 size={16} /></button></div>
              <div className="set-table"><div className="set-row set-table-head"><span>SET</span><span>PREVIOUS</span><span>KG</span><span>REPS</span><span>DONE</span></div>
                {exercise.sets.map((set, setIndex) => <div className={`set-row ${set.completed ? "set-complete" : ""}`} key={`${exercise.id}-${setIndex}`}><span className="set-number">{String(setIndex + 1).padStart(2, "0")}</span><span className="previous-value">{set.weight || "—"} × {set.reps || "—"}</span><label className="number-field"><span className="sr-only">Weight in kilograms, set {setIndex + 1}</span><input inputMode="decimal" type="number" min="0" step="0.5" value={set.weight} onChange={(event) => updateSet(exercise.id, setIndex, "weight", event.target.value)} /></label><label className="number-field"><span className="sr-only">Repetitions, set {setIndex + 1}</span><input inputMode="numeric" type="number" min="0" value={set.reps} onChange={(event) => updateSet(exercise.id, setIndex, "reps", event.target.value)} /></label><button className={`complete-set ${set.completed ? "is-complete" : ""}`} aria-label={`${set.completed ? "Undo" : "Complete"} set ${setIndex + 1} of ${exercise.name}`} onClick={() => toggleSet(exercise.id, setIndex)}>{set.completed ? <Check size={16} /> : null}</button></div>)}
              </div><button className="add-set-button" onClick={() => addSet(exercise.id)}><Plus size={14} /> Add set</button>
            </article>)}</div>
            <button className="add-exercise-button" onClick={() => setShowExerciseModal(true)}><span><Plus size={17} /></span>Add an exercise</button>
            <button className="button button-primary finish-button" onClick={finishWorkout} disabled={saving || !exercises.length}>{saving ? "Saving workout…" : "Finish workout"}<ArrowRight size={17} /></button>
          </div>
          <aside className="session-aside"><div className="aside-heading"><div><span className="section-kicker">AT A GLANCE</span><h3>Session notes</h3></div><button className="icon-button subtle-icon" aria-label="Session notes" title="Session notes"><CircleHelp size={17} /></button></div><label className="note-label" htmlFor="session-note">A thought for today</label><textarea id="session-note" className="note-input" placeholder="How are you feeling? Any cues to remember…" rows={4} value={note} onChange={(event) => setNote(event.target.value)} /><div className="tip-block"><span className="tip-mark">“</span><p>Progress isn’t always adding weight. Sometimes it’s showing up.</p><span>THE FITLOG NOTEBOOK</span></div></aside></section>
        </>}

        {view === "plans" && <section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />BUILT FOR YOUR RHYTHM</div><h1>Your <span>playbook.</span></h1><p className="heading-subtitle">Routines ready when you are.</p></div><button className="button button-primary" onClick={() => setShowPlanModal(true)}><Plus size={17} /> Save current workout</button><div className="full-width-content"><div className="content-toolbar"><div><span className="section-kicker">SAVED ROUTINES</span><h2>{plans.length ? `${plans.length} routines` : "Start with a routine"}</h2></div><span className="toolbar-note">Made to repeat, easy to change.</span></div>{plans.length ? <div className="plan-grid">{plans.map((plan) => <article className="plan-card" key={plan._id ?? plan.name}><div className="plan-card-top"><span className="plan-symbol"><Dumbbell size={19} /></span><button className="more-button" aria-label={`Start ${plan.name}`} onClick={() => startPlan(plan)}><ArrowRight size={17} /></button></div><span className="plan-focus">{plan.focus}</span><h3>{plan.name}</h3><p>{plan.exercises.map((exercise) => exercise.name).slice(0, 3).join(" · ")}</p><div className="plan-card-footer"><span>{plan.exercises.length} exercises</span><button onClick={() => startPlan(plan)}>Start routine <ArrowRight size={14} /></button></div></article>)}</div> : <div className="empty-state"><span className="empty-icon"><CalendarDays size={22} /></span><h3>No routines saved yet</h3><p>Build today’s workout once, then save it here to repeat anytime.</p><button className="button button-secondary" onClick={() => setView("workout")}>Go to workout <ArrowRight size={15} /></button></div>}</div></section>}

        {view === "history" && <section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />THE WORK YOU PUT IN</div><h1>It all <span>adds up.</span></h1><p className="heading-subtitle">Every session has a place here.</p></div><div className="history-total"><strong>{workouts.length}</strong><span>sessions logged</span></div><div className="full-width-content history-content"><div className="content-toolbar"><div><span className="section-kicker">PAST SESSIONS</span><h2>Your training timeline</h2></div><div className="history-toolbar-actions"><span className="toolbar-note">{allTimeVolume.toLocaleString()} kg moved all-time</span>{workouts.length > 0 && <button className="history-delete-all" type="button" onClick={() => { setDeleteError(""); setDeleteTarget("all"); }}><Trash2 size={15} /> Delete all</button>}</div></div>{workouts.length ? <div className="history-list">{workouts.map((workout) => {
          const workoutKey = workout._id ?? workout.date;
          const isExpanded = expandedWorkout === workoutKey;
          return <article className="history-entry" key={workoutKey}>
            <div className="history-entry-header">
            <button className="history-row" type="button" aria-expanded={isExpanded} onClick={() => setExpandedWorkout((current) => current === workoutKey ? null : workoutKey)}>
              <div className="history-date"><span>{new Date(workout.date).toLocaleDateString(undefined, { weekday: "short" }).toUpperCase()}</span><strong>{new Date(workout.date).getDate()}</strong><small>{new Date(workout.date).toLocaleDateString(undefined, { month: "short" })}</small></div>
              <div className="history-main"><h3>{workout.title}</h3><p>{workout.exercises.map((exercise) => exercise.name).join(" · ")}</p></div>
              <div className="history-detail"><span>{workout.exercises.length} exercises</span><span>{workout.durationMinutes} min</span></div>
              <div className="history-volume"><strong>{workout.volume.toLocaleString()}</strong><span>kg volume</span></div>
              {isExpanded ? <ChevronDown size={17} className="history-arrow" /> : <ArrowRight size={17} className="history-arrow" />}
            </button>
            <button className="history-delete-button" type="button" title="Delete workout" aria-label={`Delete ${workout.title} workout`} onClick={() => { setDeleteError(""); setDeleteTarget(workout); }}><Trash2 size={16} /></button>
            </div>
            {isExpanded && <div className="history-exercise-details">
              {workout.notes?.trim() && <section className="history-exercise"><div className="history-exercise-heading"><strong>Session notes</strong></div><p className="history-no-sets">{workout.notes}</p></section>}
              {workout.exercises.length ? workout.exercises.map((exercise, exerciseIndex) => <section className="history-exercise" key={`${exercise.name}-${exerciseIndex}`}>
                <div className="history-exercise-heading"><strong>{exercise.name}</strong>{exercise.muscle && exercise.muscle !== "Custom exercise" && <span>{exercise.muscle}</span>}</div>
                {exercise.sets.length ? <ol className="history-set-list">{exercise.sets.map((set, setIndex) => <li key={setIndex}><span>Set {setIndex + 1}</span><strong>{set.weight === "" ? "—" : set.weight} kg × {set.reps === "" ? "—" : set.reps} reps</strong><span className={set.completed ? "history-set-complete" : ""}>{set.completed ? "Completed" : "Not completed"}</span></li>)}</ol> : <p className="history-no-sets">No sets recorded.</p>}
              </section>) : <p className="history-no-sets">No exercises recorded.</p>}
            </div>}
          </article>;
        })}</div> : <div className="empty-state"><span className="empty-icon"><History size={22} /></span><h3>Your next session starts a story</h3><p>Finished workouts show up here, ready to compare whenever you need them.</p><button className="button button-secondary" onClick={() => setView("workout")}>Log a workout <ArrowRight size={15} /></button></div>}</div></section>}

        {view === "progress" && <section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />ZOOM OUT A LITTLE</div><h1>Look how far <span>you’ve come.</span></h1><p className="heading-subtitle">Consistency is a strength, too.</p></div><div className="progress-summary"><div className="progress-summary-main"><span className="section-kicker">TOTAL TRAINING VOLUME</span><strong>{allTimeVolume.toLocaleString()} <small>kg</small></strong><span className="progress-caption"><Activity size={15} /> Across {workouts.length} logged sessions</span></div><div className="progress-summary-side"><span className="summary-spark"><ArrowUpRight size={18} /></span><span>KEEP BUILDING</span><strong>{weekSessions}<small> sessions this week</small></strong></div></div><div className="progress-panels"><section className="chart-panel"><div className="chart-heading"><div><span className="section-kicker">YOUR CONSISTENCY</span><h2>Sessions, week by week</h2></div><span className="chart-period">LAST 6 WEEKS <ChevronDown size={13} /></span></div>{workouts.length && clock !== null ? <div className="bar-chart">{Array.from({ length: 6 }, (_, index) => { const start = clock - (5 - index) * 7 * 86400000; const count = workouts.filter((workout) => { const age = clock - new Date(workout.date).getTime(); return age >= (5 - index) * 7 * 86400000 && age < (6 - index) * 7 * 86400000; }).length; return <div className="chart-column" key={index}><span className="chart-count">{count || ""}</span><div className="bar-track"><i style={{ height: `${Math.max(count * 28, 5)}%` }} /></div><span className="chart-week">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(start))}</span></div>; })}</div> : <div className="chart-empty"><BarChart3 size={25} /><span>Log a few workouts to see your rhythm take shape.</span></div>}</section><section className="milestone-panel"><div><span className="section-kicker">A GOOD PLACE TO START</span><h2>Build your baseline</h2><p>Three sessions in a week is a strong start. Keep showing up and your trend line will appear here.</p></div><div className="milestone-progress"><div><span>WEEKLY TARGET</span><strong>{weekSessions}<small> / 3</small></strong></div><div className="milestone-track"><i style={{ width: `${Math.min(weekSessions / 3 * 100, 100)}%` }} /></div></div><div className="milestone-footer"><span className="milestone-icon"><Target size={17} /></span><span>One week at a time.</span><ArrowDownRight size={16} /></div></section></div></section>}
      </div>
    </div>

    <nav className="mobile-nav" aria-label="Mobile navigation">{navigation.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "mobile-active" : ""} onClick={() => setView(id)}><Icon size={19} /><span>{label}</span></button>)}</nav>
    {notice && <div className="toast" role="status"><CheckCircle2 size={18} />{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={16} /></button></div>}
    {showExerciseModal && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowExerciseModal(false); }}><form className="modal" onSubmit={addExercise}><button type="button" className="modal-close" aria-label="Close" onClick={() => setShowExerciseModal(false)}><X size={18} /></button><span className="section-kicker">BUILD YOUR SESSION</span><h2>Add an exercise</h2><p>Keep your workout moving. Add sets after.</p><label htmlFor="exercise-name">Exercise name</label><input id="exercise-name" autoFocus value={exerciseName} onChange={(event) => setExerciseName(event.target.value)} placeholder="e.g. Overhead press" /><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setShowExerciseModal(false)}>Cancel</button><button className="button button-primary" type="submit"><Plus size={16} /> Add exercise</button></div></form></div>}
    {showPlanModal && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowPlanModal(false); }}><form className="modal" onSubmit={savePlan}><button type="button" className="modal-close" aria-label="Close" onClick={() => setShowPlanModal(false)}><X size={18} /></button><span className="section-kicker">MAKE IT A ROUTINE</span><h2>Save this workout</h2><p>{exercises.length} exercises, ready to come back to.</p><label htmlFor="plan-name">Routine name</label><input id="plan-name" autoFocus required value={planName} onChange={(event) => setPlanName(event.target.value)} placeholder="e.g. Monday push" /><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setShowPlanModal(false)}>Cancel</button><button className="button button-primary" type="submit"><Save size={16} /> Save routine</button></div></form></div>}
    {deleteTarget && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !deletingHistory) setDeleteTarget(null); }}><section className="modal delete-confirmation" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description"><span className="section-kicker">PERMANENT ACTION</span><h2 id="delete-title">{deleteTarget === "all" ? "Delete all workout history?" : "Delete this workout?"}</h2><p id="delete-description">{deleteTarget === "all" ? `This will permanently delete all ${workouts.length} workouts and their exercise details.` : `This will permanently delete “${deleteTarget.title}” and its exercise details.`} This cannot be undone.</p>{deleteError && <p className="delete-error" role="alert">{deleteError}</p>}<div className="modal-actions"><button className="button button-secondary" type="button" disabled={deletingHistory} onClick={() => setDeleteTarget(null)}>Cancel</button><button className="button button-danger" type="button" disabled={deletingHistory} onClick={deleteConfirmedHistory}><Trash2 size={15} />{deletingHistory ? "Deleting…" : "Delete permanently"}</button></div></section></div>}
  </main>;
}
