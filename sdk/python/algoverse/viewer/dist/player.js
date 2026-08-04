/**
 * Embedded Trace Player — Trace v0.1 array path only.
 * Driven by GET /api/trace (populated via POST /api/load-trace from the SDK).
 */

const EVENT_TITLES = {
  compare: "Compare",
  swap: "Swap",
  assign: "Assign",
  call: "Enter",
  return: "Return",
  line: "Line",
  highlight: "Highlight",
};

const KIND_COLORS = {
  comparing: "#60a5fa",
  swapped: "#f87171",
  selected: "#fbbf24",
  sorted: "#34d399",
  pivot: "#c084fc",
  found: "#4ade80",
  current: "#fb923c",
  searching: "#38bdf8",
  left: "#60a5fa",
  right: "#f472b6",
  merged: "#818cf8",
  minimum: "#fbbf24",
  active: "#2ee6a6",
  visited: "#a78bfa",
  write: "#818cf8",
};

const DEFAULT_BAR = "#3a4a63";
const BASE_MS = 900;

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

function emptyFrame(algorithm, array) {
  return {
    step: -1,
    line: 0,
    algorithm,
    variables: {},
    structures: { array: clone(array || []) },
    highlights: { indices: [], indexKinds: {}, sorted: [], nodes: [], edges: [] },
    operation: "init",
    description: "",
    callStack: [],
  };
}

function applyEvent(frame, event) {
  const f = clone(frame);
  f.operation = event.type;
  if (typeof event.line === "number") f.line = event.line;
  if (typeof event.description === "string") f.description = event.description;
  else f.description = "";

  const d = event.data || {};
  switch (event.type) {
    case "assign":
      f.variables[d.name] = d.value;
      break;
    case "compare": {
      f.variables.__compare = [d.i, d.j];
      f.highlights.indexKinds = { [d.i]: "comparing", [d.j]: "comparing" };
      f.highlights.indices = [d.i, d.j];
      if (!f.description) {
        const vals = d.values;
        f.description =
          vals && vals.length >= 2
            ? `Compare ${vals[0]} and ${vals[1]}`
            : `Compare [${d.i}] and [${d.j}]`;
      }
      break;
    }
    case "swap": {
      const arr = f.structures.array;
      if (Array.isArray(arr) && arr[d.i] !== undefined && arr[d.j] !== undefined) {
        const tmp = arr[d.i];
        arr[d.i] = arr[d.j];
        arr[d.j] = tmp;
      }
      f.highlights.indexKinds = { [d.i]: "swapped", [d.j]: "swapped" };
      f.highlights.indices = [d.i, d.j];
      if (!f.description) f.description = `Swap [${d.i}] and [${d.j}]`;
      break;
    }
    case "call":
      f.callStack = [...(f.callStack || []), d.frame];
      if (d.args && typeof d.args === "object") {
        for (const [k, v] of Object.entries(d.args)) f.variables[k] = v;
      }
      if (!f.description) f.description = `Enter ${d.frame}`;
      break;
    case "return":
      f.callStack = (f.callStack || []).slice(0, -1);
      if (d.value !== undefined) f.variables.__return = d.value;
      if (!f.description) f.description = `Return from ${d.frame}`;
      break;
    case "line":
      f.line = d.line;
      break;
    case "highlight":
      if (d.clear) {
        f.highlights = {
          indices: [],
          indexKinds: {},
          sorted: [],
          nodes: [],
          edges: [],
        };
      } else {
        const kinds = {};
        if (d.kinds) {
          for (const [k, v] of Object.entries(d.kinds)) kinds[Number(k)] = v;
        }
        f.highlights.indexKinds = kinds;
        f.highlights.indices = d.indices || Object.keys(kinds).map(Number);
        if (d.sorted) f.highlights.sorted = d.sorted;
      }
      break;
    default:
      break;
  }
  return f;
}

function reduceTrace(doc) {
  const seed = doc.metadata?.initial?.array || [];
  let cur = emptyFrame(doc.algorithm, seed);
  const frames = [];
  (doc.events || []).forEach((event, i) => {
    cur = applyEvent(cur, event);
    cur.step = i;
    frames.push(clone(cur));
  });
  return frames;
}

function titleFor(event) {
  if (!event) return "Ready";
  if (event.type === "highlight") {
    if (event.data?.clear) return "Clear highlights";
    const kinds = Object.values(event.data?.kinds || {});
    if (kinds.includes("sorted") || (event.data?.sorted || []).length) return "Mark complete";
    if (kinds.includes("visited")) return "Visit";
    if (kinds.includes("write")) return "Update";
  }
  return EVENT_TITLES[event.type] || event.type;
}

function barColor(i, kinds, sorted) {
  const k = kinds?.[i];
  if (k && KIND_COLORS[k]) return KIND_COLORS[k];
  if (sorted?.includes(i)) return KIND_COLORS.sorted;
  return DEFAULT_BAR;
}

const state = {
  doc: null,
  frames: [],
  step: 0,
  playing: false,
  speed: 1,
  timer: null,
};

const $ = (id) => document.getElementById(id);

function render() {
  const frames = state.frames;
  const frame = frames[state.step];
  const event = state.doc?.events?.[state.step];
  const empty = $("empty");
  const bars = $("bars");

  if (!frame) {
    empty.style.display = "block";
    bars.innerHTML = "";
    $("title").textContent = "Waiting for trace…";
    $("meta").textContent = "";
    $("status").textContent = "Idle";
    $("status").classList.remove("live");
    $("op").textContent = "—";
    $("desc").textContent = "No step yet.";
    $("changed").innerHTML = "";
    $("vars").textContent = "{}";
    $("hud").textContent = "";
    $("step-label").textContent = "—";
    $("scrub").max = 0;
    $("scrub").value = 0;
    return;
  }

  empty.style.display = "none";
  $("status").textContent = "Live";
  $("status").classList.add("live");
  $("title").textContent = state.doc.algorithm || "Trace";
  $("meta").textContent = `${state.doc.language || ""} · ${frames.length} steps`.trim();

  const arr = frame.structures.array || [];
  const kinds = frame.highlights.indexKinds || {};
  const sorted = frame.highlights.sorted || [];
  const nums = arr.filter((v) => typeof v === "number");
  const maxV = nums.length ? Math.max(...nums, 1) : 1;

  bars.innerHTML = "";
  arr.forEach((value, i) => {
    const color = barColor(i, kinds, sorted);
    const h =
      typeof value === "number" ? Math.max((value / maxV) * 180, 12) : 56;
    const col = document.createElement("div");
    col.className = "bar-col";
    col.innerHTML = `
      <span class="bar-val" style="color:${color}">${value}</span>
      <div class="bar" style="height:${h}px;background:${color};opacity:${
        kinds[i] || sorted.includes(i) ? 1 : 0.55
      }"></div>
      <span class="bar-idx" style="color:${color}">${i}</span>`;
    bars.appendChild(col);
  });

  $("hud").textContent = `step ${frame.step}${
    frame.line > 0 ? ` · L${frame.line}` : ""
  }`;
  $("op").textContent = titleFor(event);
  $("desc").textContent = frame.description || "Execution advanced one step.";

  const changed = [];
  if (event?.type === "compare") changed.push(`[${event.data.i}] vs [${event.data.j}]`);
  if (event?.type === "swap") changed.push(`[${event.data.i}] ↔ [${event.data.j}]`);
  if (event?.type === "assign")
    changed.push(`${event.data.name} = ${JSON.stringify(event.data.value)}`);
  if (event?.type === "call") changed.push(`enter ${event.data.frame}`);
  if (event?.type === "return") changed.push(`leave ${event.data.frame}`);
  $("changed").innerHTML = changed.map((c) => `<li>${c}</li>`).join("");

  const vars = {};
  for (const [k, v] of Object.entries(frame.variables || {})) {
    if (!k.startsWith("__")) vars[k] = v;
  }
  $("vars").textContent = JSON.stringify(vars, null, 2);

  $("step-label").textContent = `Step ${state.step + 1} / ${frames.length}`;
  $("scrub").max = Math.max(frames.length - 1, 0);
  $("scrub").value = state.step;
  $("btn-play").textContent = state.playing ? "❚❚" : "▶";
}

function jump(i) {
  if (!state.frames.length) return;
  state.step = Math.max(0, Math.min(i, state.frames.length - 1));
  render();
}

function stopTimer() {
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
}

function tick() {
  stopTimer();
  if (!state.playing || !state.frames.length) return;
  if (state.step >= state.frames.length - 1) {
    state.playing = false;
    render();
    return;
  }
  jump(state.step + 1);
  const ms = Math.max(16, BASE_MS / state.speed);
  state.timer = setTimeout(tick, ms);
}

function loadDoc(doc) {
  state.doc = doc;
  state.frames = reduceTrace(doc);
  state.step = 0;
  state.playing = false;
  stopTimer();
  render();
}

async function fetchTrace() {
  try {
    const res = await fetch("/api/trace", { cache: "no-store" });
    if (!res.ok) return false;
    const doc = await res.json();
    if (!doc || doc.version !== "0.1") return false;
    // Reload if algorithm/events length changed or first load
    const prev = state.doc;
    const changed =
      !prev ||
      prev.algorithm !== doc.algorithm ||
      (prev.events || []).length !== (doc.events || []).length ||
      JSON.stringify(prev.events?.[0]) !== JSON.stringify(doc.events?.[0]);
    if (changed) loadDoc(doc);
    return true;
  } catch {
    return false;
  }
}

function bind() {
  $("btn-restart").onclick = () => {
    state.playing = false;
    stopTimer();
    jump(0);
  };
  $("btn-prev").onclick = () => {
    state.playing = false;
    stopTimer();
    jump(state.step - 1);
  };
  $("btn-next").onclick = () => {
    state.playing = false;
    stopTimer();
    jump(state.step + 1);
  };
  $("btn-end").onclick = () => {
    state.playing = false;
    stopTimer();
    jump(state.frames.length - 1);
  };
  $("btn-play").onclick = () => {
    if (!state.frames.length) return;
    state.playing = !state.playing;
    render();
    if (state.playing) {
      if (state.step >= state.frames.length - 1) jump(0);
      tick();
    } else stopTimer();
  };
  $("scrub").oninput = (e) => {
    state.playing = false;
    stopTimer();
    jump(Number(e.target.value));
  };
  document.querySelectorAll("#speeds button").forEach((btn) => {
    btn.onclick = () => {
      state.speed = Number(btn.dataset.speed);
      document
        .querySelectorAll("#speeds button")
        .forEach((b) => b.classList.toggle("active", b === btn));
    };
  });

  window.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;
    if (e.code === "Space") {
      e.preventDefault();
      $("btn-play").click();
    } else if (e.code === "ArrowRight") $("btn-next").click();
    else if (e.code === "ArrowLeft") $("btn-prev").click();
    else if (e.code === "Home") $("btn-restart").click();
    else if (e.code === "End") $("btn-end").click();
  });
}

bind();
render();
fetchTrace();
// Poll so a second @visualize call refreshes an open tab.
setInterval(fetchTrace, 1200);
