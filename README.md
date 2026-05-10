# **`RoastMyCode`**

A fast, brutal, and darkly entertaining **AI-powered Code Review API** built with `FastAPI` and `Groq`.  
Paste any code. Pick a personality. Receive judgment.

> _"What if the greatest minds in computing reviewed your pull request."_

---

## 🐙 Live Demo

🔗 **Base URL:** `coming soon`

---

## 🔗 Quick Links

| Link                  | Description                                     |
| --------------------- | ----------------------------------------------- |
| 🏠 Index              | Overview of all routes and quick links          |
| 🩺 Health Status      | Server health + system info + LLM status        |
| 🏓 Ping               | Lightweight alive check                         |
| 🧪 Response Reference | Success & failure response format with examples |
| 📖 Swagger UI         | Interactive API docs                            |
| 📄 ReDoc              | Clean API reference                             |

---

## 🛸 Features

- 🎭 **12 roast personalities** — from Turing to Brainrot, each with a distinct voice and style
- 📊 **2 analysis modes** — clinical code metrics and complexity oracle
- 🔧 **Fix mode** — roast + auto-corrected version of your code in one shot
- 💬 **Explain mode** — roast + plain English explanation of every issue
- ⚡ Powered by **Groq's Llama 3.3 70B** — fast, free, no credit card needed
- 📐 Consistent JSON response structure across all endpoints
- 🛡️ Input validation — safe failures, no crashes
- 📄 Auto-generated docs via Swagger UI and ReDoc

---

## 🎭 Roast Personalities

| Key                     | Name                  | Vibe                                                          |
| ----------------------- | --------------------- | ------------------------------------------------------------- |
| `turing`                | Alan Turing           | Methodical. Curious. Dissects your code like a puzzle.        |
| `dijkstra`              | Edsger W. Dijkstra    | Cold. Precise. Mathematically devastating.                    |
| `bjarne`                | Bjarne Stroustrup     | Disappointed. Not angry. Just deeply, deeply disappointed.    |
| `chad_senior_dev`       | The Senior Dev        | 10 years in. Dead inside. Allergic to bad variable names.     |
| `lame_vibe_coder`       | The Vibe Coder        | The vibes are off and the code knows it.                      |
| `unpaid_intern`         | The Intern            | Fresh out of bootcamp. Genuinely horrified.                   |
| `the_next_door_10x_dev` | The 10x Developer     | Rewrote this in their head before you finished explaining it. |
| `the_compiler`          | The Compiler          | No feelings. No mercy. Just errors.                           |
| `hype_man`              | The Hype Man          | Found the one good thing. Will not shut up about it.          |
| `translator`            | The Translator        | Your code, rewritten as the thing it deserves to be.          |
| `poet`                  | The Poet              | Your code critique. In verse.                                 |
| `hopecore`              | The Hopecore Reviewer | Your code is broken. You are not.                             |

---

## 📊 Analysis Modes

| Key                     | Name                  | Vibe                                                                |
| ----------------------- | --------------------- | ------------------------------------------------------------------- |
| `code_metrics_analysis` | Code Metrics Analyst  | Clinical. Statistical. Treats code like a system under observation. |
| `complexity_oracle`     | The Complexity Oracle | Mathematical. Analytical. Sees loops as inevitability engines.      |

---

## 🛠️ Tech Stack

<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" width="60" height="40"/><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg" width="60" height="40"/><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" width="60" height="40"/><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" width="60" height="40"/><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg" width="60" height="40"/>

---

## 🖥️ Installation

```bash
# clone the repo
git clone https://github.com/manakcodes/roastmycode.git

# navigate into the project
cd roastmycode

# create virtual environment
python3 -m venv .venv

# activate — macOS / Linux
source .venv/bin/activate

# activate — Windows
.venv\Scripts\activate

# install dependencies
pip install -r requirements.txt

# OR using uv
uv add -r requirements.txt

# add your Groq API key
echo "GROQ_API_KEY=your_key_here" > .env
echo "MODEL=llama-3.3-70b-versatile" >> .env

# run the server
uvicorn roast_my_code.main:app --reload --port 8000
```

> Get your free Groq API key at [console.groq.com](https://console.groq.com)

---

## 📡 API Endpoints

### Roast `/roast`

| Method | Endpoint              | Description                                 |
| ------ | --------------------- | ------------------------------------------- |
| `GET`  | `/roast/modes/`       | List all 13 roast personalities             |
| `POST` | `/roast/personality/` | Roast code with a chosen personality        |
| `POST` | `/roast/fix/`         | Roast + auto-corrected version of the code  |
| `POST` | `/roast/explain/`     | Roast + plain English explanation per issue |

### Analysis `/analysis`

| Method | Endpoint             | Description                                      |
| ------ | -------------------- | ------------------------------------------------ |
| `GET`  | `/analysis/modes/`   | List all analysis modes                          |
| `POST` | `/analysis/metrics/` | Run clinical code metrics or complexity analysis |

### Health `/health`

| Method | Endpoint         | Description                             |
| ------ | ---------------- | --------------------------------------- |
| `GET`  | `/health/`       | Full index — all routes and quick links |
| `GET`  | `/health/status` | Server health, system info, LLM status  |
| `GET`  | `/health/ping`   | Lightweight alive check                 |

### Test `/test`

| Method | Endpoint | Description                                          |
| ------ | -------- | ---------------------------------------------------- |
| `GET`  | `/test/` | Success and failure response reference with examples |

---

## 🦺 API Usage

Every endpoint returns the same predictable response shape — always.

### Request Body — Roast and Analysis Endpoints

```json
{
  "code": "def calc(x,y):\n  return x+y",
  "mode": "dijkstra",
  "language": "python"
}
```

### ✅ SUCCESS Response

```json
{
  "success": true,
  "status_code": 200,
  "message": "SUCCESS",
  "data": {
    "roast": "This function is an insult to structured programming. You have written a single expression masquerading as a function with no type annotations, no docstring, and no validation. It is correct by accident, not by design.",
    "score": 28,
    "score_label": "Technically alive. Professionally indefensible.",
    "grade": "F+",
    "issues": [
      "No type hints — what types does this accept",
      "No docstring — what does this function do",
      "No input validation — what if y is a string",
      "Meaningless function name — calc tells nobody anything"
    ],
    "positive": ["It returns a value — the bare minimum has been achieved"]
  },
  "error": null,
  "meta": {
    "model": "llama-3.3-70b-versatile",
    "tokens": null,
    "route": "/roast/dijkstra",
    "timestamp": "2026-05-10T10:32:11.000Z",
    "api": "RoastMyCode",
    "version": "1.0.0"
  }
}
```

### ❌ ERROR Response

```json
{
  "success": false,
  "status_code": 500,
  "message": "LLM CALL FAILED",
  "data": null,
  "error": {
    "detail": "invalid roast mode selected",
    "error_code": "LLM_ERROR"
  },
  "meta": {
    "model": "llama-3.3-70b-versatile",
    "tokens": null,
    "route": "/roast/unknown_mode",
    "timestamp": "2026-05-10T10:32:11.000Z",
    "api": "RoastMyCode",
    "version": "1.0.0"
  }
}
```

---

> `data` is always `null` on failure. `error` is always `null` on success. Hit `/test/` to see live response examples.

---

## 📊 Analysis Response — Code Metrics

```json
{
  "success": true,
  "data": {
    "overall_score": 0.41,
    "grade": "D",
    "metrics": {
      "architecture_quality": 0.3,
      "naming_quality": 0.2,
      "readability": 0.45,
      "complexity": 0.6,
      "error_handling": 0.1,
      "performance_risk": 0.55,
      "maintainability": 0.35,
      "bug_likelihood": 0.3
    },
    "risk_profile": {
      "bug_probability": 0.72,
      "production_failure_risk": 0.65,
      "refactor_need_probability": 0.88
    },
    "confidence": 0.81,
    "insights": [
      "No input validation increases production failure risk",
      "Single letter variable names reduce maintainability significantly",
      "Missing type hints prevent static analysis tooling"
    ]
  }
}
```

---

## 📑 API Docs

Once the server is running, visit:

| Page               | URL                                 |
| ------------------ | ----------------------------------- |
| Index              | http://localhost:8000/health/       |
| Swagger UI         | http://localhost:8000/docs          |
| ReDoc              | http://localhost:8000/redoc         |
| Health Status      | http://localhost:8000/health/status |
| Ping               | http://localhost:8000/health/ping   |
| Response Reference | http://localhost:8000/test/         |

---

## 🪾 Project Tree

```bash
.
├── __init__.py
├── LICENSE
├── main.py
├── pyproject.toml
├── README.md
├── requirements.txt
├── routers
│   ├── __init__.py
│   ├── analysis.py
│   ├── health.py
│   ├── roast.py
│   └── test.py
├── schemas
│   ├── __init__.py
│   └── api_schema.py
└── utility
    ├── __init__.py
    ├── groq_utility.py
    └── prompts.py

4 directories, 16 files
```

---

## 🪪 [LICENSE](https://github.com/manakcodes/roastmycode/blob/main/LICENSE)

---
