// =============================================================================
// RoastMyCode — Frontend logic
// Single-page interface: mode selector drives which route + payload shape
// is sent to the FastAPI backend. All rendering is data-driven off the
// API_RESPONSE envelope: { success, status_code, message, data, error, meta }
// =============================================================================

(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // Config (rendered server-side by Jinja into a JSON script tag)
  // ---------------------------------------------------------------------
  const CONFIG = JSON.parse(document.getElementById("app-config").textContent);
  const MODES = CONFIG.modes;                 // [{ key, name, tagline, group }]
  const ROUTES = CONFIG.routes;                // { roast, fix, explain, analysis }
  const DEFAULT_MODE = CONFIG.defaultMode;

  const MAX_CODE_LENGTH = 10000;
  const MIN_CODE_LENGTH = 10;

  // ---------------------------------------------------------------------
  // DOM refs
  // ---------------------------------------------------------------------
  const el = {
    modeSelect: document.getElementById("modeSelect"),
    personaGroup: document.getElementById("personaGroup"),
    analysisGroup: document.getElementById("analysisGroup"),
    modeTagline: document.getElementById("modeTagline"),
    actionField: document.getElementById("actionField"),
    actionSegmented: document.getElementById("actionSegmented"),
    languageSelect: document.getElementById("languageSelect"),
    codeInput: document.getElementById("codeInput"),
    charCounter: document.getElementById("charCounter"),
    codeError: document.getElementById("codeError"),
    clearBtn: document.getElementById("clearBtn"),
    runBtn: document.getElementById("runBtn"),
    apiStatus: document.getElementById("apiStatus"),
    statusDot: document.querySelector("#apiStatus .status-dot"),
    statusLabel: document.querySelector("#apiStatus .status-label"),
    resultsMeta: document.getElementById("resultsMeta"),
    emptyState: document.getElementById("emptyState"),
    loadingState: document.getElementById("loadingState"),
    loadingLabel: document.getElementById("loadingLabel"),
    errorState: document.getElementById("errorState"),
    errorTitle: document.getElementById("errorTitle"),
    errorDetail: document.getElementById("errorDetail"),
    errorCode: document.getElementById("errorCode"),
    resultsOutput: document.getElementById("resultsOutput"),
  };

  let state = {
    action: "roast", // roast | fix | explain — only relevant for Persona group
  };

  // ---------------------------------------------------------------------
  // Populate mode dropdown
  // ---------------------------------------------------------------------
  function populateModes() {
    const personas = MODES.filter((m) => m.group === "Persona");
    const analyses = MODES.filter((m) => m.group === "Analysis");

    personas.forEach((m) => el.personaGroup.appendChild(buildOption(m)));
    analyses.forEach((m) => el.analysisGroup.appendChild(buildOption(m)));

    const hasDefault = MODES.some((m) => m.key === DEFAULT_MODE);
    el.modeSelect.value = hasDefault ? DEFAULT_MODE : MODES[0].key;

    syncModeUI();
  }

  function buildOption(mode) {
    const opt = document.createElement("option");
    opt.value = mode.key;
    opt.textContent = mode.name;
    opt.dataset.group = mode.group;
    opt.dataset.tagline = mode.tagline;
    return opt;
  }

  function currentMode() {
    const opt = el.modeSelect.selectedOptions[0];
    return {
      key: opt.value,
      group: opt.dataset.group,
      tagline: opt.dataset.tagline,
      name: opt.textContent,
    };
  }

  function syncModeUI() {
    const mode = currentMode();
    el.modeTagline.textContent = mode.tagline || "";
    el.actionField.style.display = mode.group === "Persona" ? "flex" : "none";
  }

  el.modeSelect.addEventListener("change", syncModeUI);

  // ---------------------------------------------------------------------
  // Action segmented control
  // ---------------------------------------------------------------------
  el.actionSegmented.addEventListener("click", (e) => {
    const btn = e.target.closest(".segmented__option");
    if (!btn) return;
    el.actionSegmented.querySelectorAll(".segmented__option").forEach((b) => {
      b.classList.remove("is-active");
      b.setAttribute("aria-checked", "false");
    });
    btn.classList.add("is-active");
    btn.setAttribute("aria-checked", "true");
    state.action = btn.dataset.action;
  });

  // ---------------------------------------------------------------------
  // Character counter + validation
  // ---------------------------------------------------------------------
  function updateCounter() {
    const len = el.codeInput.value.length;
    el.charCounter.textContent = `${len} / ${MAX_CODE_LENGTH}`;
    el.charCounter.classList.toggle("is-near-limit", len > MAX_CODE_LENGTH * 0.9);
  }

  el.codeInput.addEventListener("input", () => {
    updateCounter();
    clearFieldError();
  });

  function clearFieldError() {
    el.codeInput.classList.remove("is-invalid");
    el.codeError.classList.remove("is-visible");
    el.codeError.textContent = "";
  }

  function setFieldError(msg) {
    el.codeInput.classList.add("is-invalid");
    el.codeError.textContent = msg;
    el.codeError.classList.add("is-visible");
  }

  function validate() {
    const code = el.codeInput.value.trim();
    if (code.length < MIN_CODE_LENGTH) {
      setFieldError(`Enter at least ${MIN_CODE_LENGTH} characters of code.`);
      return false;
    }
    if (code.length > MAX_CODE_LENGTH) {
      setFieldError(`Code exceeds the ${MAX_CODE_LENGTH} character limit.`);
      return false;
    }
    return true;
  }

  el.clearBtn.addEventListener("click", () => {
    el.codeInput.value = "";
    updateCounter();
    clearFieldError();
    resetResults();
  });

  // ---------------------------------------------------------------------
  // Route resolution
  // ---------------------------------------------------------------------
  function resolveRoute(mode) {
    if (mode.group === "Analysis") return ROUTES.analysis;
    return ROUTES[state.action] || ROUTES.roast;
  }

  // ---------------------------------------------------------------------
  // Status pill
  // ---------------------------------------------------------------------
  function setStatus(stateName, label) {
    el.statusDot.dataset.state = stateName;
    el.statusLabel.textContent = label;
  }

  // ---------------------------------------------------------------------
  // Result view toggling
  // ---------------------------------------------------------------------
  function showOnly(target) {
    [el.emptyState, el.loadingState, el.errorState, el.resultsOutput].forEach((node) => {
      node.hidden = node !== target;
    });
  }

  function resetResults() {
    showOnly(el.emptyState);
    el.resultsMeta.textContent = "";
    el.resultsOutput.innerHTML = "";
    setStatus("idle", "Idle");
  }

  // ---------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------
  el.runBtn.addEventListener("click", runReview);

  async function runReview() {
    if (!validate()) return;

    const mode = currentMode();
    const route = resolveRoute(mode);
    const payload = {
      code: el.codeInput.value.trim(),
      mode: mode.key,
      language: el.languageSelect.value,
    };

    setLoading(true, mode);
    setStatus("loading", "Running");
    showOnly(el.loadingState);
    el.resultsMeta.textContent = "";

    try {
      const res = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      handleResponse(body);
    } catch (err) {
      handleNetworkError(err);
    } finally {
      setLoading(false, mode);
    }
  }

  function setLoading(isLoading, mode) {
    el.runBtn.disabled = isLoading;
    el.runBtn.classList.toggle("is-loading", isLoading);
    if (isLoading) {
      el.loadingLabel.textContent =
        mode.group === "Analysis" ? "Analyzing code…" : "Consulting reviewer…";
    }
  }

  // ---------------------------------------------------------------------
  // Response handling
  // ---------------------------------------------------------------------
  function handleResponse(body) {
    if (!body || body.success !== true) {
      const message = body?.message || "Request failed";
      const detail = body?.error?.detail || "The server returned an unexpected error.";
      const code = body?.error?.error_code || null;
      renderError(message, detail, code);
      setStatus("error", "Error");
      return;
    }

    renderMeta(body.meta);
    renderResults(body.data);
    setStatus("success", "Done");
  }

  function handleNetworkError(err) {
    renderError(
      "Could not reach the server",
      "Check your connection and confirm the API is running, then try again.",
      "NETWORK_ERROR"
    );
    setStatus("error", "Error");
    console.error(err);
  }

  function renderError(title, detail, code) {
    el.errorTitle.textContent = title;
    el.errorDetail.textContent = detail;
    el.errorCode.textContent = code || "";
    el.errorCode.style.display = code ? "inline-block" : "none";
    showOnly(el.errorState);
  }

  function renderMeta(meta) {
    if (!meta) {
      el.resultsMeta.textContent = "";
      return;
    }
    const parts = [meta.model, meta.route].filter(Boolean);
    el.resultsMeta.textContent = parts.join(" · ");
  }

  // ---------------------------------------------------------------------
  // Results rendering — data-driven, keyed off whatever fields the
  // response actually contains. This keeps the UI working across all
  // response shapes (roast / roast+fix / roast+explain / code_metrics /
  // complexity_oracle) without hardcoding per-mode templates.
  // ---------------------------------------------------------------------
  function renderResults(data) {
    el.resultsOutput.innerHTML = "";
    const seen = new Set();
    const blocks = [];

    // 1. Score header (roast-style: score 0-100 + grade)
    if (isNumber(data.score) && data.grade) {
      blocks.push(buildScoreCard(data.score, 100, data.score_label, data.grade));
      ["score", "score_label", "grade"].forEach((k) => seen.add(k));
    }

    // 1b. Score header (analysis-style: overall_score 0-1 + grade)
    if (isNumber(data.overall_score) && data.grade) {
      blocks.push(
        buildScoreCard(Math.round(data.overall_score * 100), 100, "Overall score", data.grade)
      );
      ["overall_score", "grade"].forEach((k) => seen.add(k));
    }

    // 2. Verdict / roast text
    if (typeof data.roast === "string") {
      blocks.push(buildTextBlock("Verdict", data.roast));
      seen.add("roast");
    }

    // 3. Complexity oracle stat trio
    if (data.time_complexity || data.space_complexity || data.dominant_factor) {
      blocks.push(
        buildStatGrid([
          ["Time", data.time_complexity],
          ["Space", data.space_complexity],
          ["Dominant factor", data.dominant_factor],
        ])
      );
      ["time_complexity", "space_complexity", "dominant_factor"].forEach((k) => seen.add(k));
    }

    // 4. Issues
    if (Array.isArray(data.issues) && data.issues.length) {
      blocks.push(buildList("Issues", data.issues, false));
      seen.add("issues");
    }

    // 5. Positive
    if (Array.isArray(data.positive) && data.positive.length) {
      blocks.push(buildList("Strengths", data.positive, true));
      seen.add("positive");
    }

    // 6. Insights (code_metrics)
    if (Array.isArray(data.insights) && data.insights.length) {
      blocks.push(buildList("Insights", data.insights, false));
      seen.add("insights");
    }

    // 7. Explanation steps (complexity_oracle)
    if (Array.isArray(data.explanation) && data.explanation.length) {
      blocks.push(buildList("Reasoning", data.explanation, false));
      seen.add("explanation");
    }

    // 8. Hidden risks (complexity_oracle)
    if (Array.isArray(data.hidden_risks) && data.hidden_risks.length) {
      blocks.push(buildList("Hidden risks", data.hidden_risks, false));
      seen.add("hidden_risks");
    }

    // 9. Metrics (code_metrics) — object of 0–1 floats
    if (isPlainObject(data.metrics)) {
      blocks.push(buildMeterGroup("Metrics", data.metrics));
      seen.add("metrics");
    }

    // 10. Risk profile (code_metrics) — object of 0–1 floats
    if (isPlainObject(data.risk_profile)) {
      blocks.push(buildMeterGroup("Risk profile", data.risk_profile));
      seen.add("risk_profile");
    }

    // 11. Explanations map (issue -> plain English, from /roast/explain/)
    if (isPlainObject(data.explanations)) {
      blocks.push(buildExplainList("Why it matters", data.explanations));
      seen.add("explanations");
    }

    // 12. Fixed code (from /roast/fix/)
    if (typeof data.fixed === "string" && data.fixed.trim()) {
      blocks.push(buildCodeBlock("Suggested fix", data.fixed));
      seen.add("fixed");
    }

    // 13. Confidence (analysis modes)
    if (isNumber(data.confidence)) {
      blocks.push(buildConfidenceLine(data.confidence));
      seen.add("confidence");
    }

    // 14. Humor line (complexity_oracle)
    if (typeof data.humor === "string" && data.humor.trim()) {
      blocks.push(buildQuoteLine(data.humor));
      seen.add("humor");
    }

    // 15. Fallback — any remaining unrecognized fields, so the UI never
    // silently drops data the backend adds later.
    const leftover = Object.keys(data).filter((k) => !seen.has(k));
    leftover.forEach((key) => {
      const value = data[key];
      if (value === null || value === undefined || value === "") return;
      if (Array.isArray(value)) {
        blocks.push(buildList(labelize(key), value.map(String), false));
      } else if (isPlainObject(value)) {
        blocks.push(buildMeterGroupOrJson(labelize(key), value));
      } else {
        blocks.push(buildTextBlock(labelize(key), String(value)));
      }
    });

    // Assemble with dividers between blocks
    blocks.forEach((block, i) => {
      if (i > 0) el.resultsOutput.appendChild(el.resultsOutput.lastChild ? divider() : document.createTextNode(""));
      el.resultsOutput.appendChild(block);
    });

    showOnly(el.resultsOutput);
  }

  // ---------------------------------------------------------------------
  // Block builders
  // ---------------------------------------------------------------------
  function buildScoreCard(value, scale, label, grade) {
    const card = document.createElement("div");
    card.className = "score-card";
    card.innerHTML = `
      <div>
        <span class="score-card__value">${escapeHtml(value)}</span><span class="score-card__scale">/${scale}</span>
      </div>
      <div class="score-card__meta">
        <span class="score-card__label">${escapeHtml(label || "Score")}</span>
        <span class="grade-badge">${escapeHtml(grade)}</span>
      </div>
    `;
    return card;
  }

  function buildTextBlock(title, text) {
    const wrap = document.createElement("div");
    wrap.className = "result-block";
    wrap.innerHTML = `
      <span class="result-block__title">${escapeHtml(title)}</span>
      <p class="result-block__text"></p>
    `;
    wrap.querySelector(".result-block__text").textContent = text;
    return wrap;
  }

  function buildList(title, items, positive) {
    const wrap = document.createElement("div");
    wrap.className = "result-block";
    const listClass = positive ? "result-list result-list--positive" : "result-list";
    wrap.innerHTML = `
      <span class="result-block__title">${escapeHtml(title)}</span>
      <ul class="${listClass}"></ul>
    `;
    const ul = wrap.querySelector("ul");
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = typeof item === "string" ? item : JSON.stringify(item);
      ul.appendChild(li);
    });
    return wrap;
  }

  function buildStatGrid(pairs) {
    const wrap = document.createElement("div");
    wrap.className = "result-block";
    const grid = document.createElement("div");
    grid.className = "stat-grid";
    pairs.forEach(([label, value]) => {
      if (!value) return;
      const stat = document.createElement("div");
      stat.className = "stat";
      stat.innerHTML = `
        <span class="stat__label">${escapeHtml(label)}</span>
        <span class="stat__value"></span>
      `;
      stat.querySelector(".stat__value").textContent = value;
      grid.appendChild(stat);
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function buildMeterGroup(title, obj) {
    const wrap = document.createElement("div");
    wrap.className = "result-block";
    wrap.innerHTML = `<span class="result-block__title">${escapeHtml(title)}</span>`;
    const group = document.createElement("div");
    group.className = "meter-group";

    Object.entries(obj).forEach(([key, val]) => {
      const numeric = typeof val === "number" ? val : parseFloat(val);
      if (Number.isNaN(numeric)) return;
      const pct = Math.max(0, Math.min(100, numeric <= 1 ? numeric * 100 : numeric));
      const meter = document.createElement("div");
      meter.className = "meter";
      meter.innerHTML = `
        <span class="meter__label"></span>
        <span class="meter__value"></span>
        <div class="meter__track"><div class="meter__fill" style="width:${pct}%"></div></div>
      `;
      meter.querySelector(".meter__label").textContent = labelize(key);
      meter.querySelector(".meter__value").textContent = numeric <= 1 ? numeric.toFixed(2) : numeric;
      group.appendChild(meter);
    });

    wrap.appendChild(group);
    return wrap;
  }

  function buildMeterGroupOrJson(title, obj) {
    const allNumeric = Object.values(obj).every((v) => typeof v === "number" || !Number.isNaN(parseFloat(v)));
    if (allNumeric) return buildMeterGroup(title, obj);
    return buildTextBlock(title, JSON.stringify(obj, null, 2));
  }

  function buildExplainList(title, map) {
    const wrap = document.createElement("div");
    wrap.className = "result-block";
    wrap.innerHTML = `<span class="result-block__title">${escapeHtml(title)}</span>`;
    const list = document.createElement("div");
    list.className = "explain-list";
    Object.entries(map).forEach(([issue, explanation]) => {
      const item = document.createElement("div");
      item.className = "explain-item";
      item.innerHTML = `
        <div class="explain-item__issue"></div>
        <div class="explain-item__body"></div>
      `;
      item.querySelector(".explain-item__issue").textContent = issue;
      item.querySelector(".explain-item__body").textContent = explanation;
      list.appendChild(item);
    });
    wrap.appendChild(list);
    return wrap;
  }

  function buildCodeBlock(title, code) {
    const wrap = document.createElement("div");
    wrap.className = "result-block";
    wrap.innerHTML = `
      <span class="result-block__title">${escapeHtml(title)}</span>
      <div class="code-block">
        <div class="code-block__bar">
          <button type="button" class="code-block__copy">Copy</button>
        </div>
        <pre><code></code></pre>
      </div>
    `;
    wrap.querySelector("code").textContent = code;
    wrap.querySelector(".code-block__copy").addEventListener("click", (e) => {
      navigator.clipboard.writeText(code).then(() => {
        e.target.textContent = "Copied";
        setTimeout(() => (e.target.textContent = "Copy"), 1400);
      });
    });
    return wrap;
  }

  function buildConfidenceLine(value) {
    const p = document.createElement("p");
    p.className = "confidence-line";
    p.textContent = `Confidence ${(value * 100).toFixed(0)}%`;
    return p;
  }

  function buildQuoteLine(text) {
    const p = document.createElement("p");
    p.className = "quote-line";
    p.textContent = text;
    return p;
  }

  function divider() {
    const hr = document.createElement("hr");
    hr.className = "result-divider";
    return hr;
  }

  // ---------------------------------------------------------------------
  // Utils
  // ---------------------------------------------------------------------
  function isNumber(v) {
    return typeof v === "number" && !Number.isNaN(v);
  }

  function isPlainObject(v) {
    return typeof v === "object" && v !== null && !Array.isArray(v);
  }

  function labelize(key) {
    return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------
  populateModes();
  updateCounter();
  resetResults();
})();