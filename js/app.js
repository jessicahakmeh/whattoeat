(() => {
  "use strict";

  // Questions are configured in js/questions.js, meals in js/meals.js.
  const QUESTIONS = window.QUESTIONS || [];

  const MAX_SLICES = 12;
  const MIN_SLICES = 6;
  const SPIN_MS = 5000;

  const SLICE_COLORS = [
    ["#e4572e", "#ffffff"],
    ["#f3a712", "#2a1d14"],
    ["#29335c", "#ffffff"],
    ["#8cb369", "#2a1d14"],
    ["#db7f8e", "#2a1d14"],
    ["#3e7cb1", "#ffffff"],
    ["#f4e285", "#2a1d14"],
    ["#5b8e7d", "#ffffff"]
  ];

  const $ = (id) => document.getElementById(id);
  const els = {
    layout: $("layout"),
    stage: $("stage"),
    answers: $("answers"),
    question: $("question"),
    matchCount: $("matchCount"),
    wheelWrap: $("wheelWrap"),
    canvas: $("wheel"),
    spinBtn: $("spinBtn"),
    result: $("result"),
    resultEmoji: $("resultEmoji"),
    resultName: $("resultName"),
    resultDesc: $("resultDesc"),
    resultTags: $("resultTags"),
    resultIngredients: $("resultIngredients"),
    respinBtn: $("respinBtn"),
    recipeLink: $("recipeLink"),
    restartBtn: $("restartBtn"),
    closeResult: $("closeResult"),
    burst: $("burst")
  };

  const state = {
    meals: [],
    answers: {}, // question id -> indexes of the chosen options
    step: 0,
    advanceTimer: null,
    completed: false, // reached the end of the questions at least once
    wheelItems: [],
    rotation: 0,
    spinning: false,
    recent: []
  };

  // ---------- Filtering ----------

  const hasField = (meal, field) => meal[field] !== undefined && meal[field] !== null;

  // Does a meal satisfy one option? See js/questions.js for the option format.
  function optionMatches(option, meal, field) {
    if (option.any || !hasField(meal, field)) return true;
    const list = Array.isArray(meal[field]) ? meal[field] : [meal[field]];
    if (option.min !== undefined || option.max !== undefined) {
      return list.some(
        (v) => (option.min === undefined || v >= option.min) && (option.max === undefined || v <= option.max)
      );
    }
    const accepted = option.values || [option.value];
    return list.some((v) => accepted.includes(v));
  }

  // A meal passes a question if it fits any of the chosen options.
  function matches(meal, answers) {
    return QUESTIONS.every((q) => {
      const chosen = answers[q.id];
      return !chosen || chosen.some((i) => optionMatches(q.options[i], meal, q.field));
    });
  }

  const currentMatches = () => state.meals.filter((m) => matches(m, state.answers));

  function shuffle(list) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Pick up to MAX_SLICES meals, preferring ones not shown as recent winners.
  function sampleWheel(pool) {
    const fresh = shuffle(pool.filter((m) => !state.recent.includes(m.name)));
    const seen = shuffle(pool.filter((m) => state.recent.includes(m.name)));
    let items = fresh.concat(seen).slice(0, MAX_SLICES);
    if (items.length && items.length < MIN_SLICES) {
      const base = items;
      while (items.length < MIN_SLICES) items = items.concat(base);
    }
    return items;
  }

  // ---------- Wheel drawing ----------

  function drawWheel() {
    const canvas = els.canvas;
    const size = canvas.clientWidth || 540;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = size / 2;
    ctx.clearRect(0, 0, size, size);

    const items = state.wheelItems;
    if (!items.length) {
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--line");
      ctx.beginPath();
      ctx.arc(r, r, r, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const seg = (Math.PI * 2) / items.length;
    const fontSize = Math.max(11, Math.min(17, size / 30));
    const maxTextWidth = r * 0.62;

    // Avoid two neighbouring slices sharing a colour when wrapping around.
    const colorCount = items.length % SLICE_COLORS.length === 1 ? SLICE_COLORS.length - 1 : SLICE_COLORS.length;

    items.forEach((meal, i) => {
      // Slice 0 starts at 12 o'clock and slices run clockwise.
      const start = -Math.PI / 2 + i * seg;
      const [bg, fg] = SLICE_COLORS[i % colorCount];

      ctx.beginPath();
      ctx.moveTo(r, r);
      ctx.arc(r, r, r, start, start + seg);
      ctx.closePath();
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(r, r);
      ctx.rotate(start + seg / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = fg;
      ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.fillText(fitText(ctx, `${meal.name} ${meal.emoji}`, maxTextWidth), r - 16, 0);
      ctx.restore();
    });
  }

  function fitText(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) t = t.slice(0, -1);
    return t.trimEnd() + "…";
  }

  function refreshWheel() {
    state.wheelItems = sampleWheel(currentMatches());
    drawWheel();
  }

  // ---------- Questions UI ----------

  function renderAnswers() {
    els.answers.innerHTML = "";
    QUESTIONS.forEach((q, i) => {
      const chosen = state.answers[q.id];
      if (!chosen) return;
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = chosen.map((c) => `${q.options[c].emoji} ${q.options[c].label}`).join(" + ");
      btn.title = `Change: ${q.title}`;
      if (i === state.step) btn.classList.add("current");
      btn.addEventListener("click", () => goToStep(i));
      li.appendChild(btn);
      els.answers.appendChild(li);
    });
  }

  function renderQuestion() {
    const q = QUESTIONS[state.step];
    const box = els.question;
    box.classList.remove("enter");
    void box.offsetWidth; // restart the entry animation
    box.classList.add("enter");
    box.innerHTML = "";

    if (!q) {
      box.innerHTML = `
        <p class="step-label">All set</p>
        <h2>Let the wheel decide.</h2>
        <div class="done-actions">
          <button class="btn primary" type="button" data-action="spin">🎡 Spin the wheel</button>
          <button class="btn ghost" type="button" data-action="reset">Start over</button>
        </div>`;
      box.querySelector('[data-action="spin"]').addEventListener("click", spin);
      box.querySelector('[data-action="reset"]').addEventListener("click", reset);
      return;
    }

    const label = document.createElement("p");
    label.className = "step-label";
    label.textContent = `Question ${state.step + 1} of ${QUESTIONS.length}`;
    if (q.multiple) label.textContent += " · pick one or more";

    const title = document.createElement("h2");
    title.textContent = q.title;

    const grid = document.createElement("div");
    grid.className = "options";
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option";
      btn.innerHTML = `<span class="emoji-pop"><span class="emoji">${opt.emoji}</span></span><strong></strong><small></small>`;
      if (opt.animate) btn.querySelector(".emoji").dataset.anim = opt.animate;
      btn.querySelector("strong").textContent = opt.label;
      btn.querySelector("small").textContent = opt.hint;
      btn.querySelector(".emoji-pop").addEventListener("animationend", () => btn.classList.remove("clicked"));
      btn.addEventListener("click", () => chooseOption(q, i, btn));
      grid.appendChild(btn);
    });

    box.append(label, title, grid);

    if (q.multiple) {
      const actions = document.createElement("div");
      actions.className = "question-actions";
      const next = document.createElement("button");
      next.type = "button";
      next.className = "btn primary next";
      next.textContent = state.step === QUESTIONS.length - 1 ? "Done →" : "Next →";
      next.addEventListener("click", advance);
      actions.appendChild(next);
      box.appendChild(actions);
    }

    markSelected(q);
  }

  // Sync the option buttons (and the Next button) with the current answers.
  function markSelected(q) {
    const chosen = state.answers[q.id] || [];
    els.question.querySelectorAll(".option").forEach((btn, i) => {
      btn.classList.toggle("selected", chosen.includes(i));
      btn.setAttribute("aria-pressed", chosen.includes(i));
    });
    const next = els.question.querySelector(".next");
    if (next) next.disabled = !chosen.length;
  }

  function playClick(btn) {
    btn.classList.remove("clicked");
    void btn.offsetWidth; // restart the animation on repeat clicks
    btn.classList.add("clicked");
  }

  function renderMatchCount() {
    const n = currentMatches().length;
    els.matchCount.classList.toggle("empty", n === 0);
    els.matchCount.innerHTML = n
      ? `<strong>${n}</strong> dish${n === 1 ? "" : "es"} on the menu`
      : "Nothing matches those answers.";
    if (!n) suggestFixes();
    els.spinBtn.disabled = n === 0;
    els.spinBtn.classList.toggle("ready", n > 0 && state.step >= QUESTIONS.length);
  }

  // When nothing matches, offer the answers that would bring dishes back if changed.
  function suggestFixes() {
    const fixes = QUESTIONS.map((q, i) => {
      if (!state.answers[q.id]) return null;
      const without = { ...state.answers };
      delete without[q.id];
      const count = state.meals.filter((m) => matches(m, without)).length;
      return count ? { q, i, count } : null;
    }).filter(Boolean);
    if (!fixes.length) return;

    els.matchCount.append(" Try changing:");
    const list = document.createElement("span");
    list.className = "fixes";
    fixes.forEach(({ q, i }) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = state.answers[q.id].map((c) => `${q.options[c].emoji} ${q.options[c].label}`).join(" + ");
      btn.title = q.title;
      btn.addEventListener("click", () => goToStep(i));
      list.appendChild(btn);
    });
    els.matchCount.appendChild(list);
  }

  const allAnswered = () => QUESTIONS.every((q) => state.answers[q.id]);

  // The wheel only appears once you've been through every question.
  // After that it stays while you tweak answers via the pills.
  const wheelReady = () => state.completed && allAnswered();

  function renderStage() {
    const ready = wheelReady();
    const wasHidden = els.stage.hidden;
    els.layout.classList.toggle("ready", ready);
    els.stage.hidden = !ready;
    if (ready && wasHidden) {
      drawWheel(); // it had no size while hidden
      if (window.matchMedia("(max-width: 899px)").matches) {
        els.stage.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  function render() {
    renderAnswers();
    renderQuestion();
    renderMatchCount();
    renderStage();
  }

  function chooseOption(q, i, btn) {
    if (state.advanceTimer) return;
    playClick(btn);

    if (!q.multiple) {
      state.answers[q.id] = [i];
      markSelected(q);
      // Let the click animation play before moving on.
      state.advanceTimer = setTimeout(advance, 450);
      return;
    }

    // Multiple choice: toggle. "Any" options can't be combined with others.
    let chosen = state.answers[q.id] || [];
    if (chosen.includes(i)) chosen = chosen.filter((c) => c !== i);
    else if (q.options[i].any) chosen = [i];
    else chosen = chosen.filter((c) => !q.options[c].any).concat(i);

    if (chosen.length) state.answers[q.id] = chosen;
    else delete state.answers[q.id];

    markSelected(q);
    refreshWheel();
    renderAnswers();
    renderMatchCount();
    renderStage();
  }

  // Go to the next unanswered question (after editing an earlier one, this skips ahead).
  function advance() {
    clearTimeout(state.advanceTimer);
    state.advanceTimer = null;
    const next = QUESTIONS.findIndex((q) => !state.answers[q.id]);
    state.step = next === -1 ? QUESTIONS.length : next;
    if (next === -1) state.completed = true;
    refreshWheel();
    render();
  }

  function goToStep(i) {
    if (state.spinning) return;
    clearTimeout(state.advanceTimer);
    state.advanceTimer = null;
    state.step = i;
    render();
  }

  function reset() {
    clearTimeout(state.advanceTimer);
    state.advanceTimer = null;
    state.answers = {};
    state.completed = false;
    state.step = 0;
    state.recent = [];
    closeResult();
    refreshWheel();
    render();
  }

  // ---------- Spinning ----------

  function spin() {
    if (state.spinning || !wheelReady()) return;
    const pool = currentMatches();
    if (!pool.length) return;

    closeResult();
    state.spinning = true;
    els.spinBtn.disabled = true;
    els.wheelWrap.classList.remove("landed");

    // Fresh selection on every spin so respins show new options.
    state.wheelItems = sampleWheel(pool);
    drawWheel();

    const items = state.wheelItems;
    const candidates = items
      .map((m, i) => i)
      .filter((i) => !state.recent.includes(items[i].name));
    const indexPool = candidates.length ? candidates : items.map((m, i) => i);
    const winnerIndex = indexPool[Math.floor(Math.random() * indexPool.length)];
    const winner = items[winnerIndex];

    // Rotate so the winning slice's centre (plus a little jitter) ends under the pointer.
    const seg = 360 / items.length;
    const jitter = (Math.random() - 0.5) * seg * 0.6;
    const target = (360 - (winnerIndex + 0.5) * seg - jitter) % 360;
    const current = ((state.rotation % 360) + 360) % 360;
    const delta = (target - current + 360) % 360;
    state.rotation += 360 * 5 + delta;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    els.canvas.style.transform = `rotate(${state.rotation}deg)`;

    setTimeout(() => {
      state.spinning = false;
      els.spinBtn.disabled = false;
      els.wheelWrap.classList.add("landed");
      state.recent = [winner.name, ...state.recent.filter((n) => n !== winner.name)].slice(0, 8);
      showResult(winner);
    }, reduced ? 1300 : SPIN_MS + 100);
  }

  // ---------- Result ----------

  function showResult(meal) {
    els.resultEmoji.textContent = meal.emoji;
    els.resultName.textContent = meal.name;
    els.resultDesc.textContent = meal.description;

    // A tag for each of the meal's values, labelled like the option it fits best
    // (an exact `value` match first, so a vegan dish says "Vegan", not "Vegetarian").
    const tags = [];
    if (typeof meal.minutes === "number") tags.push(`⏱ ${meal.minutes} min`);
    QUESTIONS.forEach((q) => {
      if (!hasField(meal, q.field)) return;
      const values = Array.isArray(meal[q.field]) ? meal[q.field] : [meal[q.field]];
      values.forEach((v) => {
        const single = { [q.field]: v };
        const specific = q.options.filter((o) => !o.any);
        const opt = specific.find((o) => o.value === v) || specific.find((o) => optionMatches(o, single, q.field));
        const tag = opt && `${opt.emoji} ${opt.label}`;
        if (tag && !tags.includes(tag)) tags.push(tag);
      });
    });
    els.resultTags.innerHTML = "";
    tags.forEach((t) => {
      const li = document.createElement("li");
      li.textContent = t;
      els.resultTags.appendChild(li);
    });

    els.resultIngredients.innerHTML = "";
    meal.ingredients.forEach((ing) => {
      const li = document.createElement("li");
      li.textContent = ing;
      els.resultIngredients.appendChild(li);
    });

    // Use the meal's own recipe link (e.g. a Notion page) if it has one, else search for it.
    if (meal.recipe) {
      els.recipeLink.href = meal.recipe;
      els.recipeLink.textContent = "My own recipe ↗";
    } else {
      els.recipeLink.href = `https://www.google.com/search?q=${encodeURIComponent(meal.name + " recipe")}`;
      els.recipeLink.textContent = "Find a recipe ↗";
    }
    els.result.hidden = false;
    burst(meal.emoji);
    els.respinBtn.focus();
  }

  function closeResult() {
    els.result.hidden = true;
  }

  function burst(emoji) {
    const rect = els.wheelWrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    els.burst.innerHTML = "";
    for (let i = 0; i < 16; i++) {
      const s = document.createElement("span");
      const angle = (Math.PI * 2 * i) / 16;
      const dist = 140 + Math.random() * 160;
      s.textContent = emoji;
      s.style.left = `${cx - 16}px`;
      s.style.top = `${cy - 16}px`;
      s.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      s.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
      s.style.setProperty("--rot", `${(Math.random() - 0.5) * 360}deg`);
      els.burst.appendChild(s);
    }
    setTimeout(() => (els.burst.innerHTML = ""), 1300);
  }

  // ---------- Events ----------

  els.spinBtn.addEventListener("click", spin);
  els.respinBtn.addEventListener("click", spin);
  els.closeResult.addEventListener("click", closeResult);
  els.restartBtn.addEventListener("click", () => {
    closeResult();
    goToStep(0);
  });
  els.result.addEventListener("click", (e) => {
    if (e.target === els.result) closeResult();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeResult();
    if (e.code === "Space" && !(e.target instanceof HTMLButtonElement) && !(e.target instanceof HTMLAnchorElement)) {
      e.preventDefault();
      spin();
    }
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawWheel, 150);
  });

  // ---------- Boot ----------

  // Dishes come from js/meals.js, loaded before this script.
  state.meals = window.MEALS || [];
  refreshWheel();
  render();
  // Redraw once web fonts are in so wheel labels use Inter.
  if (document.fonts) document.fonts.ready.then(drawWheel);
})();
