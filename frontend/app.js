/* ─────────────────────────────────────────────────────────────
   app.js — RoastMyCode Frontend
   Connects to FastAPI backend at localhost:8000
   ───────────────────────────────────────────────────────────── */

const API_BASE = "http://localhost:8000";

// ── DOM REFERENCES ────────────────────────────────────────────
const editor = document.getElementById("editorInput");
const lineNumbers = document.getElementById("lineNumbers");
const charCount = document.getElementById("charCount");
const roastBtn = document.getElementById("roastBtn");
const loading = document.getElementById("loadingState");
const responsePanel = document.getElementById("responsePanel");
const responseBody = document.getElementById("responseBody");

// ── STATE ─────────────────────────────────────────────────────
let currentMode = "turing"; // matches backend ROAST_MODES key
let lastResponse = null;
let totalRoasts = parseInt(
  document.getElementById("roast-count")?.textContent || "0",
);

// ── EDITOR: LINE NUMBERS ──────────────────────────────────────
function updateEditorUI() {
  const lines = editor.value.split("\n").length;
  lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join(
    "<br>",
  );
  charCount.textContent = `${editor.value.length} characters`;
}

editor.addEventListener("input", updateEditorUI);
editor.addEventListener("scroll", () => {
  lineNumbers.scrollTop = editor.scrollTop;
});

// ── EDITOR: TAB AND SHORTCUT ──────────────────────────────────
editor.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value =
      editor.value.substring(0, start) + "  " + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + 2;
    updateEditorUI();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    roastCode();
  }
});

// ── MODE PILLS ────────────────────────────────────────────────
document.querySelectorAll(".pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document
      .querySelectorAll(".pill")
      .forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    // read from data-mode attribute — must match backend key exactly
    currentMode =
      pill.dataset.mode ||
      pill.textContent.trim().toLowerCase().replace(/\s+/g, "_");
  });
});

// ── CLEAR BUTTON ──────────────────────────────────────────────
document.getElementById("clear-btn").addEventListener("click", () => {
  editor.value = "";
  updateEditorUI();
});

// ── ROAST BUTTON ──────────────────────────────────────────────
roastBtn.addEventListener("click", roastCode);

// ── ROAST FUNCTION ────────────────────────────────────────────
async function roastCode() {
  const code = editor.value.trim();

  // client-side validation
  if (!code) {
    showToast("Paste some code first.");
    return;
  }
  if (code.length < 10) {
    showToast("Code is too short — minimum 10 characters.");
    return;
  }
  if (code.length > 10000) {
    showToast("Code is too long — maximum 10000 characters.");
    return;
  }

  const language =
    document.getElementById("language")?.value?.toLowerCase() || "python";

  // determine which endpoint to call based on mode
  // analysis modes go to /analysis/metrics/, roast modes go to /roast/personality/
  const analysisModes = ["code_metrics_analysis", "complexity_oracle"];
  const isAnalysis = analysisModes.includes(currentMode);
  const endpoint = isAnalysis
    ? `${API_BASE}/analysis/metrics/`
    : `${API_BASE}/roast/personality/`;

  // ── UI: loading state ────────────────────────────────────
  roastBtn.disabled = true;
  roastBtn.innerHTML = "Roasting...";
  loading.classList.add("active");
  responsePanel.classList.remove("visible");

  const requestBody = {
    code: code,
    mode: currentMode,
    language: language,
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    // ── Handle HTTP errors ────────────────────────────────
    if (!res.ok) {
      if (res.status === 422) {
        // Pydantic validation error — shape: { detail: [{msg, loc, type}] }
        const errJson = await res.json();
        const detail = errJson?.detail;
        let msg = "Validation error — check your input.";
        if (Array.isArray(detail) && detail.length > 0) {
          msg = detail[0]?.msg || msg;
          msg = msg.replace(/^Value error,\s*/i, ""); // strip Pydantic prefix
        }
        renderError(msg, 422);
        return;
      }
      if (res.status === 429) {
        renderError(
          "Rate limit hit — Groq is throttling. Try again in a moment.",
          429,
        );
        return;
      }
      renderError(
        `Server error ${res.status} — check backend logs.`,
        res.status,
      );
      return;
    }

    const json = await res.json();

    // ── API_RESPONSE shape: { success, data, error, meta } ─
    if (json.success && json.data) {
      renderResponse(json.data, language);
      lastResponse = json.data;

      // update session stats
      totalRoasts++;
      const countEl = document.getElementById("roast-count");
      if (countEl) countEl.textContent = totalRoasts;
    } else if (!json.success) {
      // backend returned success: false with error detail
      const detail =
        json.error?.detail || json.message || "Something went wrong.";
      renderError(detail, json.status_code || 500);
    }
  } catch (err) {
    // Network error — backend not reachable
    if (err instanceof TypeError) {
      renderError(
        "Cannot reach backend. Is the server running?\n\nRun: uvicorn roast_my_code.main:app --reload --port 8000",
        0,
      );
      showToast("Backend not connected — start uvicorn first");
    } else {
      renderError(`Unexpected error: ${err.message}`, 0);
    }
  } finally {
    // always restore button
    roastBtn.disabled = false;
    roastBtn.innerHTML = "Roast My Code";
    loading.classList.remove("active");
  }
}

// ── RENDER RESPONSE ───────────────────────────────────────────
function renderResponse(data, language) {
  const scoreColor = !data.score
    ? "rgba(255,255,255,0.5)"
    : data.score >= 70
      ? "#22c55e"
      : data.score >= 40
        ? "#eab308"
        : "#f43f5e";

  let html = "";

  // ── Score card ─────────────────────────────────────────
  if (data.score !== undefined || data.grade) {
    html += `
      <div class="score-card">
        <div class="score-circle" style="color:${scoreColor};border-color:${scoreColor}20;">
          ${data.score ?? "—"}
        </div>
        <div class="score-meta">
          <h3>${escapeHTML(data.grade || "")}</h3>
          <p>${escapeHTML(data.score_label || data.label || "")}</p>
        </div>
      </div>`;
  }

  // ── Roast text ─────────────────────────────────────────
  if (data.roast) {
    html += `
      <div class="response-section">
        <div class="section-title">Roast</div>
        <div class="response-text">${escapeHTML(data.roast)}</div>
      </div>`;
  }

  // ── Issues ─────────────────────────────────────────────
  if (data.issues && data.issues.length) {
    html += `
      <div class="response-section">
        <div class="section-title">Critical Issues</div>
        <div class="issue-list">
          ${data.issues.map((i) => `<div class="issue">${escapeHTML(i)}</div>`).join("")}
        </div>
      </div>`;
  }

  // ── Positive ───────────────────────────────────────────
  if (data.positive && data.positive.length) {
    html += `
      <div class="response-section">
        <div class="section-title">What Actually Works</div>
        <div class="positive-list">
          ${data.positive.map((p) => `<div class="positive">${escapeHTML(p)}</div>`).join("")}
        </div>
      </div>`;
  }

  // ── Fixed code ─────────────────────────────────────────
  if (data.fixed) {
    html += `
      <div class="response-section">
        <div class="section-title">Fixed Code</div>
        <pre><code class="language-${language}">${escapeHTML(data.fixed)}</code></pre>
      </div>`;
  }

  // ── Explanations (from /explain/ endpoint) ─────────────
  if (data.explanations && typeof data.explanations === "object") {
    html += `
      <div class="response-section">
        <div class="section-title">Issue Explanations</div>
        <div class="issue-list">
          ${Object.entries(data.explanations)
            .map(
              ([issue, exp]) => `
            <div class="issue">
              <strong>${escapeHTML(issue)}</strong><br>
              <span style="opacity:0.8;font-size:14px;">${escapeHTML(exp)}</span>
            </div>`,
            )
            .join("")}
        </div>
      </div>`;
  }

  // ── Analysis-specific keys (metrics, complexity) ───────
  if (data.overall_score !== undefined) {
    html += `
      <div class="response-section">
        <div class="section-title">Code Metrics</div>
        <div class="issue-list">
          ${Object.entries(data.metrics || {})
            .map(
              ([key, val]) => `
            <div class="positive">
              <strong>${escapeHTML(key.replace(/_/g, " "))}</strong>: ${val}
            </div>`,
            )
            .join("")}
        </div>
      </div>`;
  }

  if (data.insights && data.insights.length) {
    html += `
      <div class="response-section">
        <div class="section-title">Insights</div>
        <div class="positive-list">
          ${data.insights.map((i) => `<div class="positive">${escapeHTML(i)}</div>`).join("")}
        </div>
      </div>`;
  }

  responseBody.innerHTML = html;
  responsePanel.classList.add("visible");

  // syntax highlight all code blocks
  document
    .querySelectorAll("pre code")
    .forEach((el) => hljs.highlightElement(el));

  responsePanel.scrollIntoView({ behavior: "smooth" });
}

// ── RENDER ERROR ──────────────────────────────────────────────
function renderError(msg, statusCode) {
  const statusLabel =
    statusCode === 422
      ? "Validation Error"
      : statusCode === 429
        ? "Rate Limited"
        : statusCode === 500
          ? "Server Error"
          : statusCode === 0
            ? "Connection Error"
            : `Error ${statusCode}`;

  responseBody.innerHTML = `
    <div class="response-section">
      <div class="section-title">${statusLabel}</div>
      <div class="issue">
        <div style="white-space:pre-line;">${escapeHTML(msg)}</div>
      </div>
    </div>`;

  responsePanel.classList.add("visible");
  showToast(`${statusLabel}: ${msg.slice(0, 60)}`);
}

// ── COPY BUTTON ───────────────────────────────────────────────
document.getElementById("copyBtn").addEventListener("click", () => {
  navigator.clipboard
    .writeText(responseBody.innerText)
    .then(() => showToast("Copied to clipboard."))
    .catch(() => showToast("Copy failed — try manually."));
});

// ── DOWNLOAD BUTTON ───────────────────────────────────────────
document.getElementById("downloadBtn").addEventListener("click", () => {
  if (!lastResponse) {
    showToast("Nothing to download yet.");
    return;
  }

  const lines = [
    `# RoastMyCode Report`,
    `Mode: ${currentMode}`,
    lastResponse.grade ? `Grade: ${lastResponse.grade}` : "",
    lastResponse.score ? `Score: ${lastResponse.score}` : "",
    "",
    lastResponse.roast ? `## Roast\n${lastResponse.roast}` : "",
    "",
    lastResponse.issues?.length
      ? `## Issues\n${lastResponse.issues.map((i) => `- ${i}`).join("\n")}`
      : "",
    "",
    lastResponse.positive?.length
      ? `## What Works\n${lastResponse.positive.map((p) => `- ${p}`).join("\n")}`
      : "",
    "",
    lastResponse.fixed
      ? `## Fixed Code\n\`\`\`\n${lastResponse.fixed}\n\`\`\``
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const blob = new Blob([lines], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `roast-${currentMode}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Downloaded as .md");
});

// ── TOAST ─────────────────────────────────────────────────────
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2800);
}

// ── ESCAPE HTML ───────────────────────────────────────────────
function escapeHTML(str) {
  if (typeof str !== "string") return String(str ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── INIT ──────────────────────────────────────────────────────
updateEditorUI();
