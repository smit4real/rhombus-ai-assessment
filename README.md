# Rhombus AI – Take-Home Assessment

This repository contains my solution for the **Software Engineer – Test** take-home assessment for Rhombus AI.

The goal of this submission is to demonstrate:

- risk-based test strategy
- meaningful automation focused on regression confidence
- deterministic validation of data workflows
- balanced use of UI, API, and data-layer testing
- practical and maintainable testing approaches for AI-assisted systems

---

## 📂 Repository Contents

This repo includes all required deliverables:

- `test-strategy.md`  
  Overall testing approach including:
  - top regression risks
  - automation prioritization
  - test layering strategy
  - regression execution model
  - approach to testing AI behaviour
  - flaky-test analysis

- `ci-design.md`  
  CI / regression execution design including:
  - test grouping & tagging
  - PR vs nightly vs pre-release execution
  - blocking criteria and artifacts strategy

- `/ui-tests/`  
  Playwright UI automation covering a critical user journey:
  - sign-in
  - dataset upload
  - AI-assisted pipeline execution
  - preview of transformed data
  - download of output dataset

- `/api-tests/`  
  API / network-level automated tests including:
  - authentication / session behaviour
  - dataset upload
  - pipeline lifecycle status polling
  - negative-case validation

- `/data-validation/`  
  Automated script used to verify:
  - schema correctness
  - expected row behaviour
  - deterministic and bounded output behaviour

- `README.md`  
  Setup, execution steps, and demo context

---

## 🧰 Tech Stack

| Purpose | Tool |
|--------|------|
| UI automation | Playwright (TypeScript) |
| API / network testing | Playwright request client |
| Data validation | Python 3 |
| Target system | Rhombus AI Web App |

The automation design intentionally prioritises:

- reliability  
- deterministic assertions  
- regression safety  
- signal quality over volume  

---

## ⚙️ Setup & Installation

### ✅ Requirements

- Node.js 18+
- npm
- Python 3.9+

---

### 📦 Install Playwright dependencies


---

### 🔑 Environment Variables

These values are required to run tests.

Linux / macOS

RHOMBUS_BASE_URL="https://rhombusai.com
"
RHOMBUS_EMAIL="your-login-email"
RHOMBUS_PASSWORD="your-password"


---

### 📁 Test Dataset
[fifa21 raw data v2.csv](https://github.com/user-attachments/files/24448992/fifa21.raw.data.v2.csv)


Covers:

- authentication
- dataset upload
- AI cleaning / transformation prompt
- pipeline execution & completion state
- preview of transformed output
- file download

Downloaded file is saved to:


Assertions focus on:

- behaviour
- stability
- data preview presence
- successful download
- meaningful signals, not UI cosmetics

---

### ▶ API / Network-Level Tests (Part 3)


Includes coverage for:

- authentication / token behaviour
- dataset upload endpoint
- pipeline creation
- polling execution status
- one negative case for invalid input

These tests operate in a **black-box manner** using observed network calls.

> Endpoint paths may be adjusted depending on the live application API.

---

### ▶ Data Validation Script (Part 4)

After running the UI test:


Validates:

- schema correctness
- presence of required fields
- bounded / expected row count behaviour
- deterministic output constraints

The purpose is to assert **data correctness**, not just workflow success.

---

## 🔍 What Was Intentionally Not Automated (Yet)

To avoid noise & fragility, the following were not automated:

- pixel-level UI layout or visual testing
- highly variable AI free-text outputs
- exhaustive transformation permutations
- purely cosmetic UI behaviour

These areas are better suited for:

- exploratory testing
- manual risk review
- later phased automation

The submitted automation instead focuses on:

- high-value regression flows
- deterministic validation
- data correctness
- stability

---

## 🎥 Demo Video (Part 7)

The video walkthrough demonstrates:

- UI automation workflow
- API / network-level tests
- data-validation execution and results

🎬 Demo video link:  
<insert shareable link here>

---

## 📝 Notes

- Assertions intentionally prioritise:
  - schema integrity
  - correct behaviour
  - deterministic outcomes

- AI behaviour is validated through:
  - structure & invariants
  - not brittle text comparisons

- Tests are written to be:
  - meaningful
  - maintainable
  - regression-oriented
  - production-focused

---

Thanks for reviewing this assessment.


